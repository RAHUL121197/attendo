import bcrypt from 'bcryptjs';
import { assertRuntimeConfig } from './config.js';
import { pool } from './db.js';

assertRuntimeConfig();
const passwordHash = await bcrypt.hash('123456', 12);
try {
  await pool.query(`INSERT INTO users (name, email, password_hash, role) VALUES ('Admin User', 'admin@attendo.com', $1, 'admin') ON CONFLICT (email) DO NOTHING`, [passwordHash]);
  console.log('Seed complete. Demo admin: admin@attendo.com / 123456');
} finally {
  await pool.end();
}
