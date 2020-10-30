
module.exports.build = function build(config, redis, memes, publishers) {
    async function listCategories() {
        return await redis.smembers(config.redis.keys.categories);
    }

    return listCategories;
}