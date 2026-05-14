"use client";

import Header from "../components/Header";
import Link from "next/link";
import Image from "next/image";

// ─── LISTA DE EDIFICIOS ──────────────────────────────────────────────────────
const EDIFICIOS = [
    { nombre: "AMERICA XII", direccion: "Mitre N°4315", imagen: null },
    { nombre: "AMERICA XIII", direccion: "Entre Rios N° 368 MDA", imagen: null },
    { nombre: "AVENIDA II", direccion: "San Juan N°2818 San Bernardo", imagen: null },
    { nombre: "BELGRANO", direccion: "Hipolito Yrigoyen N° 71 MDA", imagen: null },
    { nombre: "BILAMAR", direccion: "Carreras N° 270 - MDA", imagen: null },
    { nombre: "CAREDO", direccion: "Santiago del Estero N° 2381", imagen: null },
    { nombre: "CASAMAR I", direccion: "Chiozza N° 2153 San Bernardo", imagen: null },
    { nombre: "COMPLEJO EL JARDIN", direccion: "Mendoza N° 4935 La Lucila", imagen: null },
    { nombre: "COPACABANA II", direccion: "Chiozza N°1853 San Bernardo", imagen: null },
    { nombre: "COSTAMAR", direccion: "Costanera N° 1984 San Bernardo", imagen: null },
    { nombre: "DORINA I", direccion: "Costanera N° 5000 La Lucila", imagen: null },
    { nombre: "ESELLI I", direccion: "Irigoyen N° 218 Playa Grande", imagen: null },
    { nombre: "EUROPA II", direccion: "Costanera N° 4910 La Lucila", imagen: null },
    { nombre: "EUROPA IV", direccion: "Costanera N° 5446 La Lucila", imagen: null },
    { nombre: "FLORIMAR I", direccion: "San Juan N°4755 La Lucila", imagen: null },
    { nombre: "FRENTE AL MAR II", direccion: "Costanera N°3370", imagen: null },
    { nombre: "GALO I", direccion: "J. V. Gonzalez N° 676", imagen: null },
    { nombre: "H. YRIGOYEN", direccion: "Hipolito Yrigoyen N°489 MDA", imagen: null },
    { nombre: "HERNANDARIAS I", direccion: "Hernandarias N°125/29", imagen: null },
    { nombre: "HUGOLITO III", direccion: "Mitre N°2530", imagen: null },
    { nombre: "JANO I", direccion: "San Juan N° 2035", imagen: null },
    { nombre: "JANO II", direccion: "Zuviría N° 137", imagen: null },
    { nombre: "JANO III", direccion: "Av. Costanera y Entre Rios", imagen: null },
    { nombre: "LAKONICH", direccion: "Chiozza N°2551 SB", imagen: null },
    { nombre: "LUCIMAR", direccion: "Costanera N°5150", imagen: null },
    { nombre: "MARE II", direccion: "San Juan N°2985", imagen: null },
    { nombre: "MENSAJERIAS 110", direccion: "Mensajerias N° 110 San Bernardo", imagen: null },
    { nombre: "MERIDIANO XVIII", direccion: "Santa Maria de Oro N° 144 SB", imagen: null },
    { nombre: "MINADA IV Y V", direccion: "Mendoza N° 4040 - Costa Azul", imagen: null },
    { nombre: "MONACO", direccion: "Av. Calle 32 N° 664 Santa Teresita", imagen: null },
    { nombre: "NECO II", direccion: "Costanera N° 1860", imagen: null },
    { nombre: "NIKIVA", direccion: "San Juan N° 1568", imagen: null },
    { nombre: "OLIVIA XIII", direccion: "Tucuman N° 1723 San Bernardo", imagen: null },
    { nombre: "OLIVIA XIV", direccion: "Libres del Sur N°55 MDA", imagen: null },
    { nombre: "ONDINA I", direccion: "Querini N° 68", imagen: null },
    { nombre: "PINAR I", direccion: "Av. San Bernardo N° 400 y Catamarca", imagen: null },
    { nombre: "PRINCIPADO", direccion: "Chiozza N° 2658", imagen: null },
    { nombre: "RABA I", direccion: "Costanera Nº2260", imagen: null },
    { nombre: "ROSIBEL", direccion: "Esquiu N° 162", imagen: null },
    { nombre: "SAN RAFAEL I", direccion: "Mensajerias N° 136", imagen: null },
    { nombre: "SAN FRANCISCO III", direccion: "Mitre N°2785", imagen: null },
    { nombre: "SABATINO III", direccion: "J. V. Gonzalez N° 15", imagen: null },
    { nombre: "SEA GULL", direccion: "Costanera N° 4347 Costa Azul", imagen: null },
    { nombre: "TUYU III", direccion: "Costanera N° 2465 San Clemente", imagen: null },
    { nombre: "ZARA I", direccion: "Mitre N°3749 Costa Azul", imagen: null },
];

