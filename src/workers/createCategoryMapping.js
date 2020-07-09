const { setMappings } = require("../util");

module.exports.build = function (config, redis, memes, publishers) {

    async function createCategoryMapping({ key, category }) {

        // Add the mapping to the hset
        const result = await redis.hset(config.keyMappings, key, category);
        const mappings = await redis.hgetall(config.keyMappings);

        // Check if it has been created
        if (result < 1)
            return { created: false, mappings };

        // Emit event and return
        setMappings(mappings);
        await publishers.categoryMappingCreated.publish({ created: key, category, mappings });
        return { created: true, mappings };
    }

    return createCategoryMapping;
}