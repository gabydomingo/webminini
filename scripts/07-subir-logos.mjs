// ============================================================
//  Subir los logos e institucionales al bucket FotosPagina
// ============================================================
//  El header, el hero de la portada, el footer y los sellos del Colegio y
//  la Cámara están escritos a mano en el código con su nombre de archivo
//  exacto. Si el nombre no coincide letra por letra —incluidos espacios y
//  acentos— la imagen da 404.
//
//  Por eso conviene subirlos con este script y no a mano: el navegador o
//  el dashboard pueden cambiar espacios, acentos o mayúsculas sin avisar.
//
//   npm run subir:logos             → dice qué subiría, sin tocar nada
//   npm run subir:logos -- --subir  → los sube
//
//  Lee de: backup/fotospagina/   (lo que dejó npm run rescate:logos)

import fs from "fs";
import path from "path";
import { cargarEnv } from "./_env.mjs";
import { createClient } from "@supabase/supabase-js";

cargarEnv(".env.local");

const BUCKET = "FotosPagina";
const subir = process.argv.includes("--subir");

const URL_NUEVA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_NUEVA || !KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const sb = createClient(URL_NUEVA, KEY, { auth: { persistSession: false } });
const DIR = path.join(process.cwd(), "backup", "fotospagina");

if (!fs.existsSync(DIR)) {
  console.error(`No existe ${DIR}\nCorré primero:  npm run rescate:logos`);
  process.exit(1);
}

// Los que el código referencia por nombre exacto. Si falta alguno de estos,
// hay un agujero visible en la web.
const CRITICOS = {
  "logo-letra-negra.png": "logo del header (tema claro)",
  "1.png": "logo del header (tema oscuro)",
  "2.png": "logo del detalle de propiedad y metadatos",
  "heroprueba.png": "imagen grande de la portada",
  "romanminini.jpeg": "foto de Román",
  "fanco.jpg": "foto de Juan",
  "logo-blanco-colegio3-min.png": "sello Colegio de Martilleros",
  "Logo-Camara-con-sigla_BLANCO3.png": "sello Cámara de Administradores",
  "Copia de 1col neg compacto.png": "logo del footer",
  "screencapture-dppj-ui-mjus-gba-gob-ar-dppj-cn-ui-p-adm-consorcios-2026-05-13-20_29_58.png":
    "matrícula de Román (link del footer)",
  "screencapture-dppj-ui-mjus-gba-gob-ar-dppj-cn-ui-p-adm-consorcios-2026-05-13-20_42_28.png":
    "matrícula de Juan (link del footer)",
};

const TIPOS = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

const archivos = fs
  .readdirSync(DIR)
  .filter((f) => fs.statSync(path.join(DIR, f)).isFile())
  .sort();

const bytes = archivos.reduce((a, f) => a + fs.statSync(path.join(DIR, f)).size, 0);

console.log(`\n🎨 LOGOS E INSTITUCIONALES → bucket ${BUCKET}\n`);
console.log(`   ${archivos.length} archivos  ·  ${(bytes / 1048576).toFixed(1)} MB\n`);

// ── ¿Están todos los críticos? ──────────────────────────────
const faltanCriticos = Object.keys(CRITICOS).filter((f) => !archivos.includes(f));
if (faltanCriticos.length) {
  console.log(`   ⚠️  Faltan ${faltanCriticos.length} archivos CRÍTICOS en tu disco:`);
  for (const f of faltanCriticos) console.log(`      · ${f}  — ${CRITICOS[f]}`);
  console.log(`      Sin ellos va a quedar un hueco visible en la web.\n`);
}

// ── Qué hay ya en el bucket ─────────────────────────────────
const yaEstan = new Set();
try {
  let offset = 0;
  for (;;) {
    const { data, error } = await sb.storage.from(BUCKET).list("", { limit: 100, offset });
    if (error) throw error;
    if (!data?.length) break;
    for (const o of data) if (o.id !== null) yaEstan.add(o.name);
    if (data.length < 100) break;
    offset += 100;
  }
} catch (e) {
  console.error(`   ❌ No pude listar el bucket ${BUCKET}: ${e.message}`);
  console.error(`      ¿Existe? Fijate en Storage del proyecto nuevo.\n`);
  process.exit(1);
}

