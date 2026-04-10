"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase"; // Ajustá si la ruta es diferente

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

// ─── Tipos y Utilidades ───────────────────────────────────────────────────────
type VideoFeed = {
    type: "tiktok" | "mp4";
    url: string;
};

// Extrae solo el número de ID de un link de TikTok
function getTikTokId(url: string) {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
}

// ─── Reproductores Individuales (Inteligentes) ──────────────────────────────
function MP4Player({ url, isActive }: { url: string; isActive: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            if (isActive) {
                // El catch ignora advertencias si el navegador bloquea el autoplay por falta de interacción previa
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isActive]);

    return (
        <video
            ref={videoRef}
            src={url}
            loop
            playsInline
            controls={false}
            className="w-full h-full object-cover pointer-events-auto cursor-pointer"
            onClick={(e) => {
                const vid = e.currentTarget;
                if (vid.paused) vid.play();
                else vid.pause();
            }}
        />
    );
}

function TikTokPlayer({ url, isActive }: { url: string; isActive: boolean }) {
    const videoId = getTikTokId(url);

    // Si el video NO está activo, lo desmontamos. Es la única forma 100% segura
    // de evitar que el audio de TikTok siga sonando de fondo.
    if (!isActive || !videoId) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#111]">
                <div className="w-8 h-8 border-4 border-neutral-700 border-t-[#8B1A1A] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <iframe
            src={`https://www.tiktok.com/embed/v2/${videoId}?lang=es-ES`}
            className="w-[102%] h-[102%] border-none pointer-events-auto bg-black"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
            title="TikTok Video"
            scrolling="no"
            style={{ overflow: 'hidden' }}
        />
    );
}

