import Knex from 'knex';
import Config from './config';

const { mysql: connection } = Config;

export default Knex({
  client: 'mysql',
  connection,
});
