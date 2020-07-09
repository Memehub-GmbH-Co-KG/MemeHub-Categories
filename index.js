
const log = require('./src/log');
const categories = require('./src/categories');
const yaml = require('js-yaml');
const fs = require('fs');


async function start() {
    console.log("Starting up...");

    // Load config
    let config;
    try {
        config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));
    } catch (e) {
        console.error('Cannot load config file. Exiting.');
        console.error(e);
        process.exit(1);
    }

    try {
        await log.start();
    }
    catch (error) {
        log.log('error', 'Error during startup', error);
        await stop();
    }

}

async function stop() {
    try {

    }

}