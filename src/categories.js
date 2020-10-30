const { Worker, Publisher } = require('redis-request-broker');
const Redis = require('ioredis');
const MongoClient = require('mongodb').MongoClient;
const { validateCategories, setCategoires, setMappings } = require('./util');
const { log } = require('./log');


module.exports.build = async function (config) {

    let workers = {};
    let publishers = {};
    let redis = new Redis(config.redis.connection);
    let mongoClient;
    let memes;
    try {
        // Connect to mongodb
        mongoClient = new MongoClient(config.mongodb.connection, { useNewUrlParser: true, useUnifiedTopology: true });
        await mongoClient.connect();
        memes = await mongoClient.db(config.mongodb.database).createCollection(config.mongodb.collections.memes);

        // Create workers and publisher
        publishers.created = new Publisher(config.rrb.channels.categoryCreated);
        publishers.deleted = new Publisher(config.rrb.channels.categoryDeleted);
        publishers.categoryMappingCreated = new Publisher(config.rrb.channels.categories.mappingCreated);
        publishers.categoryMappingDeleted = new Publisher(config.rrb.channels.categories.mappingDeleted);
        publishers.edit = new Publisher(config.rrb.channels.meme.edited);
        publishers.maximumChanged = new Publisher(config.rrb.channels.categories.maximumChanged);
        publishers.columnsChanged = new Publisher(config.rrb.channels.categories.columnsChanged);
        workers.create = new Worker(config.rrb.channels.categories.create, require('./workers/createCategory').build(config, redis, memes, publishers));
        workers.delete = new Worker(config.rrb.channels.categories.delete, require('./workers/deleteCategory').build(config, redis, memes, publishers));
        workers.list = new Worker(config.rrb.channels.categories.list, require('./workers/listCategories').build(config, redis, memes, publishers));
        workers.createMapping = new Worker(config.rrb.channels.categories.createMapping, require('./workers/createCategoryMapping').build(config, redis, memes, publishers));
        workers.deleteMapping = new Worker(config.rrb.channels.categories.deleteMapping, require('./workers/deleteCategoryMapping').build(config, redis, memes, publishers));
        workers.mappings = new Worker(config.rrb.channels.categories.mappings, require('./workers/mappings').build(config, redis, memes, publishers));
        workers.get = new Worker(config.rrb.channels.categories.get, require('./workers/getCategories').build(config, redis, memes, publishers));
        workers.set = new Worker(config.rrb.channels.categories.set, require('./workers/setCategories').build(config, redis, memes, publishers));
        workers.add = new Worker(config.rrb.channels.categories.add, require('./workers/addCategories').build(config, redis, memes, publishers));
        workers.remove = new Worker(config.rrb.channels.categories.remove, require('./workers/removeCategories').build(config, redis, memes, publishers));
        workers.maximum = new Worker(config.rrb.channels.categories.getOrSetMaximum, require('./workers/getOrSetMaximum').build(config, redis, memes, publishers));
        workers.columns = new Worker(config.rrb.channels.categories.getOrSetColumns, require('./workers/getOrSetColumns').build(config, redis, memes, publishers));
        workers.validate = new Worker(config.rrb.channels.categories.validate, async data => validateCategories(data));

        for (const w of Object.values(workers))
            await w.listen();

        for (const p of Object.values(publishers))
            await p.connect();

        // Set defaults
        const maxIsNew = await redis.set(config.redis.keys.maximum, 5, 'NX');
        if (maxIsNew)
            await publishers.maximumChanged.publish(5);

        const colIsNew = await redis.set(config.redis.keys.columns, 4, 'NX');
        if (colIsNew)
            await publishers.columnsChanged.publish(4);

        // Get initial state
        setCategoires(await redis.smembers(config.redis.keys.categories));
        setMappings(await redis.hgetall(config.redis.keys.mappings));


    }
    catch (error) {
        await log('error', 'Failed to start MemeHub-Categories', error);
        await stop();
        throw error;
    }

    async function stop() {
        try {
            for (const w of Object.values(workers))
                await w.stop().catch(e => log('warning', 'Failed to stop MemeHub-Categories', e));

            for (const p of Object.values(publishers))
                await p.disconnect().catch(e => log('warning', 'Failed to stop MemeHub-Categories', e));

            await redis.quit();
            await mongoClient.close();
        }
        catch (error) {
            await log('warning', 'Failed to stop MemeHub-Categories', error);
        }
    }

    return { stop }

}