// ============================================================
//  PASO 0 — ¿El Storage sigue vivo aunque el proyecto esté pausado?
// ============================================================
// Cuando Supabase pausa un proyecto, apaga la base de datos, pero el bucket
// de Storage vive en OTRO host (*.storage.supabase.co) que a veces sigue
// respondiendo. Si este script da verde, bajás las 2817 fotos GRATIS.
//
//   node scripts/00-test-storage.mjs
//
// No escribe ni borra nada. Solo lee.
//
// NO necesita instalar nada: las pruebas 1 a 3 corren con Node pelado.
// La prueba 4 (protocolo S3) es la más importante y necesita:
//   npm i @aws-sdk/client-s3
// Si no está instalada, la saltea sin romper.

import fs from "fs";
import path from "path";
import { cargarEnv } from "./_env.mjs";

cargarEnv(".env.local");

const PROJECT_REF = "cvgnpyzgglrclzxxlbsp";
const usagePath = path.join(process.cwd(), "backup", "bucket_usage.json");

if (!fs.existsSync(usagePath)) {
  console.error("Falta backup/bucket_usage.json (viene en el kit de rescate).");
  process.exit(1);
}

const objects = JSON.parse(fs.readFileSync(usagePath, "utf-8"));
const sample = objects.filter((o) => o.bucket === "propiedades").slice(0, 3);

// Traduce el error crudo a algo que se entienda
function explicar(err) {
  const code = err.cause?.code || err.code || "";
  if (code === "ENOTFOUND") return ["DNS", "el host no existe → Supabase le quitó el registro DNS al pausarlo"];
  if (code === "ECONNREFUSED") return ["CONEXIÓN", "el host existe pero rechaza la conexión"];
  if (code === "ETIMEDOUT" || err.name === "TimeoutError") return ["TIMEOUT", "no contestó a tiempo"];
  if (code === "CERT_HAS_EXPIRED") return ["CERTIFICADO", "el certificado SSL venció"];
  return [err.name || "ERROR", err.cause?.message || err.message];
}

let publicOk = false;
let s3Ok = false;

async function probe(label, url, init = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
    const ms = Date.now() - t0;
    const len = res.headers.get("content-length");
    const tipo = res.headers.get("content-type") || "";
    console.log(
      `${res.ok ? "✅" : "⚠️ "} ${label.padEnd(34)} HTTP ${res.status}  ${ms}ms` +
        (len ? `  ${(len / 1024).toFixed(0)} KB` : "") +
        (tipo ? `  ${tipo.split(";")[0]}` : "")
    );
    if (!res.ok && res.status !== 400) {
      // mostramos el cuerpo: ahí suele estar el motivo real
      try {
        const body = (await res.text()).trim().slice(0, 200);
        if (body) console.log(`   └─ ${body}`);
      } catch {}
    }
    return res.ok;
  } catch (err) {
    const [tipo, detalle] = explicar(err);
    console.log(`❌ ${label.padEnd(34)} ${tipo}`);
    console.log(`   └─ ${detalle}`);
    return false;
  }
}

console.log(`\n🔎 Probando los hosts del proyecto ${PROJECT_REF}...\n`);

// 1) API de la base — esperable que esté caída si el proyecto está pausado
await probe("API REST (base de datos)", `https://${PROJECT_REF}.supabase.co/rest/v1/`, {
  headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "" },
});

// 2) Endpoint público de Storage por el host del proyecto
for (const o of sample) {
  const url = `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/${o.bucket}/${o.key}`;
  if (await probe(`Storage público: ${o.key.slice(0, 15)}…`, url, { method: "HEAD" })) publicOk = true;
}

// 3) Host dedicado de Storage — el que más chances tiene de seguir vivo
await probe("Host S3 dedicado", `https://${PROJECT_REF}.storage.supabase.co/storage/v1/version`);

// 4) Protocolo S3 con credenciales — LA PRUEBA QUE IMPORTA
console.log("");
// Este script apunta al proyecto VIEJO (pausado), así que usa las
// credenciales VIEJO_*. Si no están, cae en las genéricas.
// Ojo con el typo S3_ACCES_KEY (sin una S): así está en tu .env.local.
const s3Key =
  process.env.VIEJO_S3_ACCES_KEY ||
  process.env.VIEJO_S3_ACCESS_KEY ||
  process.env.S3_ACCESS_KEY ||
  process.env.S3_ACCES_KEY;
const s3Secret = process.env.VIEJO_S3_SECRET_KEY || process.env.S3_SECRET_KEY;
const s3Endpoint =
  process.env.VIEJO_S3_ENDPOINT ||
  `https://${PROJECT_REF}.storage.supabase.co/storage/v1/s3`;
if (s3Key && s3Secret) {
  try {
    const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      endpoint: s3Endpoint,
      region: process.env.VIEJO_S3_REGION || process.env.S3_REGION || "sa-east-1",
      credentials: {
        accessKeyId: s3Key,
        secretAccessKey: s3Secret,
      },
      forcePathStyle: true,
    });
    const r = await s3.send(new ListObjectsV2Command({ Bucket: "propiedades", MaxKeys: 5 }));
    console.log(`✅ ${"Protocolo S3 (ListObjects)".padEnd(34)} ${r.KeyCount} objetos listados`);
    for (const c of r.Contents || []) {
      console.log(`   └─ ${c.Key}  (${(c.Size / 1024).toFixed(0)} KB)`);
    }
    s3Ok = true;
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND") {
      console.log(`⏭️  ${"Protocolo S3 (ListObjects)".padEnd(34)} salteada`);
      console.log(`   └─ instalá el paquete y volvé a correr:  npm i @aws-sdk/client-s3`);
    } else {
      const [tipo, detalle] = explicar(err);
      console.log(`❌ ${"Protocolo S3 (ListObjects)".padEnd(34)} ${tipo}`);
      // el motivo real suele venir en el cuerpo de la respuesta
      const resp = err.$response;
      if (resp) {
        console.log(`   └─ HTTP ${resp.statusCode}`);
        try {
          const body = (await new Response(resp.body).text()).trim().slice(0, 300);
          if (body) console.log(`   └─ ${body}`);
        } catch {}
      } else {
        console.log(`   └─ ${detalle}`);
      }
    }
  }
} else {
  console.log("⚠️  Sin credenciales S3 en .env.local, salteo esa prueba.");
}

console.log("\n" + "─".repeat(68));
if (publicOk || s3Ok) {
  console.log("🎉 BUENAS NOTICIAS: el Storage responde aunque el proyecto esté pausado.");
  console.log("   Podés rescatar las fotos GRATIS. Seguí con:");
  console.log("     node scripts/01-rescate-imagenes.mjs");
} else {
  console.log("😐 El Storage no respondió por ninguna vía.");
  console.log("   Antes de darlo por perdido, fijate en el detalle de arriba:");
  console.log("     · dice «DNS» en todas    → el proyecto está apagado de verdad");
  console.log("     · dice 403 / Unauthorized → puede ser tema de credenciales, no de pausa");
  console.log("     · dice «allowlist», proxy o firewall → es tu red, probá desde otra");
  console.log("");
  console.log("   Si es lo primero, mirá RESCATE-Y-MIGRACION.md:");
  console.log("     1. Ticket a Supabase Support        → gratis, unos días");
  console.log("     2. Reactivar Pro 1 mes (~USD 25)    → seguro e inmediato");
}
console.log("─".repeat(68) + "\n");
