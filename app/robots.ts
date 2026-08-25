import type { MetadataRoute } from "next";

// ============================================================
//  robots.txt
// ============================================================
//  Next lo genera solo en /robots.txt a partir de este archivo.
//  Antes no existía: Google entraba igual, pero sin indicación de qué
//  no rastrear y sin saber dónde está el sitemap.
// ============================================================

const SITIO = "https://propiedadesminini.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                // El panel no tiene nada que hacer en Google, y además
                // gastaría rastreo en páginas que piden login.
                disallow: ["/admin", "/admin/", "/api/"],
            },
        ],
        sitemap: `${SITIO}/sitemap.xml`,
        host: SITIO,
    };
}
