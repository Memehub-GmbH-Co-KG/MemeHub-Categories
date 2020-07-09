
const { validateCategories } = require('../util');

module.exports.build = function (config, redis, memes, publishers) {

    async function removeCategories({ meme_id, categories, validate }) {

        // Do category validation
        if (validate)
            categories = validateCategories(categories);

        if (categories.length < 1)
            return false;

        // Update categories
        const result = await memes.updateOne({ _id: id }, { $pull: { categories: { $in: categories } } });
        if (result.modifiedCount < 1)
            return false;

        // Emit event and return
        await publishers.edit.publish(meme_id);
        return true;
    }

    return removeCategories;
}