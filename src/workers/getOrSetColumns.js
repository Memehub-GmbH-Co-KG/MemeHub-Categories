const { log } = require('../log');
module.exports.build = function build(config, redis, memes, publishers) {
    async function getOrSetColumns(newColumns) {
        const oldColumns = parseInt(await redis.get(config.redis.keys.columns));

        if (typeof newColumns !== 'number' || oldColumns === newColumns)
            return oldColumns;

        await redis.set(config.redis.keys.columns, newColumns);
        await publishers.columnsChanged.publish(newColumns);
        return newColumns;
    }

    return getOrSetColumns;
}