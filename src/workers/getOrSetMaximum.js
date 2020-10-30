const { log } = require('../log');
module.exports.build = function build(config, redis, memes, publishers) {
    async function getOrSetMaximum(newMaximum) {
        const oldMaximum = parseInt(await redis.get(config.redis.keys.maximum));

        if (typeof newMaximum !== 'number' || oldMaximum === newMaximum)
            return oldMaximum;

        await redis.set(config.redis.keys.maximum, newMaximum);
        await publishers.maximumChanged.publish(newMaximum);
        return newMaximum;
    }

    return getOrSetMaximum;
}