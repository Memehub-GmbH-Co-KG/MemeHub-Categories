const { Defaults, Subscriber } = require('redis-request-broker');
const log = require('./src/log');
const _categories = require('./src/categories');
let categories;
let shuttingDown = false;
let restartSubscriber;

async function start() {
    console.log("Starting up...");

    // Set rrb defaults
    Defaults.setDefaults({
        redis: {
            prefix: "mh:",
            port: 6379,
            host: "127.0.0.1",
        }
    });

    // Load config
    const config = await getConfig().catch(e => {
        console.error('Cannot load config. Exiting.');
        console.error(e);
        process.exit(1);
    });

    // Trigger restart on config change
    restartSubscriber = new Subscriber(config.rrb.channels.config.changed, onConfigChange);
    await restartSubscriber.listen();

    try {
        await log.start(config);
        categories = await _categories.build(config);
        await log.log('notice', 'Startup complete');
    }
    catch (error) {
        log.log('error', 'Error during startup', error);
        await stop();
    }
}

async function stop() {
    if (shuttingDown)
        return;
    shuttingDown = true;

    try {
        await log.log('notice', 'Shutting down...');
        restartSubscriber && restartSubscriber.stop();
        if (categories)
            await categories.stop().catch(e => log.log('warning', 'Failed to stop categories', e));
        await log.stop();
        console.log('Shutdown complete.');
    }
    catch (error) {
        log.log('warning', 'Error during shutdown', error);
    }
    finally {
        shuttingDown = false;
    }
}

async function restart() {
    await stop();
    await start();
}

async function onConfigChange(keys) {
    if (!Array.isArray(keys))
        restart();

    if (keys.some(k => k.startsWith('redis') || k.startsWith('rrb') || k.startsWith('mongodb')))
        restart();
}

async function getConfig() {
    const client = new Client('config:get', { timeout: 10000 });
    await client.connect();
    const [redis, rrb, mongodb] = await client.request(['redis', 'rrb', 'mongodb']);
    await client.disconnect();
    return { redis, rrb, mongodb };
}

start();
process.on('SIGINT', stop);
process.on('SIGQUIT', stop);
process.on('SIGTERM', stop);