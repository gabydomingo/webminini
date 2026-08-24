"use client";

// ============================================================
//  Mapa con todas las propiedades a la vez
// ============================================================
//  Arranca centrado en el Partido de la Costa, que es donde está el 99 %
//  del catálogo (144 de 146 propiedades geolocalizadas), y se puede mover
//  y alejar libremente para llegar a las que están fuera de la zona.
//
//  Decisiones que vale la pena conocer:
//
//  · El gris del mapa se aplica SOLO a las baldosas (.leaflet-tile-pane),
//    no a todo el contenedor. Si se filtrara el contenedor entero —como
//    hace ContactMap— los puntos rojos saldrían grises y la foto del
//    hover también.
//
//  · Los puntos son CircleMarker (vectores) y no marcadores con imagen:
//    146 PNG serían 146 descargas; así son cero.
//
//  · La vista previa del hover usa la MINIATURA (~25 KB) y solo se
//    descarga cuando el mouse pasa por encima. Nunca se bajan las 146.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { urlMiniatura } from "../lib/imagenes";

/**
 * El mapa solo necesita estas columnas, no la Property entera.
 * La página consulta exactamente esto y deja afuera `description`, que
 * pesa mucho y acá no se muestra.
 */
export type PropiedadEnMapa = {
    id: string;
    title: string;
    price: number | null;
    currency: string | null;
    operation_type: string | null;
    property_type: string | null;
    localidad: string | null;
    location: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    status: string | null;
    images: string[] | null;
};

// Centro y encuadre del Partido de la Costa, calculados sobre las
// coordenadas reales del catálogo.
const CENTRO: [number, number] = [-36.6431, -56.7141];
const ZOOM_INICIAL = 12;

// Todo lo que caiga fuera de este recuadro es una propiedad de otra zona
// (hoy: Sierra de los Padres y Wilde). Se muestran igual, pero no cuentan
// para el encuadre inicial.
const COSTA = { latMin: -37.2, latMax: -36.0, lngMin: -57.2, lngMax: -56.4 };

const esDeLaCosta = (lat: number, lng: number) =>
    lat > COSTA.latMin && lat < COSTA.latMax && lng > COSTA.lngMin && lng < COSTA.lngMax;

const COLORES: Record<string, string> = {
    disponible: "#D90000", // rojo Minini
    reservado: "#BE9B5F",  // dorado
    vendido: "#6b7280",    // gris
};

type Punto = {
    id: string;
    lat: number;
    lng: number;
    title: string;
    price: number | null;
    currency: string;
    operation_type: string;
    property_type: string;
    localidad: string | null;
    location: string | null;
    status: string;
    foto: string | null;
    enLaCosta: boolean;
};

function precioLindo(price: number | null, currency: string) {
    if (!price) return "Consultar valor";
    return `${currency === "USD" ? "U$S" : "$"} ${price.toLocaleString("es-AR")}`;
}

/** Botones de zoom y encuadre, montados dentro del mapa. */
function Controles({ puntos }: { puntos: Punto[] }) {
    const map = useMap();

    const verTodas = () => {
        const conCoords = puntos.map((p) => [p.lat, p.lng] as [number, number]);
        if (conCoords.length) map.fitBounds(conCoords, { padding: [60, 60] });
    };

    const volverALaCosta = () => map.flyTo(CENTRO, ZOOM_INICIAL, { duration: 1.2 });

    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button
                onClick={() => map.zoomIn()}
                className="w-9 h-9 bg-card border border-border-card text-foreground rounded-lg shadow-md hover:text-primary transition-colors font-bold text-lg leading-none"
                aria-label="Acercar"
            >+</button>
            <button
                onClick={() => map.zoomOut()}
                className="w-9 h-9 bg-card border border-border-card text-foreground rounded-lg shadow-md hover:text-primary transition-colors font-bold text-lg leading-none"
                aria-label="Alejar"
            >−</button>
            <button
                onClick={volverALaCosta}
                title="Volver al Partido de la Costa"
                className="w-9 h-9 bg-card border border-border-card text-foreground rounded-lg shadow-md hover:text-primary transition-colors flex items-center justify-center"
                aria-label="Volver al Partido de la Costa"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v4m0 8v4m8-8h-4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            <button
                onClick={verTodas}
                title="Ver todas, incluidas las de otras zonas"
                className="w-9 h-9 bg-card border border-border-card text-foreground rounded-lg shadow-md hover:text-primary transition-colors flex items-center justify-center"
                aria-label="Ver todas las propiedades"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2" />
                </svg>
            </button>
        </div>
    );
}

