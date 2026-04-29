"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase"; // Ajusta esta ruta si es necesario

export default function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Evitamos registrar las visitas del administrador al panel
        if (pathname.startsWith("/admin")) return;

        const recordVisit = async () => {
            // 1. Obtener o crear un Session ID único para este visitante
            let sessionId = sessionStorage.getItem("minini_session_id");
            if (!sessionId) {
                sessionId = `sess_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
                sessionStorage.setItem("minini_session_id", sessionId);
            }

            // 2. Detección básica de dispositivo (Celular vs PC)
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );

            // 3. Enviar a Supabase
            try {
                await supabase.from("page_views").insert([
                    {
                        path: pathname,
                        device: isMobile ? "mobile" : "desktop",
                        session_id: sessionId, // <- Guardamos el ID del visitante
                    },
                ]);
            } catch (error) {
                console.error("Error registrando visita:", error);
            }
        };

        recordVisit();
    }, [pathname]);

    return null; // Es invisible, no renderiza nada
}