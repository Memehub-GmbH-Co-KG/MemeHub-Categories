
const { escapeCategory, setCategoires } = require('../util');

module.exports.build = function (config, redis, memes, publishers) {

    async function createCategory({ category, validate }) {

        // Validate the category
        if (validate && category !== escapeCategory(category))
            return { created: false, categories: await redis.smembers(config.redis.keys.categories) };

        // Add the category to set
        const result = await redis.sadd(config.redis.keys.categories, category);
        const categories = await redis.smembers(config.redis.keys.categories);

        // Check if it has been created
        if (result < 1)
            return { created: false, categories };

        // Emit event and return
        setCategoires(categories);
        await publishers.created.publish({ created: category, categories });
        return { created: true, categories };
    }

    return createCategory;
}