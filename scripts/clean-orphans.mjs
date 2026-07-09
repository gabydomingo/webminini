// Borra del bucket SOLO los archivos huérfanos (no referenciados en backup/properties.json).
// Por defecto corre en modo DRY-RUN (no borra nada, solo muestra qué borraría).
// Para borrar de verdad: node scripts/clean-orphans.mjs --confirm
//
// Requisito: correr antes scripts/list-bucket-usage.mjs para generar backup/bucket_usage.json

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const confirm = process.argv.includes("--confirm");

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCES_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
});

async function main() {
    const usagePath = path.join(process.cwd(), "backup", "bucket_usage.json");
    if (!fs.existsSync(usagePath)) {
        console.error("Falta backup/bucket_usage.json. Corré primero: node scripts/list-bucket-usage.mjs");
        process.exit(1);
    }

    const objects = JSON.parse(fs.readFileSync(usagePath, "utf-8"));
    const orphans = objects.filter((o) => !o.referenced);
    const orphanMB = orphans.reduce((acc, o) => acc + o.sizeMB, 0);

    console.log(`Archivos huérfanos encontrados: ${orphans.length} (${orphanMB.toFixed(1)} MB)\n`);

    if (!confirm) {
        console.log("Modo DRY-RUN (no se borra nada). Estos son los candidatos:\n");
        for (const o of orphans) {
            console.log(`  ${o.sizeMB.toFixed(1).padStart(8)} MB  ${o.key}`);
        }
        console.log("\nPara borrarlos de verdad: node scripts/clean-orphans.mjs --confirm");
        return;
    }

    console.log("Borrando archivos huérfanos...\n");
    let deleted = 0;
    for (const o of orphans) {
        try {
            await s3.send(new DeleteObjectCommand({ Bucket: "propiedades", Key: o.key }));
            console.log(`✓ Borrado: ${o.key}`);
            deleted++;
        } catch (err) {
            console.error(`✗ Error borrando ${o.key}: ${err.message}`);
        }
    }

    console.log(`\n✅ ${deleted}/${orphans.length} archivos borrados. Liberados ~${orphanMB.toFixed(1)} MB.`);
}

main().catch((err) => {
    console.error("Error fatal:", err.message);
    process.exit(1);
});
