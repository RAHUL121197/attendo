import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRuntimeConfig } from './config.js';
import { pool } from './db.js';

assertRuntimeConfig();
const filename = fileURLToPath(import.meta.url);
const schema = await fs.readFile(path.join(path.dirname(filename), 'schema.sql'), 'utf8');
try {
  await pool.query(schema);
  console.log('Neon schema applied successfully.');
} finally {
  await pool.end();
}
