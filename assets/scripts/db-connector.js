const { Pool } = require('pg');
const { readFile } = require('./utils');
const path = require('path');
const localpath = __dirname.replace(/assets.scripts/, '');

// const credentials = () => {
//   const data = readFile(
//     path.join(localpath, 'credentials/credentials.json'),
//     true
//   )

//   const config = new Config(data);

//   return config;
// };

const connectToDatabase = () => {
  const newPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'employee_tracker'
  },
  console.log('Connected to database employee_tracker')
  );

  newPool.connect();

  return newPool;
}

module.exports = { connectToDatabase }