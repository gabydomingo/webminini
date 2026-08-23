// ============================================================
//  Utilidades de URLs de imágenes — sin dependencias
// ============================================================
//  Vive aparte de storage.ts a propósito: storage.ts arrastra el cliente de
//  Supabase y el compresor del navegador, y el listado de propiedades no
//  necesita nada de eso. Así la tarjeta queda liviana.
//
//  Esquema de nombres en el bucket:
//     propiedades/abc123.webp          ← grande, para el detalle
//     propiedades/thumb/abc123.webp    ← miniatura, para el listado
// ============================================================

const BUCKET = "propiedades";

/**
 * Dada la URL de la imagen grande, devuelve la de su miniatura.
 * Si la URL no tiene el formato esperado, devuelve la original.
 *
 * ⚠️ Esto NO garantiza que la miniatura exista en el bucket. Las fotos
 * subidas antes de la migración pueden no tenerla. Por eso el componente
 * que la muestra tiene que saber volver a la grande si da 404 — de eso se
 * ocupa FotoPropiedad.tsx.
 */
export function urlMiniatura(urlGrande: string): string {
    if (!urlGrande) return urlGrande;
    const marca = `/${BUCKET}/`;
    const i = urlGrande.lastIndexOf(marca);
    if (i === -1) return urlGrande;
    const cabeza = urlGrande.slice(0, i + marca.length);
    const cola = urlGrande.slice(i + marca.length);
    if (cola.startsWith("thumb/")) return urlGrande; // ya es miniatura
    return `${cabeza}thumb/${cola}`;
}

/** El camino inverso: de una miniatura a la imagen grande. */
export function urlGrande(url: string): string {
    return url ? url.replace(`/${BUCKET}/thumb/`, `/${BUCKET}/`) : url;
}
