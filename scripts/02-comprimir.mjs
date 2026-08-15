// ============================================================
//  PASO 2 — Comprimir a WebP (acá está el ahorro grande)
// ============================================================
// Tus fotos pesan 1 MB promedio. Comprimidas a WebP quedan en ~120-180 KB
// SIN diferencia visible en pantalla. 2.74 GB → ~400 MB.
// Además genera un "thumb" chico para las tarjetas del listado, que es lo
// que más tráfico consume (hoy el listado baja fotos de 1 MB para mostrarlas
// a 400px de ancho).
//
//   npm i sharp
//   node scripts/02-comprimir.mjs
//
// Entrada:  backup/originales/**
// Salida:   backup/webp/full/**   (máx 1600px, calidad 78)
//           backup/webp/thumb/**  (máx 640px,  calidad 70)

import fs from "fs";
import path from "path";
import sharp from "sharp";

const BACKUP = path.join(process.cwd(), "backup");
const SRC = path.join(BACKUP, "originales");
const OUT_FULL = path.join(BACKUP, "webp", "full");
const OUT_THUMB = path.join(BACKUP, "webp", "thumb");

const FULL = { maxAncho: 1600, calidad: 78 };
const THUMB = { maxAncho: 640, calidad: 70 };
const CONCURRENCIA = 4;

if (!fs.existsSync(SRC)) {
  console.error(`No existe ${SRC}. Corré primero: node scripts/01-rescate-imagenes.mjs`);
  process.exit(1);
}

const archivos = [];
for (const bucket of fs.readdirSync(SRC)) {
  const dir = path.join(SRC, bucket);
  if (!fs.statSync(dir).isDirectory()) continue;
  fs.mkdirSync(path.join(OUT_FULL, bucket), { recursive: true });
  fs.mkdirSync(path.join(OUT_THUMB, bucket), { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (/\.(jpe?g|png|webp|avif|gif|tiff?)$/i.test(f)) archivos.push({ bucket, nombre: f });
  }
}

console.log(`\n🗜️  Comprimiendo ${archivos.length} imágenes...\n`);

let hechos = 0, errores = 0, bytesIn = 0, bytesOut = 0;
const mapa = {}; // nombre original → nombre webp

let cursor = 0;
async function worker() {
  while (cursor < archivos.length) {
    const { bucket, nombre } = archivos[cursor++];
    const src = path.join(SRC, bucket, nombre);
    const base = nombre.replace(/\.[^.]+$/, "") + ".webp";
    const dFull = path.join(OUT_FULL, bucket, base);
    const dThumb = path.join(OUT_THUMB, bucket, base);
    try {
      const inSize = fs.statSync(src).size;
      if (!fs.existsSync(dFull)) {
        await sharp(src)
          .rotate() // respeta la orientación EXIF de las fotos de celular
          .resize({ width: FULL.maxAncho, withoutEnlargement: true })
          .webp({ quality: FULL.calidad, effort: 5 })
          .toFile(dFull);
      }
      if (!fs.existsSync(dThumb)) {
        await sharp(src)
          .rotate()
          .resize({ width: THUMB.maxAncho, withoutEnlargement: true })
          .webp({ quality: THUMB.calidad, effort: 5 })
          .toFile(dThumb);
      }
      bytesIn += inSize;
      bytesOut += fs.statSync(dFull).size + fs.statSync(dThumb).size;
      mapa[`${bucket}/${nombre}`] = `${bucket}/${base}`;
      hechos++;
    } catch (err) {
      errores++;
      console.error(`\n✗ ${nombre}: ${err.message}`);
    }
    if ((hechos + errores) % 20 === 0) {
      const pct = (((hechos + errores) / archivos.length) * 100).toFixed(1);
      process.stdout.write(
        `\r   ${pct}%  ${hechos} listas  ${(bytesIn / 1048576).toFixed(0)} MB → ${(bytesOut / 1048576).toFixed(0)} MB   `
      );
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCIA }, worker));

fs.writeFileSync(path.join(BACKUP, "mapa-webp.json"), JSON.stringify(mapa, null, 2));

const ahorro = bytesIn > 0 ? (1 - bytesOut / bytesIn) * 100 : 0;
console.log("\n\n" + "─".repeat(60));
console.log(`✅ ${hechos} imágenes comprimidas (${errores} errores)`);
console.log(`   Antes:   ${(bytesIn / 1073741824).toFixed(2)} GB`);
console.log(`   Después: ${(bytesOut / 1073741824).toFixed(2)} GB  (full + thumb)`);
console.log(`   Ahorro:  ${ahorro.toFixed(1)}%`);
console.log("─".repeat(60));
console.log(`\nSiguiente: node scripts/03-subir-r2.mjs\n`);