// Dividimos los edificios en dos filas para el carrusel doble
const mitad = Math.ceil(EDIFICIOS.length / 2);
const FILA_1 = EDIFICIOS.slice(0, mitad);
const FILA_2 = EDIFICIOS.slice(mitad);

export default function AdministracionPage() {
    return (
        <div className="bg-background min-h-screen transition-colors duration-300 font-sans overflow-x-hidden">
            <Header />

            {/* Estilos para la animación infinita */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-50% - 12px)); } /* 12px es la mitad del gap */
                }
                .animate-marquee {
                    animation: marquee 50s linear infinite;
                }
                .animate-marquee-reverse {
                    animation: marquee 55s linear infinite reverse;
                }
                /* Pausar al pasar el mouse */
                .marquee-container:hover .animate-marquee,
                .marquee-container:hover .animate-marquee-reverse {
                    animation-play-state: paused;
                }
            `}} />

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">

                {/* ── HERO SECTION ── */}
                <section className="text-center max-w-3xl mx-auto mb-20">
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary mb-4 font-sans">
                        Desde 2002 brindando confianza
                    </p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground italic">
                        Administración de Edificios
                    </h1>
                    <p className="font-sans text-base md:text-lg text-foreground/70 leading-relaxed">
                        Contamos con más de dos décadas de trayectoria ininterrumpida en el Partido de La Costa. 
                        Nuestra gestión combina transparencia administrativa, respuesta técnica inmediata y atención personalizada.
                    </p>
                </section>

                {/* ── SERVICIOS (GRILLA) ── */}
                <section className="mb-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ServiceCard 
                            icon={<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                            title="Expensas Claras"
                            desc="Liquidaciones detalladas enviadas por email y disponibles online 24/7."
                        />
                        <ServiceCard 
                            icon={<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
                            title="Mantenimiento"
                            desc="Equipo propio de especialistas para reparaciones eléctricas, plomería y más."
                        />
                        <ServiceCard 
                            icon={<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                            title="Asambleas"
                            desc="Coordinación profesional de reuniones para una convivencia armónica."
                        />
                        <ServiceCard 
                            icon={<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
                            title="Legal y Contable"
                            desc="Asesoramiento permanente para el cumplimiento de normativas vigentes."
                        />
                    </div>
                </section>

                {/* ── SECCIÓN EDIFICIOS ADMINISTRADOS (CARRUSEL AUTOMÁTICO FULL WIDTH) ── */}
                <section className="mb-32 relative w-screen ml-[calc(50%-50vw)] overflow-hidden py-4">
                    
                    {/* El encabezado mantiene los márgenes del resto de la página */}
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
                        <div>
                            <h2 className="font-serif text-3xl md:text-4xl font-black text-foreground">Consorcios que confían</h2>
                            <p className="text-foreground/60 mt-2">Más de 40 edificios bajo nuestra gestión integral en La Costa.</p>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full whitespace-nowrap">
                            San Bernardo • Mar de Ajó • La Lucila
                        </span>
                    </div>

                    {/* Contenedor del Carrusel Animado */}
                    <div className="marquee-container flex flex-col gap-6 w-full">
                        
                        {/* Fila 1 (Izquierda a Derecha) */}
                        <div className="flex w-max animate-marquee gap-6">
                            {[...FILA_1, ...FILA_1].map((edificio, idx) => (
                                <EdificioCard key={`f1-${idx}`} edificio={edificio} />
                            ))}
                        </div>

                        {/* Fila 2 (Derecha a Izquierda) */}
                        <div className="flex w-max animate-marquee-reverse gap-6">
                            {[...FILA_2, ...FILA_2].map((edificio, idx) => (
                                <EdificioCard key={`f2-${idx}`} edificio={edificio} />
                            ))}
                        </div>

                    </div>
                </section>

                {/* ── POR QUÉ ELEGIRNOS ── */}
                <section className="bg-card border border-border-card rounded-3xl p-8 md:p-16 mb-16 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground font-serif mb-8 italic">¿Por qué confiar en nosotros?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            <div className="space-y-3 p-6 bg-input/50 rounded-2xl border border-border-card">
                                <h4 className="font-bold text-lg text-primary">Experiencia</h4>
                                <p className="text-sm text-foreground/70 leading-relaxed">Administrando edificios desde 2002 con el legado y la seriedad que nos caracteriza en el mercado local.</p>
                            </div>
                            <div className="space-y-3 p-6 bg-input/50 rounded-2xl border border-border-card">
                                <h4 className="font-bold text-lg text-primary">Transparencia</h4>
                                <p className="text-sm text-foreground/70 leading-relaxed">Sin grises. Usted sabrá exactamente a dónde va destinado cada peso de sus expensas mediante rendiciones mensuales.</p>
                            </div>
                            <div className="space-y-3 p-6 bg-input/50 rounded-2xl border border-border-card">
                                <h4 className="font-bold text-lg text-primary">Respuesta</h4>
                                <p className="text-sm text-foreground/70 leading-relaxed">Atención personalizada para urgencias fuera de horario y oficinas físicas céntricas en San Bernardo.</p>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-border-card">
                            <p className="text-foreground/80 mb-6 font-medium">¿Su edificio necesita una administración ágil y tecnológica?</p>
                            <Link
                                href="/contacto"
                                className="inline-flex items-center gap-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm tracking-widest uppercase px-10 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                            >
                                Solicitar Presupuesto
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </Link>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}

// ─── SUB-COMPONENTE: SERVICE CARD ───────────────────────────────────────────
function ServiceCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-card border border-border-card p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full border-b-4 border-b-primary/20 hover:border-b-primary transition-all duration-300">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    {icon}
                </svg>
            </div>
            <h3 className="text-xl font-bold font-serif text-foreground mb-3">{title}</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">{desc}</p>
        </div>
    );
}

// ─── SUB-COMPONENTE: EDIFICIO CARD ──────────────────────────────────────────
function EdificioCard({ edificio }: { edificio: { nombre: string, direccion: string, imagen: string | null } }) {
    return (
        <div className="min-w-[280px] h-[90px] bg-card border border-border-card rounded-xl p-4 flex items-center justify-between gap-4 shrink-0 shadow-sm hover:border-primary transition-colors cursor-default">
            <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-foreground truncate">{edificio.nombre}</h4>
                <p className="text-xs text-foreground/50 mt-1 truncate flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{edificio.direccion}</span>
                </p>
            </div>
            
            {edificio.imagen && (
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative bg-input">
                    <Image 
                        src={edificio.imagen} 
                        fill 
                        className="object-cover" 
                        alt={edificio.nombre}
                    />
                </div>
            )}
        </div>
    );
}