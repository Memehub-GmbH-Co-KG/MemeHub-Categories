
const { validateCategories } = require('../util');

module.exports.build = function (config, redis, memes, publishers) {

    async function addCategories({ meme_id, categories, validate }) {

        // Do category validation
        if (validate)
            categories = validateCategories(categories);

        if (categories.length < 1)
            return false;

        // Get current categories
        const meme = await memes.findOne({ _id: meme_id }, { projection: { categories: 1 } });
        const existingCategoreis = meme.categories || [];
        categories = categories.filter(c => !existingCategoreis.includes(c));

        if (categories.length < 1)
            return false;

        // Check maximum
        const maximum = await parseInt(redis.get(config.keyMaximum));
        if (categories.length + existingCategoreis.length > maximum)
            return false;

        // Update categories
        const result = await memes.updateOne({ _id: id }, { $addToSet: { categories: { $each: categories } } });
        if (result.modifiedCount < 1)
            return false;

        // Emit event and return
        await publishers.edit.publish(meme_id);
        return true;
    }

    return addCategories;
}