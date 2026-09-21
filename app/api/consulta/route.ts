// ============================================================
//  Recibir una consulta del sitio
// ============================================================
//  EL PROBLEMA QUE RESUELVE
//
//  Los dos formularios del sitio —el de la ficha y el de /contacto—
//  insertaban directo en la tabla `inquiries` usando la clave anónima.
//  Esa clave está, por diseño, dentro del JavaScript que descarga
//  cualquier visitante: se la copia con el inspector abierto. Con eso,
//  llenar la tabla de basura es un script de diez líneas, y el plan free
//  de Supabase son 500 MB.
//
//  Ahora la escritura la hace el servidor con la service_role, que nunca
//  sale de Vercel. Del lado del navegador ya no hay permiso de escritura
//  que robar (ver backup/sql/04-blindaje-escrituras.sql).
//
//  LOS FILTROS
//
//  Nada de captcha: molesta a la clienta más que a los bots. Dos señales
//  alcanzan para la escala de este sitio:
//   · un campo oculto que un humano nunca ve ni completa
//   · el tiempo que tardó el formulario en llenarse
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

/** Un humano no completa un formulario de cuatro campos en menos de esto. */
const DEMORA_MINIMA_MS = 2000;

const LIMITES = { name: 120, phone: 40, email: 160, message: 2000 } as const;

function texto(valor: unknown, maximo: number): string {
    return typeof valor === "string" ? valor.trim().slice(0, maximo) : "";
}

export async function POST(request: Request) {
    let cuerpo: Record<string, unknown>;
    try {
        cuerpo = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: "Cuerpo inválido" }, { status: 400 });
    }

    // ── Filtros anti-bot ─────────────────────────────────────
    // Respondemos 200 a propósito: si el bot supiera que lo detectamos,
    // probaría otra cosa. Que crea que salió bien y se vaya.
    const trampa = texto(cuerpo.empresa, 50);
    const demora = typeof cuerpo.demora === "number" ? cuerpo.demora : 0;
    if (trampa || demora < DEMORA_MINIMA_MS) {
        return NextResponse.json({ ok: true });
    }

    // ── Validación ───────────────────────────────────────────
    const name = texto(cuerpo.name, LIMITES.name);
    const phone = texto(cuerpo.phone, LIMITES.phone);
    const email = texto(cuerpo.email, LIMITES.email);
    const message = texto(cuerpo.message, LIMITES.message);

    if (!name || !message || (!phone && !email)) {
        return NextResponse.json(
            { ok: false, error: "Faltan datos obligatorios" },
            { status: 400 }
        );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    // El id de propiedad, si vino, tiene que ser un UUID: así nadie mete
    // texto arbitrario en una columna que después lee el panel.
    const bruto = texto(cuerpo.property_id, 40);
    const property_id =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bruto)
            ? bruto
            : null;

    // ── Guardar ──────────────────────────────────────────────
    const { error } = await supabaseAdmin
        .from("inquiries")
        .insert([{ property_id, name, phone, email, message }]);

    if (error) {
        console.error("[consulta] no se pudo guardar:", error.message);
        return NextResponse.json(
            { ok: false, error: "No se pudo guardar la consulta" },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}
