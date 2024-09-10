const { Pool } = require('pg');
const { readFile } = require('./utils');
const path = require('path');
const localpath = __dirname.replace(/assets.scripts/, '');

require('dotenv').config({
  override: true,
  path: path.join(localpath, 'postgres.env')
});

const connectToDatabase = () => {
  const newPool = new Pool({
    user: process.env.USER,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    database: process.env.DATABASE
  },
  console.log('Connected to database employee_tracker')
  );

  newPool.connect();

  return newPool;
}

module.exports = { connectToDatabase }