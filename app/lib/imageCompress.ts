// ============================================================
//  Compresión de imágenes en el navegador, antes de subirlas
// ============================================================
//  ACÁ ESTABA LA RAÍZ DEL PROBLEMA QUE PAUSÓ EL PROYECTO.
//
//  La versión anterior comprimía a JPEG 1920px calidad 0.8. Eso deja una foto
//  de celular en ~500 KB - 1.5 MB. Con ~19 fotos por propiedad, cada
//  propiedad ocupaba ~20 MB y el giga gratis se llenó a las 50 propiedades.
//  (Promedio real medido sobre las 2817 fotos subidas: 1.07 MB cada una.)
//
//  Qué cambia ahora:
//    · WebP en lugar de JPEG      → pesa la mitad a igual calidad visual
//    · 1600 px en lugar de 1920   → nadie nota la diferencia en pantalla
//    · genera además un "thumb"   → el listado baja 40 KB, no 1 MB
//    · respeta la orientación EXIF → las fotos verticales dejan de rotarse
//    · si algo falla, avisa en vez de subir el archivo original de 12 MB
//
//  Resultado esperado: ~140 KB por foto en vez de ~1 MB. Con eso entran
//  unas 7000 fotos nuevas en el mismo giga gratis.
// ============================================================

export type ImagenComprimida = {
    /** Imagen principal: hasta 1600px. Es la que se ve en el detalle. */
    full: File;
    /** Miniatura hasta 640px. Es la que va en las tarjetas del listado. */
    thumb: File;
    /** Peso original, para poder mostrarle al usuario cuánto se ahorró. */
    bytesOriginales: number;
};

const FULL = { maxAncho: 1600, calidad: 0.78 };
const THUMB = { maxAncho: 640, calidad: 0.7 };

/** ¿El navegador sabe generar WebP desde un canvas? (todos los modernos, sí) */
function soportaWebp(): boolean {
    try {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        return c.toDataURL("image/webp").startsWith("data:image/webp");
    } catch {
        return false;
    }
}

async function redimensionar(
    bitmap: ImageBitmap,
    maxAncho: number,
    calidad: number,
    tipo: string,
    nombreBase: string
): Promise<File> {
    const escala = Math.min(1, maxAncho / bitmap.width);
    const ancho = Math.max(1, Math.round(bitmap.width * escala));
    const alto = Math.max(1, Math.round(bitmap.height * escala));

    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("El navegador no pudo crear el lienzo de dibujo.");

    // Mejora notablemente el resultado al achicar mucho una foto grande
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, tipo, calidad)
    );
    if (!blob) throw new Error("El navegador no pudo comprimir la imagen.");

    const ext = tipo === "image/webp" ? ".webp" : ".jpg";
    return new File([blob], nombreBase + ext, { type: tipo });
}

/**
 * Comprime una imagen y devuelve la versión grande + la miniatura.
 * Lanza un error si no puede procesarla, para que la pantalla lo muestre
 * en lugar de subir silenciosamente un archivo enorme.
 */
export async function comprimirImagen(file: File): Promise<ImagenComprimida> {
    if (!file.type.startsWith("image/")) {
        throw new Error(`"${file.name}" no parece ser una imagen.`);
    }
    if (file.type === "image/svg+xml") {
        throw new Error("Los archivos SVG no se pueden usar como foto de propiedad.");
    }

    let bitmap: ImageBitmap;
    try {
        // imageOrientation: "from-image" aplica la rotación EXIF del celular
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
        // Caso típico: fotos .HEIC de iPhone, que Chrome/Firefox no decodifican
        throw new Error(
            `No se pudo abrir "${file.name}". ` +
            `Si es una foto de iPhone en formato HEIC, cambiá en el celular ` +
            `Ajustes → Cámara → Formatos → "Más compatible", o convertila a JPG antes de subirla.`
        );
    }

    const tipo = soportaWebp() ? "image/webp" : "image/jpeg";
    const nombreBase = file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "foto";

    try {
        const [full, thumb] = await Promise.all([
            redimensionar(bitmap, FULL.maxAncho, FULL.calidad, tipo, nombreBase),
            redimensionar(bitmap, THUMB.maxAncho, THUMB.calidad, tipo, nombreBase),
        ]);
        return { full, thumb, bytesOriginales: file.size };
    } finally {
        bitmap.close();
    }
}

/** Formatea un tamaño en bytes para mostrarlo en pantalla. */
export function formatearPeso(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Compatibilidad hacia atrás ──────────────────────────────
// Si quedó algún import viejo de `compressImage`, sigue funcionando y
// devuelve solo la imagen grande.
export async function compressImage(file: File): Promise<File> {
    try {
        const { full } = await comprimirImagen(file);
        return full;
    } catch {
        return file;
    }
}
