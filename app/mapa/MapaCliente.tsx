"use client";

// ============================================================
//  Envoltorio de cliente para el mapa
// ============================================================
//  Existe por un detalle de Next.js: `dynamic(..., { ssr: false })` no se
//  puede usar dentro de un Server Component. Y el mapa TIENE que quedar
//  fuera del renderizado en servidor, porque react-leaflet toca `window`
//  apenas se importa el módulo.
//
//  Es el mismo patrón que ya usan PropertyDetailClient (con MapViewer) y
//  el alta de propiedades (con MapPicker).
// ============================================================

import dynamic from "next/dynamic";
import type { PropiedadEnMapa } from "../components/MapaPropiedades";

const MapaPropiedades = dynamic(() => import("../components/MapaPropiedades"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-input">
            <div className="flex items-center gap-3 text-foreground/40 font-sans text-sm">
                <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Cargando mapa…
            </div>
        </div>
    ),
});

export default function MapaCliente({ propiedades }: { propiedades: PropiedadEnMapa[] }) {
    return <MapaPropiedades propiedades={propiedades} />;
}
