// ============================================================
//  PASO 3 — Subir las WebP a Cloudflare R2
// ============================================================
// R2 da 10 GB gratis para siempre y NO cobra tráfico de salida (egress),
// que es justo lo que te rompió la capa gratuita de Supabase.
//
//   npm i @aws-sdk/client-s3
//   node scripts/03-subir-r2.mjs           → prueba en seco (no sube nada)
//   node scripts/03-subir-r2.mjs --subir   → sube de verdad
//
// Agregá esto a .env.local (lo sacás del panel de Cloudflare → R2 → API Tokens):
//   R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxx
//   R2_ACCESS_KEY_ID=xxxxxxxx
//   R2_SECRET_ACCESS_KEY=xxxxxxxx
//   R2_BUCKET=webminini
//   R2_PUBLIC_URL=https://img.tudominio.com     ← dominio propio (recomendado)
//                  o https://pub-xxxx.r2.dev    ← el que te da Cloudflare

import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { cargarEnv } from "./_env.mjs";

cargarEnv(".env.local");

const subir = process.argv.includes("--subir");
const BACKUP = path.join(process.cwd(), "backup");
const WEBP = path.join(BACKUP, "webp");
const CONCURRENCIA = 8;

for (const v of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) {
  if (!process.env[v]) {
    console.error(`❌ Falta ${v} en .env.local`);
    process.exit(1);
  }
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET;

// Recolectar archivos: backup/webp/{full,thumb}/{bucket}/archivo.webp
const items = [];
for (const variante of ["full", "thumb"]) {
  const vdir = path.join(WEBP, variante);
  if (!fs.existsSync(vdir)) continue;
  for (const bucket of fs.readdirSync(vdir)) {
    const bdir = path.join(vdir, bucket);
    if (!fs.statSync(bdir).isDirectory()) continue;
    for (const f of fs.readdirSync(bdir)) {
      if (!f.endsWith(".webp")) continue;
      items.push({
        local: path.join(bdir, f),
        key: `${variante}/${bucket}/${f}`,
        size: fs.statSync(path.join(bdir, f)).size,
      });
    }
  }
}

const totalMB = items.reduce((a, i) => a + i.size, 0) / 1048576;
console.log(`\n☁️  ${items.length} archivos (${totalMB.toFixed(0)} MB) → r2://${BUCKET}`);
console.log(`   Límite gratis de R2: 10240 MB  →  usarías el ${((totalMB / 10240) * 100).toFixed(1)}%\n`);

if (!subir) {
  console.log("Modo PRUEBA EN SECO. Ejemplo de las primeras 5 claves:\n");
  for (const i of items.slice(0, 5)) console.log(`   ${i.key}`);
  console.log(`\n   URL pública quedaría: ${process.env.R2_PUBLIC_URL || "<R2_PUBLIC_URL>"}/${items[0]?.key}`);
  console.log("\nPara subir de verdad: node scripts/03-subir-r2.mjs --subir\n");
  process.exit(0);
}

let ok = 0, skip = 0, fail = 0;
let cursor = 0;

async function worker() {
  while (cursor < items.length) {
    const it = items[cursor++];
    try {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: it.key }));
        skip++;
        continue; // ya está subido
      } catch {}
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: it.key,
          Body: fs.readFileSync(it.local),
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        })
      );
      ok++;
    } catch (err) {
      fail++;
      console.error(`\n✗ ${it.key}: ${err.message}`);
    }
    const h = ok + skip + fail;
    if (h % 25 === 0 || h === items.length) {
      process.stdout.write(`\r   ${((h / items.length) * 100).toFixed(1)}%  ✓${ok} ⏭${skip} ✗${fail}   `);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCIA }, worker));

console.log(`\n\n✅ Subidas ${ok} · ya estaban ${skip} · fallaron ${fail}`);
if (fail === 0) console.log(`\nSiguiente: node scripts/04-actualizar-urls.mjs\n`);
