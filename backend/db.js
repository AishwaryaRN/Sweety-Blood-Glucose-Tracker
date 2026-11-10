
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sweety_db',
  password: process.env.DB_PASSWORD,
  port: 5432,
});

pool.connect()
  .then(client => {
    console.log('PostgreSQL connected successfully!');
    client.release();
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
  });

module.exports = pool;
