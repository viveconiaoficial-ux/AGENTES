// Introspecciona un proyecto Supabase usando OpenAPI + REST.
// Lee SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY desde .env.local
//
// Ejecutar:
//   node scripts/introspect.mjs

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ENV_PATH = resolve(".env.local");
const OUT_DIR = resolve("supabase", "_introspection");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

async function loadEnv() {
  const env = {};
  try {
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
  } catch {
    /* sin .env.local */
  }
  return env;
}

async function main() {
  const env = await loadEnv();
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Faltan variables. Añade a saas/.env.local:\n" +
        "  SUPABASE_URL=https://TU_PROYECTO.supabase.co\n" +
        "  SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← solo en LOCAL, nunca en frontend\n"
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  // 1) OpenAPI spec
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/openapi+json",
    },
  });

  if (!res.ok) {
    console.error(`Error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const spec = await res.json();
  const rawPath = resolve(OUT_DIR, `${stamp}.openapi.json`);
  await writeFile(rawPath, JSON.stringify(spec, null, 2));

  // 2) Procesar tablas y columnas
  const tables = {};
  const definitions = spec.definitions || spec.components?.schemas || {};
  for (const [name, def] of Object.entries(definitions)) {
    if (!def?.properties) continue;
    const required = new Set(def.required || []);
    tables[name] = Object.entries(def.properties).map(([col, p]) => {
      const type = p.format || p.type || "?";
      const desc = (p.description || "").trim();
      const pk = /<pk\/>/i.test(desc);
      const fkMatch = desc.match(/<fk[^>]*>([^<]*)/i);
      const fk = fkMatch ? fkMatch[1].trim() : "";
      return {
        column: col,
        type,
        required: required.has(col),
        default: p.default,
        pk,
        fk,
        rawDesc: desc,
      };
    });
  }

  // 3) Conteo de filas (cabecera Prefer count=exact)
  const counts = {};
  for (const t of Object.keys(tables)) {
    try {
      const r = await fetch(
        `${url}/rest/v1/${encodeURIComponent(t)}?select=*&limit=0`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: "count=exact",
          },
        }
      );
      const range = r.headers.get("content-range") || "";
      counts[t] = Number(range.split("/")[1]) || 0;
    } catch {
      counts[t] = "?";
    }
  }

  // 4) Resumen markdown
  const lines = [];
  lines.push(`# Supabase introspection`);
  lines.push(`- URL: \`${url}\``);
  lines.push(`- Fecha: ${new Date().toISOString()}`);
  lines.push("");
  const tableNames = Object.keys(tables).sort();
  if (!tableNames.length) {
    lines.push("⚠️ No se han detectado tablas en el schema `public`.");
  } else {
    lines.push(`## Tablas (${tableNames.length})`);
    lines.push("");
    for (const t of tableNames) {
      lines.push(`### \`${t}\` — ${counts[t] ?? 0} filas`);
      lines.push("");
      lines.push("| columna | tipo | required | default | pk | fk |");
      lines.push("|---|---|---|---|---|---|");
      for (const c of tables[t]) {
        lines.push(
          `| \`${c.column}\` | \`${c.type}\` | ${c.required ? "✓" : ""} | ${
            c.default ?? ""
          } | ${c.pk ? "✓" : ""} | ${c.fk || ""} |`
        );
      }
      lines.push("");
    }
  }

  const mdPath = resolve(OUT_DIR, "summary.md");
  await writeFile(mdPath, lines.join("\n"));

  console.log("✅ Introspección completada");
  console.log("   OpenAPI crudo:", rawPath);
  console.log("   Resumen:      ", mdPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
