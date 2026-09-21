"use client";

// ============================================================
//  El mapa de la ficha, cargado recién cuando hace falta
// ============================================================
//  Existe por dos motivos.
//
//  1. `dynamic(..., { ssr: false })` no se puede usar dentro de un Server
//     Component, y react-leaflet toca `window` apenas se importa. Es el
//     mismo envoltorio que ya usa /mapa con MapaCliente.
//
//  2. Leaflet son ~150 KB de JavaScript que antes se descargaban en toda
//     visita a una ficha, incluso las de quien nunca bajaba hasta el mapa.
//     Acá se espera a que el bloque esté por entrar en pantalla. Quien lee
//     la descripción y se va nunca lo baja.
// ============================================================

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const MapViewer = dynamic(() => import("../../components/MapViewer"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-input animate-pulse flex items-center justify-center text-foreground/60 font-medium font-sans">
            Cargando mapa...
        </div>
    ),
});

export default function UbicacionMapa({ lat, lng }: { lat: number | null; lng: number | null }) {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!lat || !lng || visible) return;
        const nodo = contenedorRef.current;
        if (!nodo) return;

        // Sin IntersectionObserver (navegadores muy viejos) se carga igual:
        // vale más que el mapa aparezca a ahorrar los kilobytes. Se difiere
        // un tick en vez de llamar a setVisible acá mismo, que dispararía un
        // segundo render en cadena.
        if (typeof IntersectionObserver === "undefined") {
            const t = setTimeout(() => setVisible(true), 0);
            return () => clearTimeout(t);
        }

        const obs = new IntersectionObserver(
            (entradas) => {
                if (entradas.some((e) => e.isIntersecting)) {
                    setVisible(true);
                    obs.disconnect();
                }
            },
            // 300 px de anticipación: para cuando llega, ya está dibujado.
            { rootMargin: "300px" }
        );
        obs.observe(nodo);
        return () => obs.disconnect();
    }, [lat, lng, visible]);

    return (
        <div
            ref={contenedorRef}
            className="w-full h-[450px] bg-input rounded-xl overflow-hidden border border-border-card relative z-0 shadow-sm"
        >
            {lat && lng ? (
                visible ? (
                    <MapViewer lat={lat} lng={lng} />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-foreground/50 font-sans text-sm">
                        Mapa
                    </div>
                )
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-foreground/70 font-medium bg-card px-4 py-2 rounded-lg shadow-sm font-sans border border-border-card">
                        Ubicación exacta no especificada
                    </span>
                </div>
            )}
        </div>
    );
}
