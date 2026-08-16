import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const here = path.dirname(fileURLToPath(import.meta.url));

try {
  await pool.query(fs.readFileSync(path.join(here, 'schema.sql'), 'utf8'));
  console.log('[migrate] схема применена');
} catch (e) {
  console.error('[migrate] ошибка:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
