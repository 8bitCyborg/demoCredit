import knex from 'knex';
import config from '../../knexfile.js';

const db = knex(config.development as any);
export default db;