// ─── Phone Mockup con Scroll Inteligente ─────────────────────────────────────
function PhoneMockup({ videos }: { videos: VideoFeed[] }) {
    const [activeIndex, setActiveIndex] = useState(0);

    // Calcula qué video está visible en la pantalla basándose en la posición del scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const newIndex = Math.round(element.scrollTop / element.clientHeight);
        if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
        }
    };

    return (
        <div className="relative flex justify-center items-center transition-transform duration-500 hover:scale-105 z-20 group">

            {/* Botones físicos laterales del celular */}
            <div className="absolute -left-[6px] top-[90px] w-[5px] h-8 bg-neutral-700 rounded-l-md z-10" />
            <div className="absolute -left-[6px] top-[132px] w-[5px] h-14 bg-neutral-700 rounded-l-md z-10" />
            <div className="absolute -left-[6px] top-[200px] w-[5px] h-14 bg-neutral-700 rounded-l-md z-10" />
            <div className="absolute -right-[6px] top-[150px] w-[5px] h-20 bg-neutral-700 rounded-r-md z-10" />

            {/* Chasis del Celular */}
            <div className="relative w-[320px] h-[640px] bg-black rounded-[44px] border-[12px] border-black shadow-[0_30px_80px_rgba(0,0,0,0.55)] ring-[1.5px] ring-white/10 overflow-hidden">

                {/* Dynamic Island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30" />

                {/* ── CONTENEDOR CON SCROLL SNAP ── */}
                <div
                    className="absolute inset-0 rounded-[32px] overflow-y-scroll snap-y snap-mandatory bg-[#111]"
                    onScroll={handleScroll}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .hide-scroll::-webkit-scrollbar { display: none; width: 0; }
                        .hide-scroll { -webkit-overflow-scrolling: touch; }
                    `}} />

                    <div className="h-full hide-scroll">
                        {videos.map((vid, index) => {
                            const isActive = index === activeIndex;

                            return (
                                <div
                                    key={`video-${index}`}
                                    className="w-full h-full snap-center shrink-0 relative flex items-center justify-center bg-black"
                                >
                                    {vid.type === "tiktok" ? (
                                        <TikTokPlayer url={vid.url} isActive={isActive} />
                                    ) : vid.type === "mp4" ? (
                                        <MP4Player url={vid.url} isActive={isActive} />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900">
                                            <p className="text-white/40 text-sm font-medium">Enlace no válido</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Hint animado para deslizar (solo aparece si hay más de 1 video) */}
            {videos.length > 1 && (
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 animate-bounce opacity-0 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none hidden lg:flex">
                    <span className="text-[10px] font-bold text-[#8B1A1A] rotate-[-90deg] whitespace-nowrap mb-6 tracking-widest uppercase">
                        Deslizar
                    </span>
                    <svg className="w-4 h-4 text-[#8B1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            )}
        </div>
    );
}

// ─── Skeleton de Carga ────────────────────────────────────────────────────────
function PhoneSkeleton() {
    return (
        <div className="w-[320px] h-[640px] bg-black rounded-[44px] border-[12px] border-black shadow-[0_30px_80px_rgba(0,0,0,0.4)] ring-[1.5px] ring-white/10 animate-pulse">
            <div className="w-full h-full rounded-[32px] bg-neutral-900 flex items-center justify-center">
                <svg className="w-10 h-10 text-neutral-800 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        </div>
    );
}

// ─── Sección Principal ────────────────────────────────────────────────────────
export default function SocialSection() {
    const [feed, setFeed] = useState<VideoFeed[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const { data } = await supabase.from("site_settings").select("*");

                if (data) {
                    const feedSetting = data.find((s) => s.key === "home_videos_feed");

                    if (feedSetting?.value) {
                        try {
                            const parsed = JSON.parse(feedSetting.value);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                setFeed(parsed);
                                return;
                            }
                        } catch (e) {
                            console.error("Error parseando el JSON de videos", e);
                        }
                    }

                    // Retrocompatibilidad: Si encuentra formato viejo
                    const oldType = data.find((s) => s.key === "home_video_type");
                    const oldUrl = data.find((s) => s.key === "home_video_url");

                    if (oldUrl?.value) {
                        setFeed([{ type: (oldType?.value ?? "tiktok") as "tiktok" | "mp4", url: oldUrl.value }]);
                    }
                }
            } catch (e) {
                console.error("Error cargando la configuración de Supabase:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    return (
        <section className="bg-white py-32 px-6 lg:px-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[#faf7f2] -skew-x-12 translate-x-1/4 opacity-50 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32">

                    <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
                        {loading ? <PhoneSkeleton /> : feed.length === 0 ? (
                            <div className="w-[320px] h-[640px] bg-black rounded-[44px] border-[12px] border-black flex items-center justify-center">
                                <p className="text-white/50 text-sm">Sin videos configurados</p>
                            </div>
                        ) : (
                            <PhoneMockup videos={feed} />
                        )}
                    </div>

                    <div className="flex-1 text-center lg:text-left max-w-xl">
                        <p className="text-[#8B1A1A] text-xs font-semibold uppercase tracking-[0.3em] mb-4">
                            Seguinos en redes
                        </p>

                        <h2
                            className="text-4xl md:text-5xl lg:text-[52px] font-bold text-[#2a1f1a] leading-[1.1] mb-8"
                            style={{ fontFamily: "'Georgia', serif" }}
                        >
                            Manténgase conectado{" "}
                            <br className="hidden md:block" />
                            con lo mejor de la costa.
                        </h2>

                        <p className="text-[#6b5a4e] text-lg leading-relaxed mb-10">
                            Síganos en las redes sociales para disfrutar de visitas exclusivas a
                            propiedades, información destacada, secretos del mercado inmobiliario y
                            una mirada distinta de las mejores propiedades que tenemos para ofrecerte.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="https://www.tiktok.com/@mininipropiedades"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-[#8B1A1A] hover:bg-[#6e1414] text-white font-bold text-sm tracking-widest uppercase rounded transition-all duration-300 shadow-xl hover:-translate-y-1"
                            >
                                <TikTokIcon className="w-5 h-5" />
                                Seguinos en TikTok
                            </Link>

                            <Link
                                href="https://www.instagram.com/mininipropiedades"
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