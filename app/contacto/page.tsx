"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import { supabase } from "../lib/supabase";
import dynamic from "next/dynamic";

// Importamos el mapa de forma dinámica para evitar errores de SSR
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Arreglo de iconos para Leaflet
const icon = typeof window !== 'undefined' ? L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
}) : null;

const sedes = [
    {
        id: 1,
        nombre: "Administración",
        direccion: "Chiozza 1851 Local 1",
        horario: "Lunes a Sábado: 09:00 - 13:00 / 17:00 - 20:00",
        coords: [-36.6836, -56.6775] as [number, number], // Coords aprox San Bernardo
        info: "Consultas por alquileres temporarios y administración de consorcios."
    },
    {
        id: 2,
        nombre: "Agencia Inmobiliaria",
        direccion: "Chiozza 1796",
        horario: "Lunes a Sábado: 09:30 - 20:30 (Corrido)",
        coords: [-36.6828, -56.6773] as [number, number],
        info: "Venta de propiedades, tasaciones y nuevos desarrollos."
    }
];

export default function ContactoPage() {
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="bg-background min-h-screen">
            <Header />

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">

                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground font-serif mb-4">Ponte en contacto</h1>
                        <p className="text-foreground/60 max-w-2xl mx-auto font-sans">
                            Visítanos en nuestras oficinas en San Bernardo o envíanos un mensaje directo.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                        {/* Tarjetas de Sedes con Horarios */}
                        {sedes.map((sede) => (
                            <div key={sede.id} className="bg-card border border-border-card p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                    </div>
                                    <h3 className="text-xl font-bold font-serif">{sede.nombre}</h3>
                                </div>
                                <p className="text-foreground/80 text-sm mb-4 font-sans italic">{sede.direccion}</p>

                                <div className="space-y-1 border-t border-border-card pt-4">
                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-primary">Horarios de Atención</span>
                                    <p className="text-sm font-medium text-foreground/70">{sede.horario}</p>
                                </div>
                            </div>
                        ))}

                        {/* WhatsApp Card */}
                        <div className="bg-primary p-6 rounded-2xl text-white flex flex-col justify-center">
                            <h4 className="text-xl font-bold font-serif mb-2">WhatsApp Directo</h4>
                            <p className="text-white/80 text-sm mb-4">Respuesta inmediata para urgencias.</p>
                            <a href="https://wa.me/5492257307064" target="_blank" className="bg-white text-primary text-center py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-100 transition-all">
                                Enviar Mensaje
                            </a>
                        </div>
                    </div>

                    {/* Sección de Mapa y Formulario Unificada */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* El Mapa con ambos punteros */}
                        <div className="h-[500px] rounded-2xl overflow-hidden border border-border-card sticky top-32">
                            {mounted && icon && (
                                <MapContainer
                                    center={[-36.6832, -56.6774]}
                                    zoom={17}
                                    className="w-full h-full"
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    {sedes.map((sede) => (
                                        <Marker key={sede.id} position={sede.coords} icon={icon}>
                                            <Popup>
                                                <div className="p-1 font-sans">
                                                    <strong className="text-primary">{sede.nombre}</strong><br />
                                                    <span className="text-xs text-gray-600">{sede.info}</span>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            )}
                        </div>

                        {/* Formulario */}
                        <div className="bg-card border border-border-card p-8 rounded-2xl">
                            <h3 className="text-2xl font-bold text-foreground font-serif mb-6">Consulta General</h3>
                            <form className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-foreground/40 mb-1 block">Nombre Completo</label>
                                    <input type="text" className="w-full bg-input border border-border-input rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-foreground/40 mb-1 block">Teléfono</label>
                                        <input type="tel" className="w-full bg-input border border-border-input rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-foreground/40 mb-1 block">Email</label>
                                        <input type="email" className="w-full bg-input border border-border-input rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-foreground/40 mb-1 block">Mensaje</label>
                                    <textarea rows={4} className="w-full bg-input border border-border-input rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none transition-all resize-none"></textarea>
                                </div>
                                <button className="w-full py-4 bg-primary text-white font-bold rounded-xl uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                                    Enviar Mensaje
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}