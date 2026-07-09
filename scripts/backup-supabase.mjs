// Script de backup SOLO LECTURA. No borra ni modifica nada en Supabase.
// Descarga la data de las tablas y todas las imágenes/videos del bucket "propiedades",
// dejando todo organizado y vinculado en la carpeta /backup.
//
// Uso:
//   1. Asegurate de tener en .env.local la variable SUPABASE_SERVICE_ROLE_KEY
//      (Supabase Dashboard > Project Settings > API > service_role secret)
//   2. node scripts/backup-supabase.mjs

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error(
        "Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BACKUP_DIR = path.join(process.cwd(), "backup");

function safeName(str) {
    return String(str)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

async function downloadFile(url, destPath) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return buffer.length;
}

async function backupTable(tableName) {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) {
        console.error(`✗ Error leyendo "${tableName}": ${error.message}`);
        return null;
    }
    fs.writeFileSync(
        path.join(BACKUP_DIR, `${tableName}.json`),
        JSON.stringify(data, null, 2)
    );
    console.log(`✓ ${tableName}: ${data.length} filas guardadas`);
    return data;
}

async function backupProperties(properties) {
    const propertiesDir = path.join(BACKUP_DIR, "properties");
    fs.mkdirSync(propertiesDir, { recursive: true });

    const fullExport = [];
    let totalBytes = 0;

    for (const prop of properties) {
        const folderName = `${safeName(prop.title || "propiedad")}-${prop.id.slice(0, 8)}`;
        const propDir = path.join(propertiesDir, folderName);
        fs.mkdirSync(propDir, { recursive: true });

        const images = Array.isArray(prop.images) ? prop.images : [];
        const localImages = [];

        for (let i = 0; i < images.length; i++) {
            const url = images[i];
            let ext = ".jpg";
            try {
                ext = path.extname(new URL(url).pathname) || ".jpg";
            } catch {}
            const fileName = `${i}${ext}`;
            const destPath = path.join(propDir, fileName);
            try {
                const bytes = await downloadFile(url, destPath);
                totalBytes += bytes;
                localImages.push(`properties/${folderName}/${fileName}`);
                console.log(
                    `  ↳ [${i + 1}/${images.length}] ${prop.title || prop.id}`
                );
            } catch (err) {
                console.error(
                    `  ✗ No se pudo descargar imagen de "${prop.title || prop.id}": ${err.message}`
                );
            }
        }

        const record = { ...prop, local_images: localImages };
        fs.writeFileSync(
            path.join(propDir, "data.json"),
            JSON.stringify(record, null, 2)
        );
        fullExport.push(record);
    }

    fs.writeFileSync(
        path.join(BACKUP_DIR, "properties_full.json"),
        JSON.stringify(fullExport, null, 2)
    );
    console.log(
        `\n✓ properties_full.json generado (${(totalBytes / 1024 / 1024).toFixed(1)} MB de imágenes descargadas)`
    );
}

async function backupHomeVideos(siteSettings) {
    if (!siteSettings) return;
    const feedSetting = siteSettings.find((s) => s.key === "home_videos_feed");
    if (!feedSetting?.value) return;

    let videos = [];
    try {
        videos = JSON.parse(feedSetting.value);
    } catch {
        return;
    }

    const mp4s = videos.filter((v) => v.type === "mp4" && v.url);
    if (mp4s.length === 0) return;

    const videosDir = path.join(BACKUP_DIR, "home_videos");
    fs.mkdirSync(videosDir, { recursive: true });

    for (let i = 0; i < mp4s.length; i++) {
        const url = mp4s[i].url;
        let ext = ".mp4";
        try {
            ext = path.extname(new URL(url).pathname) || ".mp4";
        } catch {}
        const destPath = path.join(videosDir, `video-${i}${ext}`);
        try {
            const bytes = await downloadFile(url, destPath);
            console.log(
                `✓ video-${i}${ext} descargado (${(bytes / 1024 / 1024).toFixed(1)} MB)`
            );
        } catch (err) {
            console.error(`✗ No se pudo descargar ${url}: ${err.message}`);
        }
    }
}

async function main() {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    console.log("Iniciando backup de solo lectura...\n");

    await backupTable("inquiries");
    await backupTable("form_options");
    const siteSettings = await backupTable("site_settings");
    const properties = await backupTable("properties");

    if (properties) {
        await backupProperties(properties);
    }

    await backupHomeVideos(siteSettings);

    console.log(`\n✅ Backup completo en: ${BACKUP_DIR}`);
}

main().catch((err) => {
    console.error("Error fatal en el backup:", err);
    process.exit(1);
});
