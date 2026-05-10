import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '..', '.env.local');
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const file = process.argv[2];
if (!file) {
  console.error('Usage: node apply-migration.mjs <relative-or-absolute-sql>');
  process.exit(1);
}

const sqlPath = path.isAbsolute(file) ? file : path.join(__dirname, '..', file);
const sql = fs.readFileSync(sqlPath, 'utf8');

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('Aplicando:', sqlPath);
try {
  await client.query(sql);
  console.log('OK');
} catch (e) {
  console.error('ERROR:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
