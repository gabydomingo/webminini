// ============================================================
//  PASO 4 — Reescribir las URLs de las fotos en la base
// ============================================================
// Genera backup/actualizar-urls.sql con los UPDATE que cambian las URLs de
// Supabase Storage por las de R2. NO toca la base: te deja el SQL para que lo
// pegues en el SQL Editor y lo revises antes.
//
//   node scripts/04-actualizar-urls.mjs
//
// Lee: backup/properties.json  +  R2_PUBLIC_URL de .env.local

import fs from "fs";
import path from "path";
import { cargarEnv } from "./_env.mjs";

cargarEnv(".env.local");

const BACKUP = path.join(process.cwd(), "backup");
const R2 = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

if (!R2) {
  console.error("❌ Falta R2_PUBLIC_URL en .env.local (ej: https://img.tudominio.com)");
  process.exit(1);
}

const props = JSON.parse(fs.readFileSync(path.join(BACKUP, "properties.json"), "utf-8"));

function aR2(url, variante = "full") {
  // https://<ref>.supabase.co/storage/v1/object/public/propiedades/abc.jpg
  //   → https://img.tudominio.com/full/propiedades/abc.webp
  const m = String(url).match(/\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return null;
  const [, bucket, key] = m;
  const webp = decodeURIComponent(key).replace(/\//g, "__").replace(/\.[^.]+$/, "") + ".webp";
  return `${R2}/${variante}/${bucket}/${webp}`;
}

const lineas = [
  "-- Reescritura de URLs de imágenes: Supabase Storage → Cloudflare R2",
  "-- Generado por scripts/04-actualizar-urls.mjs",
  "-- Revisá y ejecutá en el SQL Editor de Supabase.",
  "",
  "BEGIN;",
  "",
  "-- Copia de seguridad de las URLs viejas, por las dudas:",
  "CREATE TABLE IF NOT EXISTS properties_images_backup AS",
  "  SELECT id, images, now() AS respaldado_el FROM properties;",
  "",
];

let convertidas = 0, sinConvertir = 0;

for (const p of props) {
  const nuevas = [];
  for (const u of p.images || []) {
    const n = aR2(u);
    if (n) {
      nuevas.push(n);
      convertidas++;
    } else {
      nuevas.push(u);
      sinConvertir++;
    }
  }
  if (!nuevas.length) continue;
  const arr = "ARRAY[" + nuevas.map((u) => `'${u.replace(/'/g, "''")}'`).join(", ") + "]::text[]";
  lineas.push(`UPDATE properties SET images = ${arr} WHERE id = '${p.id}';`);
}

lineas.push("", "COMMIT;", "");
lineas.push("-- Para volver atrás si algo sale mal:");
lineas.push("--   UPDATE properties p SET images = b.images");
lineas.push("--   FROM properties_images_backup b WHERE b.id = p.id;");

const dest = path.join(BACKUP, "actualizar-urls.sql");
fs.writeFileSync(dest, lineas.join("\n"));

// Además, un JSON con el mapeo por si querés usar la API en vez de SQL
const mapa = {};
for (const p of props) for (const u of p.images || []) { const n = aR2(u); if (n) mapa[u] = n; }
fs.writeFileSync(path.join(BACKUP, "mapa-urls.json"), JSON.stringify(mapa, null, 2));

console.log(`\n✅ Generado: backup/actualizar-urls.sql`);
console.log(`   ${props.length} propiedades · ${convertidas} URLs convertidas · ${sinConvertir} sin convertir`);
console.log(`   Base R2: ${R2}`);
console.log(`\n   Ejemplo:`);
const [de, a] = Object.entries(mapa)[0] || [];
if (de) {
  console.log(`     antes:  ${de}`);
  console.log(`     ahora:  ${a}`);
}
console.log(`\n   Pegá backup/actualizar-urls.sql en el SQL Editor y ejecutalo.\n`);
