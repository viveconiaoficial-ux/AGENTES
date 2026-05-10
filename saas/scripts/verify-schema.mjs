import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const ENV_PATH = resolve(".env.local");
const env = {};
const raw = await readFile(ENV_PATH, "utf8");
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2];
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[m[1]] = v;
}

const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

async function q(label, sql) {
  const { rows } = await client.query(sql);
  console.log(`\n──── ${label} ────`);
  for (const r of rows) console.log(JSON.stringify(r));
}

await q(
  "Columnas relevantes",
  `select table_name, column_name, data_type
   from information_schema.columns
   where table_schema='public'
     and table_name in ('negocios','mensajes','citas','sesiones','agent_errors')
   order by table_name, ordinal_position`
);

await q(
  "RLS activado",
  `select c.relname as tabla, c.relrowsecurity as rls_on
   from pg_class c
   join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public'
     and c.relname in ('negocios','mensajes','citas','sesiones','agent_errors')
   order by c.relname`
);

await q(
  "Políticas",
  `select schemaname, tablename, policyname, cmd
   from pg_policies
   where schemaname='public'
   order by tablename, policyname`
);

await q(
  "Triggers",
  `select event_object_table as tabla, trigger_name, action_timing, event_manipulation
   from information_schema.triggers
   where trigger_schema in ('public','auth')
     and trigger_name in ('trg_negocios_updated','trg_citas_updated','on_auth_user_created')
   order by trigger_name`
);

await q(
  "Funciones",
  `select proname, pg_get_function_arguments(p.oid) as args
   from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and proname in ('set_updated_at','handle_new_user','is_owner_of')
   order by proname`
);

await client.end();
console.log("\n✅ Verificación completa");
