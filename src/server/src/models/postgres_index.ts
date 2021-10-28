import { config } from '../config/config';
import { fileItem } from './fileItem';
import metadata from './metadata';

import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
    config.databaseName,
    config.databaseUser,
    config.databasePassword,
    {
        host: config.databaseUri,
        dialect: 'postgres',
        logging: false,
        // logging: console.log
    },
);

const models = [
    fileItem,
    metadata
];

models.forEach(model => model(sequelize));

export default sequelize;