"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname.startsWith("/admin")) return;

        const alreadyTracked = sessionStorage.getItem("minini_tracked");
        if (alreadyTracked) return;

        const recordVisit = async () => {
            let sessionId = sessionStorage.getItem("minini_session_id");
            if (!sessionId) {
                sessionId = `sess_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
                sessionStorage.setItem("minini_session_id", sessionId);
            }

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );

            try {
                await supabase.from("page_views").insert([
                    {
                        path: pathname,
                        device: isMobile ? "mobile" : "desktop",
                        session_id: sessionId,
                    },
                ]);
                sessionStorage.setItem("minini_tracked", "1");
            } catch (error) {
                console.error("Error registrando visita:", error);
            }
        };

        recordVisit();
    }, [pathname]);

    return null;
}
