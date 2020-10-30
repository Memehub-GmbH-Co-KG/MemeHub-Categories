
module.exports.build = function build(config, redis, memes, publishers) {
    async function mappings() {
        return await redis.hgetall(config.redis.keys.mappings);
    }

    return mappings;
}