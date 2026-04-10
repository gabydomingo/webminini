"use client"; // Obligatorio agregar esto al inicio para usar useEffect

import Link from "next/link";
import { useEffect } from "react";

// ─── Íconos ───────────────────────────────────────────────────────────────────
function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
    );
}

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
    );
}

// ─── Phone Mockup con iFrame de TikTok ──────────────
function PhoneMockup() {
    // Usamos useEffect para cargar el script de TikTok
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div className="relative flex justify-center items-center transition-transform duration-500 hover:scale-105 z-20">

            {/* Botones físicos laterales del celular */}
            <div className="absolute -left-1.5 top-24 w-1.5 h-10 bg-gray-800 rounded-l-md"></div>
            <div className="absolute -left-1.5 top-40 w-1.5 h-16 bg-gray-800 rounded-l-md"></div>
            <div className="absolute -right-1.5 top-48 w-1.5 h-20 bg-gray-800 rounded-r-md"></div>

            {/* Chasis del Celular */}
            {/* Cambiamos el fondo a bg-white para que se fusione con la tarjeta de TikTok */}
            <div className="relative w-[325px] h-[650px] border-[12px] border-black rounded-[40px] shadow-2xl overflow-hidden ring-1 ring-gray-800/50 bg-white">

                {/* Dynamic Island (La camarita del iPhone) */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30"></div>

                {/* --- EL EMBED REAL DE TIKTOK --- */}
                {/* Agregamos overflow-y-auto por si la descripción del video es muy larga y necesitan hacer scroll */}
                <div className="absolute inset-0 w-full h-full pt-8 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    <blockquote
                        className="tiktok-embed"
                        cite="https://www.tiktok.com/@minini_propiedades/video/7607494716946484501"
                        data-video-id="7607494716946484501"
                        style={{ maxWidth: '100%', margin: 0, padding: 0 }}
                    >
                        <section>
                            <a target="_blank" title="@minini_propiedades" href="https://www.tiktok.com/@minini_propiedades?refer=embed">@minini_propiedades</a>
                        </section>
                    </blockquote>
                </div>

            </div>
        </div>
    );
}

// ─── Sección Principal ────────────────────────────────────────────────────────
export default function SocialSection() {
    return (
        <section className="bg-white py-32 px-6 lg:px-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[#faf7f2] -skew-x-12 translate-x-1/4 opacity-50 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32">

                    {/* Celular Gigante a la izquierda */}
                    <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
                        <PhoneMockup />
                    </div>

                    {/* Textos y llamadas a la acción */}
                    <div className="flex-1 text-center lg:text-left max-w-xl">
                        <h2
                            className="text-4xl md:text-5xl lg:text-[52px] font-bold text-[#2a1f1a] leading-[1.1] mb-8"
                            style={{ fontFamily: "'Georgia', serif" }}
                        >
                            Manténgase conectado <br className="hidden md:block" />
                            con lo mejor de la costa.
                        </h2>

                        <p className="text-[#6b5a4e] text-lg md:text-xl leading-relaxed mb-10 mx-auto lg:mx-0">
                            Síganos en las redes sociales para disfrutar de visitas exclusivas a propiedades, información destacada, secretos del mercado inmobiliario y una mirada distinta de las mejores propiedades que tenemos para ofrecerte.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="https://www.tiktok.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-[#8B1A1A] hover:bg-[#6e1414] text-white font-bold text-sm tracking-widest uppercase rounded transition-all duration-300 shadow-xl hover:-translate-y-1"
                            >
                                <TikTokIcon className="w-5 h-5" />
                                Seguinos en TikTok
                            </Link>

                            <Link
                                href="https://www.instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-transparent border-2 border-[#8B1A1A] hover:bg-[#8B1A1A] text-[#8B1A1A] hover:text-white font-bold text-sm tracking-widest uppercase rounded transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                            >
                                <InstagramIcon className="w-5 h-5" />
                                Feed de Instagram
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}