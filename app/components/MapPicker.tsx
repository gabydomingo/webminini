'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Solución al clásico bug de Next.js con los íconos de Leaflet
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
})

// Componente interno para manejar los clics en el mapa
function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng)
        },
    })

    return position === null ? null : (
        <Marker position={position} icon={icon}></Marker>
    )
}

export default function MapPicker({
    lat,
    lng,
    onChange
}: {
    lat: string,
    lng: string,
    onChange: (lat: string, lng: string) => void
}) {
    // Centro por defecto: Partido de La Costa
    const defaultCenter = new L.LatLng(-36.722, -56.672)

    const [position, setPosition] = useState<L.LatLng | null>(
        lat && lng ? new L.LatLng(parseFloat(lat), parseFloat(lng)) : null
    )

    const handleSetPosition = (pos: L.LatLng) => {
        setPosition(pos)
        onChange(pos.lat.toString(), pos.lng.toString())
    }

    return (
        <div className="h-[350px] w-full rounded border border-gray-300 relative z-0 overflow-hidden shadow-sm">
            <MapContainer
                center={position || defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={handleSetPosition} />
            </MapContainer>
        </div>
    )
}