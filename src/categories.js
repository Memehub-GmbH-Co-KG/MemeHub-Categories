const { Worker, Publisher } = require('redis-request-broker');
const Redis = require('ioredis');
const MongoClient = require('mongodb').MongoClient;
const { validateCategories } = require('./util');
const { log } = require('./log');


module.exports.build = async function (config) {

    let workers = {};
    let publishers = {};
    let redis = new Redis(config.redis);
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
        publishers.categoryMappingCreated = new Publisher(config.rrb.channels.categoryMappingCreated);
        publishers.categoryMappingDeleted = new Publisher(config.rrb.channels.categoryMappingDeleted);
        publishers.edit = new Publisher(config.rrb.channels.memeEdited);
        publishers.maximumChanged = new Publisher(config.rrb.channels.maximumChanged);
        workers.create = new Worker(config.rrb.queues.categoriesCreate, require('./workers/createCategory').build(config, redis, memes, publishers));
        workers.delete = new Worker(config.rrb.queues.categoriesDelete, require('./workers/deleteCategory').build(config, redis, memes, publishers));
        workers.list = new Worker(config.rrb.queues.categoriesList, require('./workers/listCategories').build(config, redis, memes, publishers));
        workers.createMapping = new Worker(config.rrb.queues.categoriesCreateMapping, require('./workers/createCategoryMapping').build(config, redis, memes, publishers));
        workers.deleteMapping = new Worker(config.rrb.queues.categoriesDeleteMapping, require('./workers/deleteCategoryMapping').build(config, redis, memes, publishers));
        workers.mappings = new Worker(config.rrb.queues.categoriesMappings, require('./workers/mappings').build(config, redis, memes, publishers));
        workers.get = new Worker(config.rrb.queues.categoriesGet, require('./workers/getCategories').build(config, redis, memes, publishers));
        workers.set = new Worker(config.rrb.queues.categoriesSet, require('./workers/setCategories').build(config, redis, memes, publishers));
        workers.add = new Worker(config.rrb.queues.categoriesAdd, require('./workers/addCategories').build(config, redis, memes, publishers));
        workers.remove = new Worker(config.rrb.queues.categoriesRemove, require('./workers/removeCategories').build(config, redis, memes, publishers));
        workers.maximum = new Worker(config.rrb.queues.categoriesGetOrSetMaximum, require('./workers/getOrSetMaximum').build(config, redis, memes, publishers));
        workers.validate = new Worker(config.rrb.queues.categoriesValidate, async data => validateCategories(data));

        for (const w of Object.values(workers))
            await w.listen();

        for (const p of Object.values(publishers))
            await p.connect();

        // Set defaults
        const maxIsNew = await redis.set(config.keyMaximum, 5, 'NX');
        if (maxIsNew)
            await publishers.maximumChanged.publish(5);

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
        }
        catch (error) {
            await log('warning', 'Failed to stop MemeHub-Categories', error);
        }
    }

    return { stop }

}