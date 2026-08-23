// ============================================================
//  Optimizar el hero de la portada
// ============================================================
//  heroprueba.png pesa 1.9 MB y se descarga en CADA visita a la portada.
//  Es, por lejos, el archivo más caro del sitio: pesa más que todas las
//  fotos del listado juntas.
//
//  Este script lo convierte a WebP (~150 KB, unas 12 veces menos), lo sube
//  al bucket como heroprueba.webp y deja el PNG original en su lugar por
//  si hay que volver atrás.
//
//   npm i sharp
//   npm run optimizar:hero              → convierte y te dice cuánto ahorra
//   npm run optimizar:hero -- --subir   → además lo sube al bucket
//
//  Después hay que cambiar UNA línea en app/page.tsx: .png por .webp.
//  El script te la muestra al final.

import fs from "fs";
import path from "path";
import { cargarEnv } from "./_env.mjs";

cargarEnv(".env.local");

const subir = process.argv.includes("--subir");
const BUCKET = "FotosPagina";
const ORIGEN = "heroprueba.png";
const DESTINO = "heroprueba.webp";

// El hero se ve a todo el ancho de la pantalla, así que le damos más
// resolución y más calidad que a una foto de propiedad.
const ANCHO = 2000;
const CALIDAD = 82;

const DIR = path.join(process.cwd(), "backup", "fotospagina");
const entrada = path.join(DIR, ORIGEN);
const salida = path.join(DIR, DESTINO);

if (!fs.existsSync(entrada)) {
  console.error(`No existe ${entrada}\nCorré primero:  npm run rescate:logos`);
  process.exit(1);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("Falta sharp.  npm i sharp");
  process.exit(1);
}

const antes = fs.statSync(entrada).size;
const meta = await sharp(entrada).metadata();

console.log(`\n🖼️  HERO DE LA PORTADA\n`);
console.log(`   original   ${ORIGEN}`);
console.log(`   medidas    ${meta.width} × ${meta.height} px`);
console.log(`   peso       ${(antes / 1048576).toFixed(2)} MB\n`);

await sharp(entrada)
  .resize({ width: ANCHO, withoutEnlargement: true })
  .webp({ quality: CALIDAD, effort: 6 })
  .toFile(salida);

const despues = fs.statSync(salida).size;
const ahorro = (1 - despues / antes) * 100;

console.log(`   convertido ${DESTINO}`);
console.log(`   peso       ${(despues / 1024).toFixed(0)} KB`);
console.log(`   ahorro     ${ahorro.toFixed(1)}%  (${(antes / despues).toFixed(1)}× más liviano)\n`);

// Cuánto significa en tráfico mensual
const visitas = 1000;
const ahorroMB = ((antes - despues) * visitas) / 1048576;
console.log(`   Cada 1000 visitas a la portada ahorrás ${ahorroMB.toFixed(0)} MB de tráfico.`);
console.log(`   Sobre los 5 GB gratis de Supabase, eso es ${((ahorroMB / 5120) * 100).toFixed(0)}% del cupo mensual.\n`);

if (!subir) {
  console.log(`   Modo PRUEBA. El archivo quedó en backup/fotospagina/${DESTINO}`);
  console.log(`   pero NO se subió.`);
  console.log(`\n   Para subirlo:  npm run optimizar:hero -- --subir\n`);
  process.exit(0);
}

// ── Subir ───────────────────────────────────────────────────
const { createClient } = await import("@supabase/supabase-js");
const URL_NUEVA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_NUEVA || !KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const sb = createClient(URL_NUEVA, KEY, { auth: { persistSession: false } });

const { error } = await sb.storage.from(BUCKET).upload(DESTINO, fs.readFileSync(salida), {
  contentType: "image/webp",
  cacheControl: "31536000",
  upsert: true,
});

if (error) {
  console.error(`   ✗ No se pudo subir: ${error.message}`);
  process.exit(1);
}

const url = `${URL_NUEVA.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${DESTINO}`;

// Verificamos que responda de verdad antes de decirte que cambies el código
const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15000) }).catch(() => null);

if (!res?.ok) {
  console.error(`   ⚠️  Se subió pero no responde (HTTP ${res?.status ?? "sin respuesta"}).`);
  console.error(`      Revisá que el bucket ${BUCKET} sea público antes de tocar el código.`);
  process.exit(1);
}

console.log(`   ✅ Subido y respondiendo:\n      ${url}\n`);
console.log(`   ─────────────────────────────────────────────────────────`);
console.log(`   ÚLTIMO PASO — cambiá esta línea en app/page.tsx:\n`);
console.log(`     de:   …/FotosPagina/heroprueba.png`);
console.log(`     a:    …/FotosPagina/heroprueba.webp\n`);
console.log(`   El PNG original queda en el bucket por si querés volver atrás.`);
console.log(`   ─────────────────────────────────────────────────────────\n`);

process.exit(0);
