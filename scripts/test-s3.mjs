// Prueba de solo lectura: intenta listar objetos del bucket vía API S3-compatible de Supabase.
// No borra ni sube nada.

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION;
const accessKeyId = process.env.S3_ACCES_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    console.error("Faltan variables S3_* en .env.local");
    process.exit(1);
}

const s3 = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
});

async function main() {
    console.log("Intentando listar el bucket 'propiedades'...\n");
    try {
        const res = await s3.send(
            new ListObjectsV2Command({ Bucket: "propiedades", MaxKeys: 10 })
        );
        console.log("✓ ¡Funciona! Objetos encontrados:");
        console.log(res.Contents?.map((o) => `  - ${o.Key} (${(o.Size / 1024).toFixed(1)} KB)`).join("\n"));
        console.log(`\nTotal en esta página: ${res.KeyCount}, hay más páginas: ${res.IsTruncated}`);
    } catch (err) {
        console.error("✗ Falló:", err.message);
        if (err.$metadata) console.error("Metadata:", JSON.stringify(err.$metadata));
    }
}

main();
