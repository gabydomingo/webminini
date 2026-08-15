// ============================================================
//  Auditoría de claves — corrélo cada vez que toques .env.local
// ============================================================
// Revisa que ninguna clave con prefijo NEXT_PUBLIC_ sea una service_role,
// que es el error que dejó tu base abierta a cualquiera.
//
//   node scripts/auditar-claves.mjs
//
// Sin dependencias. Nunca imprime las claves completas.

import { cargarEnv } from "./_env.mjs";

const vars = cargarEnv(".env.local");

function rolDeLaClave(key) {
  if (key.startsWith("sb_secret_")) return "service_role";
  if (key.startsWith("sb_publishable_")) return "anon";
  const p = key.split(".");
  if (p.length !== 3) return null;
  try {
    const j = p[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(j, "base64").toString("utf-8"))?.role ?? null;
  } catch {
    return null;
  }
}

function tapar(v) {
  return v.length <= 14 ? "***" : `${v.slice(0, 6)}…${v.slice(-4)}`;
}

console.log("\n🔐 Auditoría de .env.local\n");

const problemas = [];
const claves = Object.entries(vars).filter(([, v]) => v && v.length > 30);

if (!claves.length) {
  console.log("   No encontré variables en .env.local.\n");
  process.exit(0);
}

for (const [nombre, valor] of claves) {
  const rol = rolDeLaClave(valor);
  const publica = nombre.startsWith("NEXT_PUBLIC_");
  const peligro = publica && rol === "service_role";

  if (peligro) {
    problemas.push(nombre);
    console.log(`🚨 ${nombre}`);
    console.log(`   └─ role: ${rol}  ·  valor: ${tapar(valor)}`);
    console.log(`   └─ EXPUESTA EN EL NAVEGADOR. Cambiala por la clave anon.\n`);
  } else if (rol) {
    console.log(`${publica ? "🌐" : "🔒"} ${nombre.padEnd(32)} role: ${rol}`);
  } else {
    console.log(`${publica ? "🌐" : "🔒"} ${nombre.padEnd(32)} (no es una clave de Supabase)`);
  }
}

// Chequeos extra
console.log("");
if (vars.NEXT_PUBLIC_SUPABASE_ANON_KEY && vars.SUPABASE_SERVICE_ROLE_KEY) {
  if (vars.NEXT_PUBLIC_SUPABASE_ANON_KEY === vars.SUPABASE_SERVICE_ROLE_KEY) {
    problemas.push("claves idénticas");
    console.log("🚨 La anon key y la service_role key son EXACTAMENTE LA MISMA.");
    console.log("   Tienen que ser dos claves distintas del panel de Supabase.\n");
  }
}
if (vars.DATABASE_URL?.includes("@") && !vars.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
  console.log("ℹ️  DATABASE_URL tiene la contraseña de Postgres adentro.");
  console.log("   Está bien que exista, pero ese archivo nunca va a git ni se comparte.\n");
}

console.log("─".repeat(60));
if (problemas.length) {
  console.log(`❌ ${problemas.length} problema(s) crítico(s). Arreglalos antes de deployar.`);
  console.log("   Pasos en SEGURIDAD.md");
  process.exit(1);
} else {
  console.log("✅ Sin claves privadas expuestas al navegador.");
}
console.log("─".repeat(60) + "\n");
