const { setCategoires } = require("../util");

module.exports.build = function (config, redis, memes, publishers) {

    async function deleteCategoty({ category }) {

        // Remove the category from set
        const result = await redis.srem(config.keyCategories, category);
        const categories = await redis.smembers(config.keyCategories);

        // Check if it has been created
        if (result < 1)
            return { deleted: false, categories };

        // Emit event and return
        setCategoires(categories);
        await publishers.deleted.publish({ deleted: category, categories });
        return { deleted: true, categories };
    }

    return deleteCategoty;
}