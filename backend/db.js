// a thin wrapper around pg Pool
import { Pool } from 'pg';

const pool = new Pool({
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  port:     Number(process.env.DB_PORT) || 5432,
  ssl:      { rejectUnauthorized: false } // adjust if you use SSL
});

export default pool;