export default function MapaPropiedades({ propiedades }: { propiedades: PropiedadEnMapa[] }) {
    const [montado, setMontado] = useState(false);
    const contenedor = useRef<LeafletMap | null>(null);

    // Leaflet toca window/document, así que solo montamos en el cliente.
    useEffect(() => setMontado(true), []);

    const puntos = useMemo<Punto[]>(() => {
        return (propiedades || [])
            .map((p) => {
                const lat = p.latitude != null ? Number(p.latitude) : NaN;
                const lng = p.longitude != null ? Number(p.longitude) : NaN;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                const imgs = Array.isArray(p.images) ? p.images : [];
                return {
                    id: String(p.id),
                    lat,
                    lng,
                    title: p.title,
                    price: p.price ?? null,
                    currency: p.currency || "USD",
                    operation_type: p.operation_type || "",
                    property_type: p.property_type || "",
                    localidad: p.localidad ?? null,
                    location: p.location ?? null,
                    status: p.status || "disponible",
                    foto: imgs.length ? urlMiniatura(imgs[0]) : null,
                    enLaCosta: esDeLaCosta(lat, lng),
                } as Punto;
            })
            .filter(Boolean) as Punto[];
    }, [propiedades]);

    const afuera = puntos.filter((p) => !p.enLaCosta).length;

    if (!montado) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-input text-foreground/40 font-sans text-sm">
                Cargando mapa…
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {/* El gris va SOLO en las baldosas: si filtráramos todo el contenedor,
                los puntos rojos y la foto del hover también saldrían grises. */}
            <style dangerouslySetInnerHTML={{ __html: `
                .mapa-minini .leaflet-tile-pane { filter: grayscale(100%) invert(5%) contrast(90%); }
                .dark .mapa-minini .leaflet-tile-pane { filter: grayscale(100%) invert(95%) contrast(85%); }
                .mapa-minini .leaflet-container { background: var(--input-bg); }
                .mapa-minini .leaflet-tooltip.vista-previa {
                    background: transparent; border: 0; box-shadow: none; padding: 0;
                }
                .mapa-minini .leaflet-tooltip.vista-previa::before { display: none; }
            `}} />

            <MapContainer
                center={CENTRO}
                zoom={ZOOM_INICIAL}
                minZoom={6}
                scrollWheelZoom
                zoomControl={false}
                className="mapa-minini w-full h-full z-0"
                ref={contenedor}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    detectRetina
                />

                <Controles puntos={puntos} />

                {puntos.map((p) => (
                    <CircleMarker
                        key={p.id}
                        center={[p.lat, p.lng]}
                        radius={7}
                        pathOptions={{
                            color: "#ffffff",
                            weight: 2,
                            fillColor: COLORES[p.status] ?? COLORES.disponible,
                            fillOpacity: 0.95,
                        }}
                        eventHandlers={{
                            click: () => window.open(`/propiedades/${p.id}`, "_blank", "noopener,noreferrer"),
                            mouseover: (e) => e.target.setRadius(10),
                            mouseout: (e) => e.target.setRadius(7),
                        }}
                        // el cursor de mano deja claro que se puede clickear
                        interactive
                    >
                        <Tooltip direction="top" offset={[0, -12]} opacity={1} className="vista-previa" sticky={false}>
                            <div className="w-56 bg-card border border-border-card rounded-xl overflow-hidden shadow-xl font-sans">
                                {p.foto ? (
                                    // <img> y no next/image: Leaflet inyecta esto fuera del
                                    // árbol de React y next/image no lo maneja bien acá.
                                    // Igual es la miniatura, así que pesa lo mismo.
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={p.foto}
                                        alt={p.title}
                                        loading="lazy"
                                        className="w-full h-28 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-28 bg-input flex items-center justify-center">
                                        <svg className="w-8 h-8 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="p-2.5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span
                                            className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-white"
                                            style={{ backgroundColor: COLORES[p.status] ?? COLORES.disponible }}
                                        >
                                            {p.status === "disponible" ? p.operation_type || "Venta" : p.status}
                                        </span>
                                        {p.property_type && (
                                            <span className="text-[9px] text-foreground/50 uppercase tracking-wide">{p.property_type}</span>
                                        )}
                                    </div>
                                    <p className="text-primary font-extrabold text-sm leading-tight">
                                        {precioLindo(p.price, p.currency)}
                                    </p>
                                    <p className="text-foreground text-[11px] font-semibold leading-snug mt-1 line-clamp-2">
                                        {p.title}
                                    </p>
                                    <p className="text-foreground/50 text-[10px] mt-1 leading-tight">
                                        {[p.location, p.localidad].filter(Boolean).join(" · ")}
                                    </p>
                                    <p className="text-primary/70 text-[9px] mt-1.5 font-bold uppercase tracking-wide">
                                        Clic para ver la propiedad →
                                    </p>
                                </div>
                            </div>
                        </Tooltip>
                    </CircleMarker>
                ))}
            </MapContainer>

            {/* Referencias */}
            <div className="absolute bottom-6 left-4 z-[1000] bg-card/95 backdrop-blur border border-border-card rounded-lg shadow-md px-3 py-2 font-sans">
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest mb-1.5">
                    {puntos.length} propiedades
                </p>
                <div className="flex flex-col gap-1">
                    {(["disponible", "reservado", "vendido"] as const).map((s) => {
                        const n = puntos.filter((p) => p.status === s).length;
                        if (!n) return null;
                        return (
                            <div key={s} className="flex items-center gap-1.5">
                                <span
                                    className="w-2.5 h-2.5 rounded-full border border-white shrink-0"
                                    style={{ backgroundColor: COLORES[s] }}
                                />
                                <span className="text-[11px] text-foreground/70 capitalize">{s}</span>
                                <span className="text-[11px] text-foreground/40">({n})</span>
                            </div>
                        );
                    })}
                </div>
                {afuera > 0 && (
                    <p className="text-[9px] text-foreground/40 mt-1.5 pt-1.5 border-t border-border-card leading-tight max-w-[150px]">
                        {afuera} fuera de La Costa. Usá el botón de encuadre para verlas.
                    </p>
                )}
            </div>
        </div>
    );
}
