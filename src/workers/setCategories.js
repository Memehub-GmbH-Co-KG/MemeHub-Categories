
const { validateCategories } = require('../util');

module.exports.build = function (config, redis, memes, publishers) {

    async function setCategories({ meme_id, categories, validate }) {

        // Do category validation
        if (validate)
            categories = validateCategories(categories);

        if (categories.length < 1)
            return false;

        // Check maximum
        const maximum = await parseInt(redis.get(config.keyMaximum));
        if (categories.length > maximum)
            return false

        // Update categories
        const result = await memes.updateOne({ _id: meme_id }, { $set: { categories } });
        if (result.modifiedCount < 1)
            return false;

        // Emit event and return
        await publishers.edit.publish(meme_id);
        return true;
    }

    return setCategories;
}