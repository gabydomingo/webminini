// SOLO LECTURA / DESCARGA. Usa backup/properties.json (ya generado) para bajar
// todas las imágenes de cada propiedad, organizadas por carpeta. No toca Supabase
// salvo para leer (GET) los archivos de imagen, así que no borra nada.
//
// Uso (una vez que el Storage esté desbloqueado): node scripts/download-images.mjs

import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backup");
const propertiesPath = path.join(BACKUP_DIR, "properties.json");

if (!fs.existsSync(propertiesPath)) {
    console.error("No existe backup/properties.json. Corré primero: node scripts/backup-postgres.mjs");
    process.exit(1);
}

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

async function main() {
    const properties = JSON.parse(fs.readFileSync(propertiesPath, "utf-8"));
    const propertiesDir = path.join(BACKUP_DIR, "properties");
    fs.mkdirSync(propertiesDir, { recursive: true });

    let totalBytes = 0;
    let okCount = 0;
    let failCount = 0;
    const fullExport = [];

    for (const prop of properties) {
        const folderName = `${safeName(prop.title || "propiedad")}-${String(prop.id).slice(0, 8)}`;
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
                okCount++;
                localImages.push(`properties/${folderName}/${fileName}`);
                console.log(`✓ [${i + 1}/${images.length}] ${prop.title || prop.id}`);
            } catch (err) {
                failCount++;
                console.error(`✗ ${prop.title || prop.id}: ${err.message}`);
            }
        }

        const record = { ...prop, local_images: localImages };
        fs.writeFileSync(path.join(propDir, "data.json"), JSON.stringify(record, null, 2));
        fullExport.push(record);
    }

    fs.writeFileSync(
        path.join(BACKUP_DIR, "properties_full.json"),
        JSON.stringify(fullExport, null, 2)
    );

    console.log(`\n✅ Listo. ${okCount} imágenes descargadas (${(totalBytes / 1024 / 1024).toFixed(1)} MB), ${failCount} fallidas.`);
    console.log(`Carpeta: ${propertiesDir}`);
}

main().catch((err) => {
    console.error("Error fatal:", err.message);
    process.exit(1);
});
