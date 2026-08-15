// ============================================================
//  PLAN B — Rescatar fotos del WordPress viejo
// ============================================================
// El CSV prod-nini.csv (export de la web vieja) tiene 740 URLs de fotos que
// estaban en administracionminini.com, cubriendo 54 de las 150 propiedades.
//
// ⚠️  AL 13/08/2026 ESE DOMINIO YA NO EXISTE: no resuelve por DNS ni en apex
//     ni en www (verificado). Se dio de baja o venció. Por eso este script
//     tiene dos modos:
//
//   node scripts/rescate-wordpress.mjs --listar    → diagnóstico: ¿vive el dominio?
//   node scripts/rescate-wordpress.mjs             → baja del sitio vivo si revivió
//   node scripts/rescate-wordpress.mjs --wayback   → baja lo que haya en archive.org
//
// El modo --wayback busca cada foto en el Archivo de Internet. Ojo: el Wayback
// guarda páginas, no siempre todas las imágenes, así que el rendimiento
// esperable es bajo (quizás 5-20 %). Es gratis y no molesta a nadie, pero NO
// reemplaza al rescate de Supabase: ahí están las 2817.
//
// Salida: backup/wordpress/  (después pasan por 02-comprimir.mjs igual)

import fs from "fs";
import path from "path";

const CSV = path.join(process.cwd(), "prod-nini.csv");
const DEST = path.join(process.cwd(), "backup", "wordpress");
const CONCURRENCIA = 4;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const modoWayback = process.argv.includes("--wayback");
const soloListar = process.argv.includes("--listar");

if (!fs.existsSync(CSV)) {
  console.error("No encuentro prod-nini.csv en la raíz del proyecto.");
  process.exit(1);
}

// --- parser CSV mínimo que respeta comillas ---
function parseCSV(texto) {
  const filas = [];
  let campo = "", fila = [], enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }
        else enComillas = false;
      } else campo += c;
    } else if (c === '"') enComillas = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

const filas = parseCSV(fs.readFileSync(CSV, "utf-8"));
const cab = filas[0].map((h) => h.replace(/^﻿/, "").trim());
const sinAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const iImg = cab.findIndex((h) => sinAcento(h) === "imagenes");
const iNom = cab.indexOf("Nombre");

if (iImg === -1) {
  console.error("No encontré la columna «Imágenes» en el CSV.");
  process.exit(1);
}

const tareas = [];
const vistas = new Set();
for (const f of filas.slice(1)) {
  const nombre = (f[iNom] || "sin-nombre").trim();
  const urls = (f[iImg] || "").split(",").map((u) => u.trim()).filter((u) => u.startsWith("http"));
  urls.forEach((u, n) => {
    if (vistas.has(u)) return;
    vistas.add(u);
    tareas.push({ url: u, nombre, n });
  });
}

