import { config } from '../config/config';
import logger from '../config/winston';

const sqlite3 = require('sqlite3');

let sqliteDB = new sqlite3.Database(
    config.sqlitePath, 
    (err: string) => {
    if (err) {
        logger.error(`Can't connect to SQLite database: ${err}`);
    }

    logger.debug("Connected to SQLite database");
});

module.exports = sqliteDB;