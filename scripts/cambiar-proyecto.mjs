// ============================================================
//  Apuntar el código al proyecto Supabase NUEVO
// ============================================================
//  El ref del proyecto viejo (cvgnpyzgglrclzxxlbsp) está escrito a mano en
//  varios archivos: los logos del header y del footer, el hero de la
//  portada, las fotos de Sobre Nosotros, los metadatos del layout y el
//  next.config.ts. Cambiarlos uno por uno es pedirle a la suerte que no se
//  te escape ninguno.
//
//   node scripts/cambiar-proyecto.mjs <ref-nuevo>            → muestra qué cambiaría
//   node scripts/cambiar-proyecto.mjs <ref-nuevo> --aplicar  → lo hace
//
//  Ejemplo:
//   node scripts/cambiar-proyecto.mjs abcdefghijklmnop --aplicar
//
//  El ref es la parte del medio de la URL del proyecto:
//   https://abcdefghijklmnop.supabase.co  →  abcdefghijklmnop
//
//  Antes de aplicar hacé commit de lo que tengas, así podés volver atrás
//  con un `git checkout .` si algo no te gusta.

import fs from "fs";
import path from "path";

const REF_VIEJO = "cvgnpyzgglrclzxxlbsp";
const refNuevo = process.argv[2];
const aplicar = process.argv.includes("--aplicar");

if (!refNuevo || refNuevo.startsWith("--")) {
  console.error("\nUso: node scripts/cambiar-proyecto.mjs <ref-nuevo> [--aplicar]\n");
  process.exit(1);
}
if (!/^[a-z]{20}$/.test(refNuevo)) {
  console.warn(
    `\n⚠️  "${refNuevo}" no tiene la pinta habitual de un ref de Supabase ` +
      `(20 letras minúsculas). Si estás seguro, seguí igual.\n`
  );
}
if (refNuevo === REF_VIEJO) {
  console.error("\nEse es el ref viejo. Pasá el del proyecto nuevo.\n");
  process.exit(1);
}

const EXTENSIONES = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md"]);
const IGNORAR = new Set(["node_modules", ".next", ".git", "backup", "out", "build"]);

function recorrer(dir, encontrados = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(entrada.name)) continue;
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      recorrer(completo, encontrados);
    } else if (EXTENSIONES.has(path.extname(entrada.name))) {
      encontrados.push(completo);
    }
  }
  return encontrados;
}

const raiz = process.cwd();
const archivos = recorrer(raiz);
const afectados = [];

// Este mismo archivo menciona el ref viejo en el código y en los comentarios;
// si se auto-editara perdería la referencia y no podría volver a correrse.
const yoMismo = path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

for (const archivo of archivos) {
  if (path.resolve(archivo) === yoMismo) continue;
  let contenido;
  try {
    contenido = fs.readFileSync(archivo, "utf-8");
  } catch {
    continue;
  }
  if (!contenido.includes(REF_VIEJO)) continue;

  const ocurrencias = contenido.split(REF_VIEJO).length - 1;
  const relativo = path.relative(raiz, archivo);
  afectados.push({ archivo, relativo, ocurrencias, contenido });
}

if (!afectados.length) {
  console.log(`\n✅ No quedó ninguna referencia a ${REF_VIEJO}. Ya está todo migrado.\n`);
  process.exit(0);
}

const total = afectados.reduce((a, f) => a + f.ocurrencias, 0);
console.log(`\n🔁 ${REF_VIEJO}  →  ${refNuevo}`);
console.log(`   ${total} referencias en ${afectados.length} archivos:\n`);
for (const f of afectados) {
  console.log(`   ${String(f.ocurrencias).padStart(2)}×  ${f.relativo}`);
}

if (!aplicar) {
  console.log(`\nModo PRUEBA. No se tocó nada.`);
  console.log(`Para aplicarlo:  node scripts/cambiar-proyecto.mjs ${refNuevo} --aplicar\n`);
  process.exit(0);
}

for (const f of afectados) {
  fs.writeFileSync(f.archivo, f.contenido.split(REF_VIEJO).join(refNuevo));
}

console.log(`\n✅ Listo: ${total} referencias actualizadas en ${afectados.length} archivos.`);
console.log(`\n   Revisá el cambio con:  git diff`);
console.log(`   Y acordate de que las imágenes de FotosPagina tienen que existir`);
console.log(`   en el bucket del proyecto nuevo, o van a seguir rotas:`);
console.log(`     node scripts/rescate-fotospagina.mjs\n`);
