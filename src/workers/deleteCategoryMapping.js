
module.exports.build = function (config, redis, memes, publishers) {

    async function deleteCategoryMapping({ key }) {

        // Remove the mapping from the hset
        const result = await redis.hdel(config.keyMappings, key);
        const mappings = await redis.hgetall(config.keyMappings);

        // Check if it has been deleted
        if (result < 1)
            return { deleted: false, mappings };

        // Emit event and return
        setMappings(mappings);
        await publishers.categoryMappingDeleted.publish({ deleted: key, mappings });
        return { deleted: true, mappings };
    }

    return deleteCategoryMapping;
}