const pendientes = archivos.filter((f) => !yaEstan.has(f));

// El hero se descarga en CADA visita a la portada, así que su peso importa
// mucho más que el del resto.
const hero = archivos.find((f) => f === "heroprueba.png");
if (hero) {
  const kb = fs.statSync(path.join(DIR, hero)).size / 1024;
  if (kb > 500) {
    console.log(`   ⚠️  heroprueba.png pesa ${kb.toFixed(0)} KB y se baja en CADA`);
    console.log(`      visita a la portada. Conviene pasarlo a WebP después`);
    console.log(`      (~150 KB). Lo vemos cuando la web ya esté andando.\n`);
  }
}

console.log(`   ya en el bucket   ${String(yaEstan.size).padStart(4)}`);
console.log(`   por subir         ${String(pendientes.length).padStart(4)}\n`);

if (!pendientes.length) {
  console.log(`✅ Están todos subidos. Si la web sigue sin mostrarlos, el problema`);
  console.log(`   es otro: revisá que el bucket sea público y que next.config.ts`);
  console.log(`   tenga el hostname del proyecto nuevo.\n`);
  process.exit(0);
}

for (const f of pendientes) {
  const kb = (fs.statSync(path.join(DIR, f)).size / 1024).toFixed(0);
  const marca = CRITICOS[f] ? "⭐" : "  ";
  console.log(`   ${marca} ${String(kb).padStart(5)} KB  ${f}${CRITICOS[f] ? `   ← ${CRITICOS[f]}` : ""}`);
}

if (!subir) {
  console.log(`\n   Modo PRUEBA. No se subió nada.`);
  console.log(`   Para subirlos:  npm run subir:logos -- --subir\n`);
  process.exit(0);
}

// ── Subir ───────────────────────────────────────────────────
console.log(`\n   Subiendo…\n`);

let ok = 0, fallidas = 0;
for (const f of pendientes) {
  const ext = path.extname(f).toLowerCase();
  const contentType = TIPOS[ext] || "application/octet-stream";
  try {
    const { error } = await sb.storage.from(BUCKET).upload(f, fs.readFileSync(path.join(DIR, f)), {
      contentType,
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) throw new Error(error.message);
    ok++;
    console.log(`   ✓ ${f}`);
  } catch (e) {
    fallidas++;
    console.error(`   ✗ ${f}: ${e.message}`);
  }
}

console.log(`\n   ✅ ${ok} subidos · ${fallidas} con error`);

// ── Verificación: ¿se ven de verdad? ────────────────────────
console.log(`\n   Verificando que respondan por HTTP…\n`);

const base = `${URL_NUEVA.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}`;
let vivos = 0, muertos = [];

for (const f of Object.keys(CRITICOS)) {
  const url = `${base}/${encodeURIComponent(f)}`;
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15000) });
    if (res.ok) { vivos++; console.log(`   ✅ ${f}`); }
    else { muertos.push(f); console.log(`   ❌ ${f}  HTTP ${res.status}`); }
  } catch (e) {
    muertos.push(f);
    console.log(`   ❌ ${f}  ${e.name}`);
  }
}

console.log(`\n   ${vivos}/${Object.keys(CRITICOS).length} críticos respondiendo`);

if (muertos.length) {
  console.log(`\n   Los que fallan:`);
  for (const f of muertos) console.log(`      · ${f}`);
  console.log(`\n   Si dan 400 o 404, revisá que el bucket ${BUCKET} sea PÚBLICO`);
  console.log(`   (Storage → ${BUCKET} → Settings → Public bucket).`);
} else {
  console.log(`\n🎉 Todos los logos responden. Recargá la web con Ctrl+F5.\n`);
}

// El cliente de Supabase deja conexiones keep-alive abiertas. Node en Windows
// se queja al salir con "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)".
process.exit(0);
