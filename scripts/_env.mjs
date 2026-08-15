// Lector mínimo de .env.local — sin dependencias.
// Evita tener que instalar dotenv solo para leer un archivo de texto.
import fs from "fs";
import path from "path";

export function cargarEnv(archivo = ".env.local") {
  const ruta = path.isAbsolute(archivo) ? archivo : path.join(process.cwd(), archivo);
  if (!fs.existsSync(ruta)) return {};

  const texto = fs.readFileSync(ruta, "utf-8");
  const vars = {};

  for (let linea of texto.split(/\r?\n/)) {
    linea = linea.trim();
    if (!linea || linea.startsWith("#")) continue;

    const i = linea.indexOf("=");
    if (i === -1) continue;

    const clave = linea.slice(0, i).trim().replace(/^export\s+/, "");
    let valor = linea.slice(i + 1).trim();

    // sacar comillas envolventes si las hay
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    vars[clave] = valor;
    if (process.env[clave] === undefined) process.env[clave] = valor;
  }

  return vars;
}
