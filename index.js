const { Defaults } = require('redis-request-broker');
const log = require('./src/log');
const _categories = require('./src/categories');
const yaml = require('js-yaml');
const fs = require('fs');
let categories;
let shuttingDown = false;

async function start() {
    console.log("Starting up...");

    // Load config
    let config;
    try {
        config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));
    } catch (e) {
        console.error('Cannot load config file. Exiting.');
        console.error(e);
        process.exit(1);
    }

    // Set rrb defaults
    Defaults.setDefaults({
        redis: config.redis
    });


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

start();
process.on('SIGINT', stop);
process.on('SIGQUIT', stop);
process.on('SIGTERM', stop);