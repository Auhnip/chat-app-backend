import Knex from 'knex';
import Config from './config';
import logger from './logger';

const { mysql: connection } = Config;

const Database = Knex({
  client: 'mysql',
  connection,
});

logger.info('MySQL instance initialized');

export default Database;
