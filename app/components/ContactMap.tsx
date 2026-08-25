"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { marcadorMinini } from "../lib/marcadorMapa";
import { useEffect, useState } from "react";

// El pin ahora es un SVG local (app/lib/marcadorMapa.ts): ya no hace
// falta crearlo en el cliente ni pedirlo a un CDN.
const createIcon = () => marcadorMinini;

const sedes = [
    {
        id: 1,
        nombre: "Administración Minini",
        coords: [-36.69815, -56.67730] as [number, number],
        info: "Administración de Propiedades y Consorcios.",
        googleMaps: "https://www.google.com/maps/search/?api=1&query=-36.69815,-56.67730"
    },
    {
        id: 2,
        nombre: "Minini Propiedades",
        coords: [-36.69895, -56.67747] as [number, number],
        info: "Ventas, Tasaciones y Alquileres.",
        googleMaps: "https://www.google.com/maps/search/?api=1&query=-36.69895,-56.67747"
    }
];

export default function ContactMap() {
    const [markerIcon, setMarkerIcon] = useState<L.DivIcon | null>(null);

    useEffect(() => {
        setMarkerIcon(createIcon());
    }, []);

    if (!markerIcon) return null;

    return (
        <div className="w-full h-full relative">
            <style>{`
        .leaflet-container { filter: grayscale(100%) invert(5%) contrast(90%); } 
        .dark .leaflet-container { filter: grayscale(100%) invert(95%) contrast(85%); }
        .minimal-popup .leaflet-popup-content-wrapper {
          background: white;
          color: #171717;
          border-radius: 8px;
          padding: 0;
        }
        .dark .minimal-popup .leaflet-popup-content-wrapper {
          background: #1e1e1e;
          color: #ededed;
        }
        .minimal-popup .leaflet-popup-tip {
          display: none;
        }
      `}</style>

            <MapContainer
                center={[-36.6985, -56.6774]}
                zoom={18}
                scrollWheelZoom={false}
                className="w-full h-full"
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {sedes.map((sede) => (
                    <Marker
                        key={sede.id}
                        position={sede.coords}
                        icon={markerIcon}
                        eventHandlers={{
                            mouseover: (e) => {
                                e.target.openPopup();
                            },
                            mouseout: (e) => {
                                e.target.closePopup();
                            },
                            click: () => {
                                window.open(sede.googleMaps, '_blank');
                            }
                        }}
                    >
                        <Popup closeButton={false} className="minimal-popup">
                            <div className="p-2 text-center pointer-events-none">
                                <strong className="text-primary block border-b border-gray-100 dark:border-neutral-800 mb-1 font-serif">{sede.nombre}</strong>
                                <p className="text-[10px] opacity-70 leading-tight mt-1 font-sans">{sede.info}</p>
                                <span className="text-[9px] text-primary font-bold mt-2 block uppercase tracking-tighter">Click para ir a Google Maps</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}