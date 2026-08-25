"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { marcadorMinini } from '../lib/marcadorMapa';


export default function MapViewer({ lat, lng }: { lat: number; lng: number }) {
    const [isMounted, setIsMounted] = useState(false);

    // 1. Estado para guardar el control del mapa
    const [map, setMap] = useState<L.Map | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || !lat || !lng) return null;

    const position = new L.LatLng(lat, lng);

    // 2. Función para volar de regreso al marcador
    const handleRecenter = () => {
        if (map) {
            map.flyTo(position, 17, {
                animate: true,
                duration: 1.5 // Duración de la animación en segundos
            });
        }
    };

    return (
        <div className="h-full w-full relative z-0">

            {/* 3. Botón Flotante para re-centrar */}
            <button
                onClick={handleRecenter}
                className="absolute top-4 right-4 z-[1000] bg-white text-gray-700 p-2.5 rounded-lg shadow-md hover:bg-gray-50 hover:text-[#8B1A1A] transition-all border border-gray-200"
                title="Volver a la propiedad"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v4m0 8v4m8-8h-4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            <MapContainer
                key={`${lat}-${lng}`}
                center={position}
                zoom={17}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                dragging={true}
                zoomControl={false}
                ref={setMap} // <-- 4. Le pasamos el setter para capturar la instancia
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    detectRetina={true}
                />
                <Marker position={position} icon={marcadorMinini} interactive={false} />
            </MapContainer>
        </div>
    );
}