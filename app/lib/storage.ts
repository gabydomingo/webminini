// ============================================================
//  Subida de fotos — un solo lugar para toda la app
// ============================================================
//  Hoy sube al Storage de Supabase. El día que pases a Cloudflare R2 se
//  cambia SOLO este archivo (o directamente la variable de entorno), y ni
//  la pantalla de alta ni la de edición se enteran.
//
//  Convención de nombres en el bucket:
//     propiedades/abc123-1786.webp          ← imagen grande (detalle)
//     propiedades/thumb/abc123-1786.webp    ← miniatura (listado)
//
//  Guardamos en la base solo la URL grande. La miniatura se deduce con
//  urlMiniatura(), así no hace falta tocar el esquema de la tabla.
// ============================================================

import { supabase } from "./supabase";
import { comprimirImagen, type ImagenComprimida } from "./imageCompress";

const BUCKET = "propiedades";

/** Nombre único y corto, sin acentos ni espacios que rompan la URL. */
function nombreUnico(extension: string): string {
    const azar = Math.random().toString(36).substring(2, 10);
    return `${azar}-${Date.now()}.${extension}`;
}

/**
 * Dada la URL de la imagen grande, devuelve la de su miniatura.
 * Si no encuentra el patrón esperado, devuelve la original: peor es no
 * mostrar nada.
 */
export function urlMiniatura(urlGrande: string): string {
    if (!urlGrande) return urlGrande;
    const marca = `/${BUCKET}/`;
    const i = urlGrande.lastIndexOf(marca);
    if (i === -1) return urlGrande;
    const cabeza = urlGrande.slice(0, i + marca.length);
    const cola = urlGrande.slice(i + marca.length);
    if (cola.startsWith("thumb/")) return urlGrande;
    return `${cabeza}thumb/${cola}`;
}

export type ResultadoSubida = {
    url: string;
    bytesOriginales: number;
    bytesFinales: number;
};

/**
 * Sube una imagen YA comprimida (grande + miniatura).
 * Se usa cuando la pantalla comprimió al elegir el archivo, para no hacer
 * el trabajo dos veces.
 */
export async function subirComprimida(comp: ImagenComprimida): Promise<ResultadoSubida> {
    const ext = comp.full.name.split(".").pop() || "webp";
    const nombre = nombreUnico(ext);
    const contentType = comp.full.type;

    // 1) imagen grande
    const { error: errFull } = await supabase.storage
        .from(BUCKET)
        .upload(nombre, comp.full, { contentType, cacheControl: "31536000", upsert: false });
    if (errFull) throw new Error(`No se pudo subir "${comp.full.name}": ${errFull.message}`);

    // 2) miniatura. Si falla, no abortamos: el listado puede caer en la grande.
    try {
        await supabase.storage
            .from(BUCKET)
            .upload(`thumb/${nombre}`, comp.thumb, {
                contentType,
                cacheControl: "31536000",
                upsert: false,
            });
    } catch {
        /* seguimos igual */
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(nombre);

    return {
        url: publicUrl,
        bytesOriginales: comp.bytesOriginales,
        bytesFinales: comp.full.size + comp.thumb.size,
    };
}

/** Comprime y sube una foto en un solo paso. */
export async function subirFoto(file: File): Promise<ResultadoSubida> {
    const comp = await comprimirImagen(file);
    return subirComprimida(comp);
}

/** Borra una foto y su miniatura a partir de la URL pública. */
export async function borrarFoto(urlPublica: string): Promise<void> {
    const marca = `/${BUCKET}/`;
    const i = urlPublica.lastIndexOf(marca);
    if (i === -1) return;
    const clave = decodeURIComponent(urlPublica.slice(i + marca.length).split("?")[0]);
    await supabase.storage.from(BUCKET).remove([clave, `thumb/${clave}`]);
}

// ── Para cuando migres a Cloudflare R2 ──────────────────────
// Reemplazá el cuerpo de subirFoto() por un POST a una API route que use
// las credenciales de R2 del lado del servidor, y ajustá urlMiniatura()
// al esquema /full/ y /thumb/ que arma scripts/03-subir-r2.mjs.
// Nada más de la app necesita cambiar.
