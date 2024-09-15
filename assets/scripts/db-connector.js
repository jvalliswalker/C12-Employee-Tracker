import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localpath = __dirname.replace(/assets.scripts/, '');
import dotenv from 'dotenv' 


async function connectToDatabase() {
  
  dotenv.config({
    override: true,
    path: path.join(localpath, 'postgres.env')
  });
  
  const newPool = new pg.Pool({
    user: process.env.USER,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    database: process.env.DATABASE
  },
  console.log('Connected to database employee_tracker')
  );

  try {
    await newPool.connect();
    return newPool;
  }
  catch (error){
    throw new Error(
      [
        '',
        '=========== Authentication Error =========',
        'Postgres credentials incorrect - could not connect to Postgres database. Review file postgres.env and correct credentials.',
        '=========================================='
      ].join('\n'));
  }
}

export { connectToDatabase }