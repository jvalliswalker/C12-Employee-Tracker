import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localpath = __dirname.replace(/assets.scripts/, '');
import dotenv from 'dotenv' 

dotenv.config({
  override: true,
  path: path.join(localpath, 'postgres.env')
});

const connectToDatabase = () => {
  const newPool = new pg.Pool({
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

export { connectToDatabase }