// SOLO LECTURA. Lista todos los objetos del bucket 'propiedades' con su tamaño,
// para identificar rápido qué borrar y volver a estar bajo la cuota de 1GB cuanto antes.
//
// Uso (una vez que el Storage esté desbloqueado): node scripts/list-bucket-usage.mjs

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION;
const accessKeyId = process.env.S3_ACCES_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

const s3 = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
});

async function listAll(bucket) {
    let objects = [];
    let continuationToken;
    do {
        const res = await s3.send(
            new ListObjectsV2Command({
                Bucket: bucket,
                ContinuationToken: continuationToken,
            })
        );
        if (res.Contents) objects = objects.concat(res.Contents);
        continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);
    return objects;
}

function loadReferencedFileNames() {
    const backupPath = path.join(process.cwd(), "backup", "properties.json");
    if (!fs.existsSync(backupPath)) return new Set();
    const properties = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
    const names = new Set();
    for (const p of properties) {
        const images = Array.isArray(p.images) ? p.images : [];
        for (const url of images) {
            try {
                const fileName = decodeURIComponent(new URL(url).pathname.split("/").pop());
                names.add(fileName);
            } catch {}
        }
    }
    return names;
}

async function main() {
    console.log("Listando objetos del bucket 'propiedades'...\n");
    const objects = await listAll("propiedades");
    const referenced = loadReferencedFileNames();

    const enriched = objects
        .map((o) => ({
            key: o.Key,
            sizeMB: o.Size / 1024 / 1024,
            referenced: referenced.has(o.Key.split("/").pop()),
        }))
        .sort((a, b) => b.sizeMB - a.sizeMB);

    const totalMB = enriched.reduce((acc, o) => acc + o.sizeMB, 0);
    const orphanMB = enriched.filter((o) => !o.referenced).reduce((acc, o) => acc + o.sizeMB, 0);

    fs.mkdirSync(path.join(process.cwd(), "backup"), { recursive: true });
    fs.writeFileSync(
        path.join(process.cwd(), "backup", "bucket_usage.json"),
        JSON.stringify(enriched, null, 2)
    );

    console.log(`Total objetos: ${enriched.length}`);
    console.log(`Tamaño total: ${totalMB.toFixed(1)} MB (límite free: 1024 MB)`);
    console.log(`Tamaño de archivos NO referenciados en properties.json: ${orphanMB.toFixed(1)} MB\n`);

    console.log("── TOP 20 archivos más grandes ──");
    for (const o of enriched.slice(0, 20)) {
        console.log(
            `${o.sizeMB.toFixed(1).padStart(8)} MB  ${o.referenced ? "[usado]  " : "[HUÉRFANO] "}${o.key}`
        );
    }

    console.log(
        `\nReporte completo guardado en backup/bucket_usage.json. Los marcados [HUÉRFANO] no están en ninguna propiedad actual y son candidatos seguros para borrar.`
    );
}

main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
});