function limpiar(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

console.log(`\n📥 ${tareas.length} fotos únicas de ${new Set(tareas.map((t) => t.nombre)).size} propiedades`);

// --- ¿El sitio original sigue en pie? -------------------------------
function variantes(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  const out = [];
  for (const h of [host, `www.${host}`]) {
    for (const proto of ["https:", "http:"]) {
      const v = new URL(u);
      v.hostname = h;
      v.protocol = proto;
      out.push(v.toString());
    }
  }
  return [...new Set(out)];
}

async function sondearSitioVivo() {
  console.log("\n🔎 ¿Sigue online administracionminini.com?\n");
  for (const v of variantes(tareas[0].url)) {
    try {
      const res = await fetch(v, { method: "HEAD", signal: AbortSignal.timeout(12000), headers: { "User-Agent": UA } });
      const tipo = res.headers.get("content-type") || "";
      const ok = res.ok && tipo.startsWith("image/");
      console.log(`   ${ok ? "✅" : "⚠️ "} ${v.slice(0, 68)} → HTTP ${res.status} ${tipo}`);
      if (ok) return `${new URL(v).protocol}//${new URL(v).hostname}`;
    } catch (err) {
      console.log(`   ❌ ${v.slice(0, 68)} → ${err.cause?.code || err.name}`);
    }
  }
  return null;
}

// --- Wayback Machine ------------------------------------------------
async function urlWayback(original) {
  // el sufijo "id_" pide el archivo tal cual, sin la barra de navegación
  const u = `https://web.archive.org/web/2id_/${original}`;
  try {
    const res = await fetch(u, { method: "HEAD", signal: AbortSignal.timeout(20000), headers: { "User-Agent": UA } });
    if (res.ok && (res.headers.get("content-type") || "").startsWith("image/")) return u;
  } catch {}
  return null;
}

// --- Modo diagnóstico ------------------------------------------------
if (soloListar) {
  const porProp = {};
  for (const t of tareas) porProp[t.nombre] = (porProp[t.nombre] || 0) + 1;
  for (const [n, c] of Object.entries(porProp).slice(0, 12)) {
    console.log(`   ${String(c).padStart(3)} fotos  ${n.slice(0, 55)}`);
  }
  console.log(`   … y ${Math.max(0, Object.keys(porProp).length - 12)} propiedades más`);

  const vivo = await sondearSitioVivo();
  if (vivo) {
    console.log(`\n🎉 El WordPress responde en ${vivo}.\n   Corré: node scripts/rescate-wordpress.mjs\n`);
  } else {
    console.log("\n😐 El dominio no resuelve. Probando el Archivo de Internet sobre 5 fotos...\n");
    let hits = 0;
    for (const t of tareas.slice(0, 5)) {
      const w = await urlWayback(t.url);
      console.log(`   ${w ? "✅ archivada" : "❌ sin copia"}  ${t.url.split("/").pop().slice(0, 45)}`);
      if (w) hits++;
    }
    console.log(
      hits
        ? `\n   ${hits}/5 tienen copia. Vale la pena: node scripts/rescate-wordpress.mjs --wayback\n`
        : `\n   Ninguna de las 5 está archivada. El rendimiento sería casi nulo.\n   Concentrate en el rescate de Supabase: node scripts/00-test-storage.mjs\n`
    );
  }
  process.exit(0);
}

// --- Descarga -------------------------------------------------------
let baseViva = null;
if (!modoWayback) {
  baseViva = await sondearSitioVivo();
  if (!baseViva) {
    console.log("\n😐 El WordPress viejo no responde en ninguna variante (apex/www, https/http).");
    console.log("   Probá el Archivo de Internet:  node scripts/rescate-wordpress.mjs --wayback");
    console.log("   Y sobre todo, el rescate real:  node scripts/00-test-storage.mjs\n");
    process.exit(1);
  }
  console.log(`\n✅ Bajando desde ${baseViva}\n`);
} else {
  console.log(`\n🏛️  Modo Archivo de Internet (web.archive.org). Va lento a propósito para no saturarlo.\n`);
}

fs.mkdirSync(DEST, { recursive: true });

let ok = 0, skip = 0, fail = 0, bytes = 0;
const fallidos = [];
let cursor = 0;

async function worker() {
  while (cursor < tareas.length) {
    const t = tareas[cursor++];
    const ext = (path.extname(new URL(t.url).pathname) || ".jpg").split("?")[0];
    const dir = path.join(DEST, limpiar(t.nombre));
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, `${String(t.n).padStart(2, "0")}${ext}`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { skip++; continue; }

    let url;
    if (modoWayback) {
      url = await urlWayback(t.url);
      if (!url) {
        fail++;
        fallidos.push({ url: t.url, error: "sin copia en el Wayback" });
        continue;
      }
      await new Promise((r) => setTimeout(r, 400)); // cortesía con archive.org
    } else {
      const u = new URL(t.url);
      u.protocol = new URL(baseViva).protocol;
      u.hostname = new URL(baseViva).hostname;
      url = u.toString();
    }

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000), headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) throw new Error("archivo vacío");
      fs.writeFileSync(dest, buf);
      bytes += buf.length;
      ok++;
    } catch (err) {
      fail++;
      fallidos.push({ url, error: err.message });
    }

    const h = ok + skip + fail;
    if (h % 10 === 0 || h === tareas.length) {
      process.stdout.write(`\r   ${((h / tareas.length) * 100).toFixed(1)}%  ✓${ok} ⏭${skip} ✗${fail}  (${(bytes / 1048576).toFixed(0)} MB)   `);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCIA }, worker));

if (fallidos.length) {
  fs.writeFileSync(path.join(process.cwd(), "backup", "wordpress-fallidos.json"), JSON.stringify(fallidos, null, 2));
}
console.log(`\n\n✅ ${ok} fotos rescatadas (${(bytes / 1048576).toFixed(0)} MB) · ${skip} ya estaban · ${fail} sin suerte`);
console.log(`   Carpeta: ${DEST}`);
if (fallidos.length) console.log(`   Detalle: backup/wordpress-fallidos.json`);
console.log("");
