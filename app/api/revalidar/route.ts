// ============================================================
//  Avisar a Next que una propiedad cambió
// ============================================================
//  EL PROBLEMA QUE RESUELVE
//
//  Las páginas públicas se generan una vez y se guardan en caché
//  (`export const revalidate = 120`). Eso está bien: hace que la web
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

    // ── 2. Regenerar lo que corresponda ─────────────────────
    // El cuerpo ya no se usa para nada, pero se sigue leyendo para no
    // romper llamadas viejas que mandan { id }.
    try {
        await request.json();
    } catch {
        /* sin cuerpo también vale */
    }

    const regeneradas: string[] = [];

    // La portada (destacadas), el listado, el mapa y las concretadas se ven
    // afectados por cualquier cambio: alta, baja, precio, estado o destacado.
    // El sitemap también: una propiedad nueva tiene que aparecerle a Google
    // sin esperar a que se venza solo.
    for (const ruta of ["/", "/propiedades", "/mapa", "/concretadas", "/sitemap.xml"]) {
        revalidatePath(ruta);
        regeneradas.push(ruta);
    }

    // Y las fichas.
    //
    // Antes acá iba `revalidatePath('/propiedades/' + id)`. Con las URLs
    // nuevas eso ya no sirve: la ruta canónica es
    // /propiedades/<tipo>-en-<operacion>-<localidad>-<uuid>, y si cambió la
    // localidad o el tipo, la ruta vieja y la nueva son distintas — se
    // regeneraría una página que ya nadie visita.
    //
    // Pasándole el segmento dinámico, Next invalida TODAS las fichas de una.
    // Son estáticas y livianas: regenerarlas sale mucho más barato que
    // tener una desactualizada.
    revalidatePath("/propiedades/[id]", "page");
    regeneradas.push("/propiedades/[id]");

    return NextResponse.json({ ok: true, regeneradas });
}
