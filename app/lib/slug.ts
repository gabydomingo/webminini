// ============================================================
//  URLs de propiedad con slug
// ============================================================
//  Antes una ficha vivía en /propiedades/e134bf5b-1ec6-40b1-8b2c-a8c9b98aa1e2.
//  Para Google eso no dice nada, y en un resultado de búsqueda el usuario ve
//  una tira de caracteres al azar. Ahora la URL canónica es:
//
//     /propiedades/triplex-en-venta-mar-de-ajo-e134bf5b-1ec6-40b1-...
//
//  EL UUID VA AL FINAL A PROPÓSITO. Así no hace falta guardar el slug en la
//  base ni migrar nada: el servidor lo recorta del final del parámetro y
//  busca por id, como toda la vida. Si mañana cambia el título o la
//  localidad, la URL cambia sola y la vieja sigue resolviendo — la ficha
//  redirige a la canónica con un 308 y Google traspasa el posicionamiento.
// ============================================================

/** Un UUID pegado al final de la cadena. */
const UUID_AL_FINAL =
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** Largo máximo de la parte legible. Más que esto Google la recorta igual. */
const LARGO_MAX = 70;

/**
 * "TRIPLEX en Venta — Mar de Ajó" → "triplex-en-venta-mar-de-ajo"
 * Saca acentos, ñ, signos y espacios repetidos.
 */
export function aSlug(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, LARGO_MAX)
        .replace(/-+$/g, ""); // por si el corte quedó en un guión
}

/** Lo mínimo que hace falta para armar la URL de una propiedad. */
export type DatosDeSlug = {
    id: string;
    property_type?: string | null;
    operation_type?: string | null;
    localidad?: string | null;
    title?: string | null;
};

/**
 * El slug canónico de una propiedad, UUID incluido.
 *
 * Se arma con tipo + operación + localidad en vez del título porque son los
 * términos que la gente realmente busca ("departamento en alquiler san
 * bernardo"). Si esos campos vinieran vacíos cae al título, y si tampoco hay
 * título devuelve el UUID pelado, que siempre resuelve.
 */
export function slugPropiedad(p: DatosDeSlug): string {
    const partes = [p.property_type, p.operation_type && `en ${p.operation_type}`, p.localidad]
        .filter(Boolean)
        .join(" ");

    const legible = aSlug(partes || p.title || "");
    return legible ? `${legible}-${p.id}` : p.id;
}

/** La ruta completa lista para un <Link href>. */
export function rutaPropiedad(p: DatosDeSlug): string {
    return `/propiedades/${slugPropiedad(p)}`;
}

/**
 * El camino inverso: del parámetro de la URL al id de la base.
 *
 * Acepta tanto la URL canónica como el UUID pelado de las URLs viejas, que
 * siguen dando vueltas por WhatsApp y en el índice de Google. Devuelve null
 * si no hay un UUID reconocible, y ahí la página responde 404.
 */
export function idDesdeRuta(parametro: string): string | null {
    const limpio = decodeURIComponent(parametro || "");
    const m = limpio.match(UUID_AL_FINAL);
    return m ? m[1].toLowerCase() : null;
}
