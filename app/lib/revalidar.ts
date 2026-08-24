"use client";

// ============================================================
//  Avisarle a la web pública que algo cambió
// ============================================================
//  Se llama desde el panel después de guardar, borrar, cambiar el
//  estado o destacar una propiedad. Sin esto, la web pública sigue
//  mostrando la copia en caché hasta que se vence sola.
//
//  Nunca rompe el flujo del panel: si el aviso falla, se registra en la
//  consola y listo. Lo importante —el cambio en la base— ya se guardó.
// ============================================================

import { supabase } from "./supabase";

/**
 * Regenera las páginas públicas afectadas por un cambio.
 * @param propiedadId opcional: además regenera el detalle de esa propiedad.
 */
export async function avisarCambio(propiedadId?: string): Promise<boolean> {
    try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
            console.warn("[revalidar] sin sesión activa, no se avisó del cambio");
            return false;
        }

        const res = await fetch("/api/revalidar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: propiedadId }),
        });

        if (!res.ok) {
            console.warn("[revalidar] el servidor respondió", res.status);
            return false;
        }
        return true;
    } catch (err) {
        console.warn("[revalidar] no se pudo avisar:", err);
        return false;
    }
}
