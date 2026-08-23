// ============================================================
//  Radiografía: qué hay en cada lado antes de fusionar
// ============================================================
//  Mira tres cosas y las cruza:
//    1. El proyecto NUEVO (base + bucket): qué propiedades y fotos tiene hoy
//    2. Lo rescatado del viejo, en backup/originales/
//    3. El inventario del viejo, en backup/bucket_usage.json
//
//   npm run estado
//
//  Solo lee. No sube, no borra, no modifica nada.

import fs from "fs";
import path from "path";
import { cargarEnv } from "./_env.mjs";
import { createClient } from "@supabase/supabase-js";

cargarEnv(".env.local");

const URL_NUEVA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const REF_VIEJO = "cvgnpyzgglrclzxxlbsp";
const BACKUP = path.join(process.cwd(), "backup");

if (!URL_NUEVA || !KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o las claves en .env.local");
  process.exit(1);
}

const sb = createClient(URL_NUEVA, KEY, { auth: { persistSession: false } });
const refNuevo = new URL(URL_NUEVA).hostname.split(".")[0];

const n = (x) => String(x).padStart(6);
const mb = (b) => (b / 1048576).toFixed(1).padStart(7) + " MB";
const linea = (c = "─") => console.log(c.repeat(72));

console.log(`\n📊 ESTADO DE LA MIGRACIÓN`);
console.log(`   proyecto nuevo: ${refNuevo}`);
console.log(`   proyecto viejo: ${REF_VIEJO}\n`);

// ── 1. Base de datos del proyecto nuevo ─────────────────────
linea("═");
console.log("1· BASE DEL PROYECTO NUEVO");
linea();

const { data: props, error: errProps } = await sb
  .from("properties")
  .select("id, title, status, images, created_at")
  .order("created_at", { ascending: false });

if (errProps) {
  console.error(`   ❌ No pude leer properties: ${errProps.message}`);
  process.exit(1);
}

let apuntanAlViejo = 0, apuntanAlNuevo = 0, sinFotos = 0, otras = 0;
let fotosViejas = 0, fotosNuevas = 0;
const porEstado = {};
const nuevasCargadas = [];

for (const p of props) {
  porEstado[p.status] = (porEstado[p.status] || 0) + 1;
  const imgs = p.images || [];
  if (!imgs.length) { sinFotos++; continue; }
  const alViejo = imgs.filter((u) => String(u).includes(REF_VIEJO)).length;
  const alNuevo = imgs.filter((u) => String(u).includes(refNuevo)).length;
  fotosViejas += alViejo;
  fotosNuevas += alNuevo;
  if (alViejo && !alNuevo) apuntanAlViejo++;
  else if (alNuevo && !alViejo) { apuntanAlNuevo++; nuevasCargadas.push(p); }
  else otras++;
}

console.log(`   propiedades totales           ${n(props.length)}`);
console.log(`   ├─ con fotos del proyecto VIEJO ${n(apuntanAlViejo)}   ← hay que migrarles las fotos`);
console.log(`   ├─ con fotos del proyecto NUEVO ${n(apuntanAlNuevo)}   ← cargadas estos días, NO se tocan`);
console.log(`   ├─ mezcladas                    ${n(otras)}`);
console.log(`   └─ sin fotos                    ${n(sinFotos)}`);
console.log(`\n   fotos apuntando al viejo      ${n(fotosViejas)}   (rotas hasta migrar)`);
console.log(`   fotos apuntando al nuevo      ${n(fotosNuevas)}   (funcionando)`);
console.log(`\n   por estado: ${Object.entries(porEstado).map(([k, v]) => `${k}=${v}`).join("  ")}`);

if (nuevasCargadas.length) {
  console.log(`\n   Últimas cargadas en el proyecto nuevo:`);
  for (const p of nuevasCargadas.slice(0, 8)) {
    const f = new Date(p.created_at).toLocaleDateString("es-AR");
    console.log(`     · ${f}  ${(p.images?.length || 0).toString().padStart(2)} fotos  ${String(p.title).slice(0, 44)}`);
  }
  if (nuevasCargadas.length > 8) console.log(`     … y ${nuevasCargadas.length - 8} más`);
}

// ── 2. Bucket del proyecto nuevo ────────────────────────────
console.log("");
linea("═");
console.log("2· BUCKET DEL PROYECTO NUEVO");
linea();

async function listarTodo(bucket, prefijo = "") {
  const salida = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb.storage
      .from(bucket)
      .list(prefijo, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    if (!data?.length) break;
    for (const o of data) {
      if (o.id === null) continue; // es una carpeta
      salida.push({ ...o, prefijo });
    }
    if (data.length < 100) break;
    offset += 100;
  }
  return salida;
}

