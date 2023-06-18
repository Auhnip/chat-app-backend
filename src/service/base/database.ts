import Knex from 'knex';
import Config from '../../util/config';
import logger from '../../util/logger';

const { mysql: connection } = Config;

const Database = Knex({
  client: 'mysql',
  connection,
});

logger.info('MySQL instance initialized');

export default Database;
