// ============================================================
//  Rescate de los logos y las fotos institucionales
// ============================================================
//  El bucket FotosPagina son 29 archivos (6.8 MB) con TODA la identidad
//  visual del sitio: logos del header y del footer, el hero de la portada,
//  las fotos de Román y Juan, los sellos del Colegio y de la Cámara.
//
//  Están hardcodeados como URLs fijas en 9 archivos del código, así que
//  mientras el proyecto viejo esté pausado la web queda sin logo.
//
//  LA IDEA DE ESTE SCRIPT: esas imágenes pasan por el optimizador de
//  imágenes de Next.js, y Vercel guarda en caché las versiones optimizadas.
//  O sea que puede que sigan disponibles en:
//
//     https://propiedadesminini.com/_next/image?url=<original>&w=1920&q=75
//
//  aunque Supabase esté caído. Vale la pena probarlo: son 6.8 MB que te
//  devuelven la marca de la web sin pagar ni esperar a nadie.
//
//   node scripts/rescate-fotospagina.mjs           → intenta bajarlas
//   node scripts/rescate-fotospagina.mjs --listar  → solo muestra el plan
//
//  Salida: backup/fotospagina/

import fs from "fs";
import path from "path";

const SITIO = process.env.SITIO_URL || "https://propiedadesminini.com";
const PROJECT_REF = "cvgnpyzgglrclzxxlbsp";
const BASE_SUPABASE = `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/FotosPagina`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

// Anchos que usa el optimizador de Next por defecto. Probamos de mayor a
// menor: queremos la copia de mejor calidad que haya quedado cacheada.
const ANCHOS = [3840, 2048, 1920, 1200, 1080, 828, 750, 640, 384, 256];
const CALIDADES = [75, 100];

const BACKUP = path.join(process.cwd(), "backup");
const DEST = path.join(BACKUP, "fotospagina");
const usagePath = path.join(BACKUP, "bucket_usage.json");

if (!fs.existsSync(usagePath)) {
  console.error("Falta backup/bucket_usage.json (viene en el kit de rescate).");
  process.exit(1);
}

const objetos = JSON.parse(fs.readFileSync(usagePath, "utf-8"))
  .filter((o) => o.bucket === "FotosPagina")
  .sort((a, b) => b.size - a.size);

// Las que están hardcodeadas en el código: son las críticas, sin ellas la
// web queda sin identidad visual.
const CRITICAS = new Set([
  "logo-letra-negra.png",       // logo del header, tema claro
  "1.png",                      // logo del header, tema oscuro
  "2.png",                      // logo en detalle de propiedad y metadatos
  "heroprueba.png",             // imagen grande de la portada
  "romanminini.jpeg",           // foto de Román, en Sobre Nosotros
  "fanco.jpg",                  // foto de Juan, en Sobre Nosotros
  "logo-blanco-colegio3-min.png",       // sello Colegio de Martilleros
  "Logo-Camara-con-sigla_BLANCO3.png",  // sello Cámara
  "Copia de 1col neg compacto.png",     // logo del footer
]);

console.log(`\n🎨 FotosPagina: ${objetos.length} archivos (${(objetos.reduce((a, o) => a + o.size, 0) / 1048576).toFixed(1)} MB)`);
console.log(`   ${CRITICAS.size} son críticas (están escritas a mano en el código)\n`);

if (process.argv.includes("--listar")) {
  for (const o of objetos) {
    const critica = CRITICAS.has(o.key);
    console.log(`   ${critica ? "⭐" : "  "} ${String(Math.round(o.sizeMB * 1024)).padStart(5)} KB  ${o.key}`);
  }
  console.log(`\n   Se intentará por la caché de imágenes de ${SITIO}`);
  console.log(`   Para bajarlas: node scripts/rescate-fotospagina.mjs\n`);
  process.exit(0);
}

fs.mkdirSync(DEST, { recursive: true });

async function intentar(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const tipo = res.headers.get("content-type") || "";
    if (!tipo.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return null;
    return { buf, tipo };
  } catch {
    return null;
  }
}

let ok = 0, fail = 0, bytes = 0;
const rescatadas = [];
const perdidas = [];

for (const o of objetos) {
  const original = `${BASE_SUPABASE}/${encodeURIComponent(o.key)}`;
  const destino = path.join(DEST, o.key);

  if (fs.existsSync(destino) && fs.statSync(destino).size > 0) {
    ok++;
    continue;
  }

  let resultado = null;
  let via = "";

  // 1) caché de imágenes de Vercel, del ancho más grande al más chico
  for (const q of CALIDADES) {
    for (const w of ANCHOS) {
      const u = `${SITIO}/_next/image?url=${encodeURIComponent(original)}&w=${w}&q=${q}`;
      resultado = await intentar(u);
      if (resultado) { via = `caché w=${w} q=${q}`; break; }
    }
    if (resultado) break;
  }

  // 2) por las dudas, directo a Supabase (funciona si el proyecto revivió)
  if (!resultado) {
    resultado = await intentar(original);
    if (resultado) via = "Supabase directo";
  }

  if (resultado) {
    fs.writeFileSync(destino, resultado.buf);
    bytes += resultado.buf.length;
    ok++;
    rescatadas.push(o.key);
    console.log(`✅ ${CRITICAS.has(o.key) ? "⭐" : "  "} ${o.key.slice(0, 46).padEnd(48)} ${(resultado.buf.length / 1024).toFixed(0).padStart(5)} KB  (${via})`);
  } else {
    fail++;
    perdidas.push(o.key);
    console.log(`❌ ${CRITICAS.has(o.key) ? "⭐" : "  "} ${o.key.slice(0, 46).padEnd(48)} sin copia`);
  }
}

const criticasPerdidas = perdidas.filter((k) => CRITICAS.has(k));

console.log("\n" + "─".repeat(72));
console.log(`✅ ${ok} rescatadas (${(bytes / 1048576).toFixed(1)} MB) · ❌ ${fail} sin copia`);
console.log(`   Carpeta: ${DEST}`);

if (criticasPerdidas.length) {
  console.log(`\n⚠️  Faltan ${criticasPerdidas.length} archivos CRÍTICOS:`);
  for (const k of criticasPerdidas) console.log(`      · ${k}`);
  console.log(`\n   Estos hay que reponerlos a mano. Buscá en:`);
  console.log(`      · el Instagram/Facebook de la inmobiliaria (logos)`);
  console.log(`      · los archivos originales del diseñador`);
  console.log(`      · las carpetas del sitio viejo, si guardaste algo`);
} else if (fail === 0) {
  console.log(`\n🎉 Se rescató todo. Subí backup/fotospagina/ al bucket FotosPagina del proyecto nuevo.`);
} else {
  console.log(`\n🎉 Las críticas están todas. Lo que falta es secundario.`);
}

fs.writeFileSync(
  path.join(BACKUP, "fotospagina-resultado.json"),
  JSON.stringify({ rescatadas, perdidas, criticasPerdidas }, null, 2)
);
console.log("─".repeat(72) + "\n");
