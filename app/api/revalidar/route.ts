// ============================================================
//  Avisar a Next que una propiedad cambió
// ============================================================
//  EL PROBLEMA QUE RESUELVE
//
//  Las páginas públicas se generan una vez y se guardan en caché
//  (`export const revalidate = 86400`). Eso está bien: hace que la web
//  vuele y que casi no se consulte Supabase. Pero tiene una contra —
//  cuando se corrige un precio o se destaca una propiedad, el panel lo
//  muestra al instante (lee en vivo) y la web pública no, porque sigue
//  sirviendo la copia guardada.
//
//  De ahí venían los dos síntomas: un precio arreglado que seguía
//  mostrándose viejo, y una propiedad que se destacaba o se sacaba de
//  destacados sin que la portada se enterara.
//
//  LA SOLUCIÓN
//
//  En vez de bajar el tiempo de caché —que haría consultar Supabase
//  mucho más seguido y gastar invocaciones de Vercel en cada visita—,
//  el panel avisa acá cuando algo cambia y solo entonces se regenera
//  lo que corresponde. Actualización instantánea y costo cero.
//
//  SEGURIDAD
//
//  Solo responde a quien mande un token de sesión válido de Supabase,
//  o sea alguien logueado en /admin. Se valida contra Supabase con la
//  service_role, del lado del servidor.
// ============================================================

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { idDesdeRuta, slugPropiedad } from "../../lib/slug";

export async function POST(request: Request) {
    // ── 1. ¿Quién llama? ────────────────────────────────────
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) {
        return NextResponse.json(
            { ok: false, error: "Falta el token de sesión" },
            { status: 401 }
        );
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
        return NextResponse.json(
            { ok: false, error: "Sesión inválida o vencida" },
            { status: 401 }
        );
    }

    // ── 2. Regenerar solo lo que cambió ─────────────────────
    let cuerpo: Cambio = { alcance: "todo" };
    try {
        const leido = await request.json();
        if (leido && typeof leido === "object") cuerpo = leido as Cambio;
    } catch {
        /* sin cuerpo: se regenera todo, como antes */
    }

    const rutas = new Set<string>();

    switch (cuerpo.alcance) {
        case "destacada":
            // Las destacadas solo se ven en la portada.
            rutas.add("/");
            break;

        case "opciones":
            // Los filtros del listado salen de form_options. El buscador de
            // la portada las lee en el navegador, no hace falta tocarla.
            rutas.add("/propiedades");
            break;

        case "listados":
            // Propiedad nueva: su ficha todavía no está en caché, se genera
            // sola en la primera visita. Alcanza con los listados.
            LISTADOS.forEach((r) => rutas.add(r));
            break;

        case "propiedad": {
            LISTADOS.forEach((r) => rutas.add(r));
            const id = typeof cuerpo.id === "string" ? idDesdeRuta(cuerpo.id) : null;
            if (id) {
                for (const ruta of await rutasDeFicha(id, cuerpo.slugs)) rutas.add(ruta);
            }
            break;
        }

        default:
            // "todo": el botón "Refrescar web" del panel, o llamadas viejas.
            // Es lo único que invalida las ~140 fichas de una, así que
            // queda solo para cuando se pide a mano.
            LISTADOS.forEach((r) => rutas.add(r));
            revalidatePath("/propiedades/[id]", "page");
            rutas.add("/propiedades/[id]");
    }

    for (const ruta of rutas) {
        if (ruta !== "/propiedades/[id]") revalidatePath(ruta);
    }

    return NextResponse.json({ ok: true, regeneradas: [...rutas] });
}

// ── Qué se regenera ────────────────────────────────────────────
//
// Antes, cualquier cambio en el panel (un estado, una estrella, una
// opción) invalidaba TODAS las fichas con "/propiedades/[id]". Cada ficha
// ocupa varias entradas en el caché de Vercel (HTML + segmentos), así que
// cada guardado terminaba en cientos de ISR Writes cuando Google o los
// visitantes volvían a pasar. Era el 89 % del cupo gratuito de la cuenta.
//
// Ahora se invalida la ficha que cambió y los listados. El bloque
// "Otras propiedades en..." de las demás fichas puede tardar hasta un día
// en enterarse (el revalidate de 24 h), que para ese bloque está bien.

type Cambio =
    | { alcance: "propiedad"; id: string; slugs?: string[] }
    | { alcance: "listados" }
    | { alcance: "destacada" }
    | { alcance: "opciones" }
    | { alcance: "todo" };

const LISTADOS = ["/", "/propiedades", "/mapa", "/concretadas", "/sitemap.xml"];

/**
 * Las URLs bajo las que puede estar cacheada una ficha: la canónica actual,
 * la del UUID pelado (redirige) y las que mande el panel (la URL de antes de
 * editar, si cambió tipo, operación o localidad). Las del panel solo se
 * aceptan si terminan en el mismo UUID.
 */
async function rutasDeFicha(id: string, slugs: unknown): Promise<string[]> {
    const rutas = new Set<string>([`/propiedades/${id}`]);

    if (Array.isArray(slugs)) {
        for (const s of slugs) {
            if (typeof s === "string" && s.length < 300 && idDesdeRuta(s) === id) {
                rutas.add(`/propiedades/${s}`);
            }
        }
    }

    // Una fila, cinco columnas: no mueve la aguja del egress de Supabase.
    const { data } = await supabaseAdmin
        .from("properties")
        .select("id, title, property_type, operation_type, localidad")
        .eq("id", id)
        .maybeSingle();

    if (data) rutas.add(`/propiedades/${slugPropiedad(data)}`);

    return [...rutas];
}
