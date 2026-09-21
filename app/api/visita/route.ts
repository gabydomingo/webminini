// ============================================================
//  Registrar una visita
// ============================================================
//  Mismo problema que el formulario de consultas: `page_views` se escribía
//  desde el navegador con la clave anónima, que está a la vista de
//  cualquiera. Una tabla de métricas con escritura pública es una invitación
//  a que te llenen los 500 MB del plan free, y además ensucia los números
//  que mira la clienta en el panel.
//
//  Acá la escritura la hace el servidor. Es una invocación de función por
//  sesión —no por página— así que el costo en Vercel es despreciable, y a
//  cambio se puede filtrar a los robots, que antes contaban como visitas.
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

const ROBOTS = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|headlesschrome|lighthouse|pingdom|gtmetrix|semrush|ahrefs|python-requests|curl|wget/i;

export async function POST(request: Request) {
    const agente = request.headers.get("user-agent") || "";

    // Googlebot y compañía no son visitas. Que pasen sin registrar nada.
    if (!agente || ROBOTS.test(agente)) {
        return NextResponse.json({ ok: true, registrada: false });
    }

    let cuerpo: Record<string, unknown>;
    try {
        cuerpo = await request.json();
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const path = typeof cuerpo.path === "string" ? cuerpo.path.slice(0, 300) : "";
    const session_id =
        typeof cuerpo.session_id === "string" ? cuerpo.session_id.slice(0, 80) : "";

    // Solo rutas propias. Sin esto alguien puede inventar cualquier cadena.
    if (!path.startsWith("/") || !session_id) {
        return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (path.startsWith("/admin")) {
        return NextResponse.json({ ok: true, registrada: false });
    }

    const device = cuerpo.device === "mobile" ? "mobile" : "desktop";

    const { error } = await supabaseAdmin
        .from("page_views")
        .insert([{ path, device, session_id }]);

    if (error) {
        // Que una métrica falle no es motivo para romperle nada al visitante.
        console.warn("[visita] no se pudo registrar:", error.message);
        return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true, registrada: true });
}
