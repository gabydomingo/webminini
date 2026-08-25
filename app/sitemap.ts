import type { MetadataRoute } from "next";
import { supabase } from "./lib/supabase";

// ============================================================
//  sitemap.xml
// ============================================================
//  Le da a Google la lista completa de páginas, incluida UNA POR CADA
//  PROPIEDAD. Sin esto, Google tiene que descubrir las 150 fichas
//  siguiendo links desde el listado —que se arma con JavaScript—, así
//  que muchas no llegaban a indexarse nunca.
//
//  Se regenera con la misma cadencia que el listado, así que no agrega
//  consultas a Supabase en cada visita.
// ============================================================

export const revalidate = 3600; // una vez por hora alcanza y sobra

const SITIO = "https://propiedadesminini.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Páginas fijas
    const fijas: MetadataRoute.Sitemap = [
        { url: SITIO, changeFrequency: "daily", priority: 1 },
        { url: `${SITIO}/propiedades`, changeFrequency: "daily", priority: 0.9 },
        { url: `${SITIO}/mapa`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITIO}/concretadas`, changeFrequency: "weekly", priority: 0.6 },
        { url: `${SITIO}/sobre-nosotros`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${SITIO}/contacto`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${SITIO}/administrador`, changeFrequency: "monthly", priority: 0.5 },
    ];

    // Una entrada por propiedad publicada
    let propiedades: MetadataRoute.Sitemap = [];
    try {
        const { data, error } = await supabase
            .from("properties")
            .select("id, created_at, status")
            .in("status", ["disponible", "reservado"])
            .order("created_at", { ascending: false });

        if (error) throw error;

        propiedades = (data || []).map((p) => ({
            url: `${SITIO}/propiedades/${p.id}`,
            lastModified: p.created_at ? new Date(p.created_at) : undefined,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

        if (!propiedades.length) {
            console.warn(
                "[sitemap] Supabase respondió sin propiedades. El sitemap va a salir " +
                "solo con las páginas fijas y Google no va a ver las fichas."
            );
        } else {
            console.log(`[sitemap] ${propiedades.length} propiedades incluidas`);
        }
    } catch (err) {
        // No rompemos /sitemap.xml entero por esto, pero que NO pase
        // desapercibido: sin este aviso, el sitemap sale con 7 URLs en vez
        // de 150 y nadie se entera hasta que Google deja de indexar.
        console.error(
            "[sitemap] ⚠️  No se pudieron leer las propiedades de Supabase. " +
            "El sitemap sale incompleto. Detalle:", err
        );
    }

    return [...fijas, ...propiedades];
}
