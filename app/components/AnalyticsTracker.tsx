"use client";

// ============================================================
//  Registro de visitas
// ============================================================
//  No escribe directo en Supabase con la clave anónima —que cualquiera
//  puede sacar del bundle y usar para llenar la tabla— sino que avisa a
//  /api/visita, y el registro lo hace el servidor. Allá se filtran los
//  robots, que antes contaban como visitas reales.
//
//  CAMBIO: antes registraba UNA sola fila por sesión. Con eso el panel
//  solo podía decir cuánta gente entró, nunca QUÉ miraron — y las dos
//  tarjetas ("Total de Clics" y "Personas Distintas") terminaban midiendo
//  casi lo mismo. Ahora registra una fila por página distinta visitada,
//  que es lo que permite mostrar las propiedades más vistas.
//
//  Lo que NO hace: registrar la misma página dos veces en la misma
//  sesión. Si alguien va y vuelve a una ficha, cuenta una sola vez.
//
//  Costo: una sesión típica mira 3 o 4 páginas, así que pasamos de ~600
//  filas por mes a ~2.500. Con la limpieza a 180 días la tabla se queda
//  en torno a 1,5 MB contra los 500 MB del plan free. Despreciable.

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const CLAVE_VISTAS = "minini_vistas";
const CLAVE_SESION = "minini_session_id";

// Tope de páginas registradas por sesión. Alguien (o algo) que recorra el
// sitio entero no va a generar 200 invocaciones de Vercel ni 200 filas.
const TOPE_POR_SESION = 30;

export default function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname || pathname.startsWith("/admin")) return;

        // sessionStorage puede no estar (modo privado de algunos navegadores,
        // cookies bloqueadas). Si falla, no registramos y listo.
        let sessionId: string;
        try {
            let vistas: string[] = [];
            try {
                const guardado = sessionStorage.getItem(CLAVE_VISTAS);
                if (guardado) vistas = JSON.parse(guardado);
                if (!Array.isArray(vistas)) vistas = [];
            } catch {
                vistas = [];
            }

            // Esta página ya se contó en esta sesión, o la sesión ya llegó
            // al tope. En los dos casos, nada que hacer.
            if (vistas.includes(pathname) || vistas.length >= TOPE_POR_SESION) return;

            sessionId = sessionStorage.getItem(CLAVE_SESION) ?? "";
            if (!sessionId) {
                sessionId = `sess_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
                sessionStorage.setItem(CLAVE_SESION, sessionId);
            }

            // Se marca antes de mandar: si el pedido falla, preferimos perder
            // una visita antes que reintentar en cada navegación.
            vistas.push(pathname);
            sessionStorage.setItem(CLAVE_VISTAS, JSON.stringify(vistas));
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
