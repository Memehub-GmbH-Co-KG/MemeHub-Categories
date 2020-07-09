
module.exports.build = function build(config, redis, memes, publishers) {
    async function listCategories() {
        return await redis.smembers(config.keyCategories);
    }

    return listCategories;
}