let usadoTotal = 0;
for (const bucket of ["propiedades", "FotosPagina"]) {
  try {
    const raiz = await listarTodo(bucket);
    let thumbs = [];
    if (bucket === "propiedades") {
      try { thumbs = await listarTodo(bucket, "thumb"); } catch {}
    }
    const todos = [...raiz, ...thumbs];
    const bytes = todos.reduce((a, o) => a + (o.metadata?.size || 0), 0);
    usadoTotal += bytes;
    const prom = todos.length ? bytes / todos.length / 1024 : 0;
    console.log(`   ${bucket.padEnd(14)} ${n(todos.length)} archivos  ${mb(bytes)}   promedio ${prom.toFixed(0)} KB`);
    if (bucket === "propiedades") {
      console.log(`     ├─ grandes    ${n(raiz.length)}`);
      console.log(`     └─ miniaturas ${n(thumbs.length)}${thumbs.length === 0 ? "   ⚠️  ninguna: el listado baja las fotos grandes" : ""}`);
    }
  } catch (e) {
    console.log(`   ${bucket.padEnd(14)} ❌ ${e.message}`);
  }
}

const LIMITE = 1024 * 1048576;
const pct = (usadoTotal / LIMITE) * 100;
console.log(`\n   TOTAL ${mb(usadoTotal)} de 1024 MB  →  ${pct.toFixed(1)}% del plan free`);
console.log(`   ${pct < 50 ? "🟢 cómodo" : pct < 80 ? "🟡 atento" : "🔴 hay que migrar a R2"}`);

// ── 3. Lo rescatado del viejo ───────────────────────────────
console.log("");
linea("═");
console.log("3· RESCATE DEL PROYECTO VIEJO (en tu disco)");
linea();

function medirCarpeta(dir) {
  if (!fs.existsSync(dir)) return null;
  let n = 0, bytes = 0;
  for (const f of fs.readdirSync(dir)) {
    const st = fs.statSync(path.join(dir, f));
    if (st.isFile()) { n++; bytes += st.size; }
  }
  return { n, bytes };
}

const inventario = fs.existsSync(path.join(BACKUP, "bucket_usage.json"))
  ? JSON.parse(fs.readFileSync(path.join(BACKUP, "bucket_usage.json"), "utf-8"))
  : [];
const esperadas = inventario.filter((o) => o.bucket === "propiedades" && o.referenced).length;
const esperadasLogos = inventario.filter((o) => o.bucket === "FotosPagina").length;

const orig = medirCarpeta(path.join(BACKUP, "originales", "propiedades"));
const logos = medirCarpeta(path.join(BACKUP, "fotospagina"));
const webpFull = medirCarpeta(path.join(BACKUP, "webp", "full", "propiedades"));
const webpThumb = medirCarpeta(path.join(BACKUP, "webp", "thumb", "propiedades"));

function fila(rotulo, r, esperado) {
  if (!r) { console.log(`   ${rotulo.padEnd(24)} ─      (todavía no)`); return; }
  const falta = esperado ? esperado - r.n : 0;
  const estado = !esperado ? "" : falta <= 0 ? "  ✅ completo" : `  ⏳ faltan ${falta}`;
  console.log(`   ${rotulo.padEnd(24)} ${n(r.n)} archivos  ${mb(r.bytes)}${estado}`);
}

fila("fotos originales", orig, esperadas);
fila("logos FotosPagina", logos, esperadasLogos);
fila("comprimidas (grandes)", webpFull);
fila("comprimidas (miniaturas)", webpThumb);

if (orig && webpFull && webpFull.bytes > 0) {
  const ahorro = (1 - (webpFull.bytes + (webpThumb?.bytes || 0)) / orig.bytes) * 100;
  console.log(`\n   compresión lograda: ${ahorro.toFixed(1)}% menos`);
}

// ── 4. Qué sigue ────────────────────────────────────────────
console.log("");
linea("═");
console.log("4· PRÓXIMO PASO");
linea();

if (!orig || orig.n < esperadas) {
  console.log(`   ▶  npm run rescate:imagenes     (faltan fotos por bajar)`);
} else if (!webpFull || webpFull.n < orig.n) {
  console.log(`   ▶  npm run fotos:comprimir      (bajadas ✅, falta comprimir)`);
} else if (apuntanAlViejo > 0) {
  console.log(`   ▶  npm run fusionar             (comprimidas ✅, falta subirlas y reescribir URLs)`);
  console.log(`      son ${apuntanAlViejo} propiedades y ${fotosViejas} fotos las que esperan`);
} else {
  console.log(`   🎉 No queda nada apuntando al proyecto viejo. Migración terminada.`);
  console.log(`      Podés borrar el bucket del proyecto viejo y bajarlo a plan free.`);
}
console.log("");

// El cliente de Supabase deja conexiones keep-alive abiertas. Node en Windows
// se queja al salir con "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)".
// Es cosmético —el trabajo ya terminó— pero asusta. Salir explícito lo evita.
process.exit(0);
