const { log } = require('../log');
module.exports.build = function build(config, redis, memes, publishers) {
    async function getOrSetMaximum(newMaximum) {
        const oldMaximum = parseInt(await redis.get(config.keyMaximum));

        if (typeof newMaximum !== 'number' || oldMaximum === newMaximum)
            return oldMaximum;

        await redis.set(config.keyMaximum, newMaximum);
        await publishers.maximumChanged.publish(newMaximum);
        return newMaximum;
    }

    return getOrSetMaximum;
}