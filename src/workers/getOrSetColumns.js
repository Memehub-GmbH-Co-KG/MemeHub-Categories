const { log } = require('../log');
module.exports.build = function build(config, redis, memes, publishers) {
    async function getOrSetColumns(newColumns) {
        const oldColumns = parseInt(await redis.get(config.keyColumns));

        if (typeof newColumns !== 'number' || oldColumns === newColumns)
            return oldColumns;

        await redis.set(config.keyColumns, newColumns);
        await publishers.columnsChanged.publish(newColumns);
        return newColumns;
    }

    return getOrSetColumns;
}