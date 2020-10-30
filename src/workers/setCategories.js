
const { validateCategories } = require('../util');

module.exports.build = function (config, redis, memes, publishers) {

    async function setCategories({ meme_id, categories, validate }) {

        // Do category validation
        if (validate)
            categories = validateCategories(categories);

        if (categories.length < 1)
            return false;

        // Check maximum
        const maximum = await parseInt(redis.get(config.redis.keys.maximum));
        if (categories.length > maximum)
            return false

        // Update categories
        const result = await memes.findOneAndUpdate({ _id: meme_id }, { $set: { categories } }, {
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

    return setCategories;
}