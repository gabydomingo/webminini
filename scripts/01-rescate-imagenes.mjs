// ============================================================
//  PASO 1 — Bajar TODAS las fotos a tu disco
// ============================================================
// Descarga las 2817 imágenes referenciadas (y opcionalmente las huérfanas)
// a backup/originales/. Es reanudable: si lo cortás y lo volvés a correr,
// saltea lo que ya bajó. No borra nada de Supabase.
//
//   node scripts/01-rescate-imagenes.mjs                 → solo las que usa la web
//   node scripts/01-rescate-imagenes.mjs --con-huerfanas → también las 296 sueltas
//
// Requiere: backup/bucket_usage.json y backup/properties.json (vienen en el kit)

import fs from "fs";
import path from "path";

const PROJECT_REF = "cvgnpyzgglrclzxxlbsp";
const BASE = `https://${PROJECT_REF}.supabase.co/storage/v1/object/public`;
const CONCURRENCIA = 6;
const REINTENTOS = 3;

const conHuerfanas = process.argv.includes("--con-huerfanas");
const BACKUP = path.join(process.cwd(), "backup");
const DEST = path.join(BACKUP, "originales");

const objects = JSON.parse(fs.readFileSync(path.join(BACKUP, "bucket_usage.json"), "utf-8"));
const targets = objects.filter((o) => conHuerfanas || o.referenced);

const totalMB = targets.reduce((a, o) => a + o.sizeMB, 0);
console.log(`\n📥 ${targets.length} archivos a bajar (~${totalMB.toFixed(0)} MB)`);
console.log(`   Destino: ${DEST}\n`);

for (const b of new Set(targets.map((o) => o.bucket))) {
  fs.mkdirSync(path.join(DEST, b), { recursive: true });
}

let ok = 0, skip = 0, fail = 0, bytes = 0;
const fallidos = [];

async function bajar(o) {
  const dest = path.join(DEST, o.bucket, o.key.replace(/\//g, "__"));
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    skip++;
    return;
  }
  const url = `${BASE}/${o.bucket}/${encodeURIComponent(o.key).replace(/%2F/g, "/")}`;
  for (let intento = 1; intento <= REINTENTOS; intento++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) throw new Error("archivo vacío");
      fs.writeFileSync(dest, buf);
      bytes += buf.length;
      ok++;
      return;
    } catch (err) {
      if (intento === REINTENTOS) {
        fail++;
        fallidos.push({ ...o, error: err.message });
      } else {
        await new Promise((r) => setTimeout(r, 800 * intento));
      }
    }
  }
}

// pool de descargas en paralelo
let cursor = 0;
async function worker() {
  while (cursor < targets.length) {
    const o = targets[cursor++];
    await bajar(o);
    const hechos = ok + skip + fail;
    if (hechos % 25 === 0 || hechos === targets.length) {
      const pct = ((hechos / targets.length) * 100).toFixed(1);
      process.stdout.write(
        `\r   ${pct}%  ✓${ok} ⏭${skip} ✗${fail}  (${(bytes / 1048576).toFixed(0)} MB)   `
      );
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCIA }, worker));

console.log("\n");
if (fallidos.length) {
  fs.writeFileSync(path.join(BACKUP, "fallidos.json"), JSON.stringify(fallidos, null, 2));
  console.log(`⚠️  ${fallidos.length} fallaron. Detalle en backup/fallidos.json`);
  console.log("   Volvé a correr el script: reintenta solo las que faltan.\n");
}
console.log(`✅ Bajadas ${ok} (${(bytes / 1048576).toFixed(0)} MB) · ya estaban ${skip} · fallaron ${fail}`);
if (fail === 0) console.log(`\n🎯 Rescate completo. Siguiente: node scripts/02-comprimir.mjs\n`);
