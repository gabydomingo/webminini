"use client";

// ============================================================
//  Registro de visitas
// ============================================================
//  Cambió una sola cosa respecto de antes, pero importa: ya no escribe
//  directo en Supabase con la clave anónima —que cualquiera puede sacar
//  del bundle y usar para llenar la tabla— sino que avisa a /api/visita,
//  y el registro lo hace el servidor. De paso, allá se filtran los robots,
//  que antes contaban como visitas reales.
//
//  Sigue registrando una sola vez por sesión, no por página.
// ============================================================

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const CLAVE_MARCA = "minini_tracked";
const CLAVE_SESION = "minini_session_id";

export default function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname || pathname.startsWith("/admin")) return;

        // sessionStorage puede no estar (modo privado de algunos navegadores,
        // cookies bloqueadas). Si falla, no registramos y listo.
        let sessionId: string;
        try {
            if (sessionStorage.getItem(CLAVE_MARCA)) return;
            sessionId = sessionStorage.getItem(CLAVE_SESION) ?? "";
            if (!sessionId) {
                sessionId = `sess_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
                sessionStorage.setItem(CLAVE_SESION, sessionId);
            }
            // Se marca antes de mandar: si el pedido falla, preferimos perder
            // una visita antes que reintentar en cada navegación.
            sessionStorage.setItem(CLAVE_MARCA, "1");
        } catch {
            return;
        }

        const esCelular =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );

        fetch("/api/visita", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: pathname,
                device: esCelular ? "mobile" : "desktop",
                session_id: sessionId,
            }),
            // Para que el pedido sobreviva si se van de la página enseguida.
            keepalive: true,
        }).catch(() => {
            /* una métrica perdida no le arruina la visita a nadie */
        });
    }, [pathname]);

    return null;
}
