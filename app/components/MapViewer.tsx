"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Solución al bug de Next.js con los íconos de Leaflet
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function MapViewer({ lat, lng }: { lat: number; lng: number }) {
    // 1. Estado para asegurar que el DOM está listo
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Si no está montado o faltan coordenadas, no intentamos dibujar nada
    if (!isMounted || !lat || !lng) return null;

    const position = new L.LatLng(lat, lng);

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                key={`${lat}-${lng}`} // 2. Truco mágico para evitar errores de DOM
                center={position}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
                dragging={false}
                zoomControl={false} // Sacamos los controles de +/- para que quede más limpio
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position} icon={icon} interactive={false} />
            </MapContainer>
        </div>
    );
}