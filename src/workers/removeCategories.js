
const { validateCategories } = require('../util');

module.exports.build = function (config, redis, memes, publishers) {

    async function removeCategories({ meme_id, categories, validate }) {

        // Do category validation
        if (validate)
            categories = validateCategories(categories);

        if (categories.length < 1)
            return false;

        // Update categories
        const result = await memes.findOneAndUpdate({ _id: meme_id }, { $pull: { categories: { $in: categories } } }, {
            projection: {
                group_message_id: 1
            }
        });

        if (!result.value)
            return false;

        // Emit event and return
        await publishers.edit.publish({ meme_id, in_group: !!result.value.group_message_id });
        return true;
    }

    return removeCategories;
}