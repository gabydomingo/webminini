// Backup de SOLO LECTURA via conexión directa a Postgres (bypassea la API REST bloqueada).
// No borra ni modifica nada. Solo lee tablas y las guarda como JSON en /backup.
//
// Uso: node scripts/backup-postgres.mjs

import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Falta DATABASE_URL en .env.local");
    process.exit(1);
}

const BACKUP_DIR = path.join(process.cwd(), "backup");
const TABLES = ["properties", "inquiries", "form_options", "site_settings", "page_views"];

async function main() {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const client = new pg.Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    console.log("Conectando directo a Postgres...");
    await client.connect();
    console.log("✓ Conectado\n");

    for (const table of TABLES) {
        try {
            const res = await client.query(`SELECT * FROM ${table}`);
            fs.writeFileSync(
                path.join(BACKUP_DIR, `${table}.json`),
                JSON.stringify(res.rows, null, 2)
            );
            console.log(`✓ ${table}: ${res.rowCount} filas guardadas`);
        } catch (err) {
            console.error(`✗ Error en "${table}": ${err.message}`);
        }
    }

    await client.end();
    console.log(`\n✅ Backup de base de datos completo en: ${BACKUP_DIR}`);
    console.log("Nota: esto NO incluye las imágenes (Storage sigue bloqueado). Solo es la data de las tablas.");
}

main().catch((err) => {
    console.error("Error fatal:", err.message);
    process.exit(1);
});
