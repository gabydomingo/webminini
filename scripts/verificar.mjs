// ============================================================
//  Chequeo rápido del código antes de publicar
// ============================================================
//  Existe porque durante la migración aparecieron dos veces
//  referencias al proyecto viejo que se habían colado sin que nadie se
//  diera cuenta: la web seguía compilando, el typecheck pasaba, y el
//  problema recién se veía como una imagen rota en producción.
//
//  Esto lo detecta en dos segundos.
//
//   npm run verificar
//
//  Devuelve código de salida 1 si encuentra algo, así que también sirve
//  para frenar un deploy en CI.

import fs from "fs";
import path from "path";

const RAIZ = process.cwd();
const REF_VIEJO = "cvgnpyzgglrclzxxlbsp";

const IGNORAR = new Set(["node_modules", ".next", ".git", "backup", "out", "build", "scripts"]);
const EXTENSIONES = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

/**
 * Saca comentarios y textos de documentación antes de buscar.
 * Sin esto, un comentario que MENCIONA el problema se cuenta como si
 * fuera el problema. (Me pasó con este mismo archivo.)
 */
function sinComentarios(codigo) {
    return codigo
        .replace(/\/\*[\s\S]*?\*\//g, "")   // bloques /* */
        .replace(/^\s*\/\/.*$/gm, "");       // líneas //
}

function archivos(dir, acc = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (IGNORAR.has(e.name)) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) archivos(p, acc);
        else if (EXTENSIONES.has(path.extname(e.name))) acc.push(p);
    }
    return acc;
}

// Reglas que se evalúan sobre el archivo COMPLETO (no por patrón suelto),
// porque dependen de la combinación de varias cosas.
const REGLAS_ARCHIVO = [
    {
        nombre: 'metadata exportada desde un componente de cliente',
        porque: 'Next no lo permite y REVIENTA EL BUILD. La metadata va en un page.tsx de servidor que renderice al componente de cliente.',
        chequear(codigo) {
            const esCliente = /^\s*["']use client["']/m.test(codigo);
            const exportaMetadata = /export\s+(const\s+metadata|async\s+function\s+generateMetadata)/.test(codigo);
            return esCliente && exportaMetadata;
        },
    },
];

const REGLAS = [
    {
        nombre: "Referencias al proyecto Supabase viejo",
        patron: new RegExp(REF_VIEJO, "g"),
        porque: "Esas URLs apuntan a un proyecto que ya no se usa: las imágenes dan 404.",
    },
    {
        nombre: "Dominio de ejemplo sin reemplazar",
        patron: /tudominio\.com/g,
        porque: "Rompe las vistas previas al compartir y el canonical que lee Google.",
    },
    {
        nombre: "Recursos desde CDN externos",
        patron: /unpkg\.com|cdnjs\.cloudflare\.com/g,
        porque: "Redes con filtros (universidades, oficinas) suelen bloquearlos y el mapa queda sin marcadores.",
    },
    {
        nombre: "console.log olvidados",
        patron: /^\s*console\.log\(/gm,
        porque: "Ensucian la consola del visitante y bajan la nota de Best Practices.",
        aviso: true, // no corta el deploy, solo avisa
    },
];

const lista = archivos(path.join(RAIZ, "app")).concat(
    ["next.config.ts", "middleware.ts"]
        .map((f) => path.join(RAIZ, f))
        .filter((f) => fs.existsSync(f))
);

console.log(`\n🔍 Revisando ${lista.length} archivos…\n`);

let errores = 0;
let avisos = 0;

for (const regla of REGLAS) {
    const encontrados = [];
    for (const f of lista) {
        const s = sinComentarios(fs.readFileSync(f, "utf-8"));
        const m = s.match(regla.patron);
        if (m) encontrados.push({ archivo: path.relative(RAIZ, f), veces: m.length });
    }

    if (!encontrados.length) {
        console.log(`   ✅ ${regla.nombre}`);
        continue;
    }

    const total = encontrados.reduce((a, e) => a + e.veces, 0);
    console.log(`   ${regla.aviso ? "⚠️ " : "❌"} ${regla.nombre} — ${total} en ${encontrados.length} archivo(s)`);
    console.log(`      ${regla.porque}`);
    for (const e of encontrados) console.log(`      · ${e.archivo} (${e.veces})`);

    if (regla.aviso) avisos += total;
    else errores += total;
}

// ── Reglas que miran el archivo entero ──────────────────────
for (const regla of REGLAS_ARCHIVO) {
    const encontrados = [];
    for (const f of lista) {
        // Acá NO sacamos comentarios: "use client" tiene que ser real.
        if (regla.chequear(fs.readFileSync(f, "utf-8"))) {
            encontrados.push(path.relative(RAIZ, f));
        }
    }
    if (!encontrados.length) {
        console.log(`   ✅ ${regla.nombre}`);
        continue;
    }
    console.log(`   ❌ ${regla.nombre} — ${encontrados.length} archivo(s)`);
    console.log(`      ${regla.porque}`);
    for (const e of encontrados) console.log(`      · ${e}`);
    errores += encontrados.length;
}

console.log("\n" + "─".repeat(62));
if (errores) {
    console.log(`❌ ${errores} problema(s) que conviene arreglar antes de publicar.`);
    process.exit(1);
} else {
    console.log(`✅ Todo en orden${avisos ? ` (${avisos} aviso[s] menor[es])` : ""}.`);
}
console.log("─".repeat(62) + "\n");
