
module.exports.build = function (config, redis, memes, publishers) {

    async function getCategories(meme_id) {

        // Get current categories
        const meme = await memes.findOne({ _id: meme_id }, { projection: { categories: 1 } });
        return meme.categories || [];
    }

    return getCategories;
}