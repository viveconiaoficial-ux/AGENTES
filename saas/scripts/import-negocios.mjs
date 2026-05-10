import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node import-negocios.mjs <ruta-csv>');
  process.exit(1);
}

function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQ = true;
      } else if (c === ',') {
        cur.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = '';
      } else {
        field += c;
      }
    }
  }
  if (field || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

const csv = parseCSV(fs.readFileSync(csvPath, 'utf8'));
const headers = csv[0];
const rows = csv
  .slice(1)
  .filter((r) => r.length === headers.length && r.some((c) => c && c.trim()));

const records = rows.map((r) => Object.fromEntries(r.map((v, i) => [headers[i], v])));

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  const { rows: owners } = await client.query(
    `select owner_user_id from public.negocios where owner_user_id is not null order by created_at limit 1`,
  );
  let ownerId = owners[0]?.owner_user_id;
  if (!ownerId) {
    const { rows: u } = await client.query(`select id from auth.users order by created_at limit 1`);
    ownerId = u[0]?.id;
  }
  if (!ownerId) throw new Error('No hay ningún usuario en auth.users; crea el admin primero.');
  console.log('Owner admin:', ownerId);

  let inserted = 0;
  let skipped = 0;
  for (const r of records) {
    try {
      const sql = `
        insert into public.negocios (
          id, owner_user_id, nombre, descripcion, prompt_personalizado, horario, direccion,
          evolution_host, evolution_apikey, evolution_instance,
          widget_accent, widget_bg_from, widget_bg_to
        ) values (
          $1::uuid, $2::uuid, $3, $4, $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13
        )
        on conflict (id) do update set
          nombre = excluded.nombre,
          descripcion = excluded.descripcion,
          prompt_personalizado = excluded.prompt_personalizado,
          horario = excluded.horario,
          direccion = excluded.direccion,
          widget_accent = excluded.widget_accent,
          widget_bg_from = excluded.widget_bg_from,
          widget_bg_to = excluded.widget_bg_to
      `;
      const promptCombo =
        (r.prompt_personalizado && r.prompt_personalizado.trim()) ||
        r.prompt_sistema ||
        null;
      const promptFinal = [r.prompt_sistema, r.prompt_personalizado]
        .filter((s) => s && s.trim())
        .join('\n\n---\n\n');
      await client.query(sql, [
        r.id,
        ownerId,
        r.nombre,
        r.descripcion,
        promptFinal || promptCombo,
        r.horario,
        r.direccion,
        r.evolution_host,
        r.evolution_apikey,
        r.evolution_instance,
        r.widget_accent,
        r.widget_bg_from,
        r.widget_bg_to,
      ]);
      inserted++;
      console.log(`  ✓ ${r.nombre}`);
    } catch (e) {
      skipped++;
      console.log(`  ✗ ${r.nombre}: ${e.message}`);
    }
  }
  console.log(`Insertados/actualizados: ${inserted}, fallidos: ${skipped}`);
} finally {
  await client.end();
}
