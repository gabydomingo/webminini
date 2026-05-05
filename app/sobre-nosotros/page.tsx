"use client";

import Image from "next/image";
import Header from "../components/Header";


const socios = [
    {
        nombre: "Román Minini",
        rol: "Fundador & Director",
        descripcion:
            "Fundador de Minini Administración de Propiedades, con décadas de experiencia en el mercado inmobiliario del Partido de la Costa.",
        imagen: null,
    },
    {
        nombre: "Juan Minini",
        rol: "Martillero y Corredor Público",
        descripcion:
            "Aporta visión joven y compromiso familiar a cada operación.",
        imagen: null,
    },
    {
        nombre: "Franco Mauri",
        rol: "Especialista en Ventas",
        descripcion:
            "Estudiante avanzado de martillero y corredor público, aporta su conocimiento en la gestión y asesoramiento de propiedades, con fuerte orientación al cliente y conocimiento del mercado local.",
        imagen: null,
    },
];

const valores = [
    {
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        titulo: "Transparencia",
        texto: "Sin grises ni claroscuros: garantía absoluta de que su dinero se encuentra a buen resguardo.",
    },
    {
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
        ),
        titulo: "Innovación",
        texto: "Agilidad y mejora constante para que encontrar tu propiedad sea una experiencia moderna y eficiente.",
    },
    {
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
        titulo: "Confianza",
        texto: "Más de una década respaldando operaciones exitosas y construyendo vínculos duraderos con cada familia.",
    },
];

export default function SobreNosotros() {
    return (
        <div className="bg-background min-h-screen transition-colors duration-300">
            <Header />

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">

                {/* ── HERO ── */}
                <section className="text-center max-w-3xl mx-auto mb-16">
                    <p className="text-sm font-sans uppercase tracking-widest text-primary mb-4 font-bold">
                        Quiénes somos
                    </p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground">
                        Nuestra Pasión es Tu Hogar
                    </h1>
                    <p className="font-sans text-base md:text-lg text-foreground/70 leading-relaxed">
                        En 2020 cumplimos una década acompañando a nuestros clientes en sus negocios
                        inmobiliarios: administramos, asesoramos, solucionamos y mejoramos. Estuvimos presentes
                        cuando compraron su primera propiedad y los acompañamos durante sus vacaciones de verano
                        y en el día a día en los edificios.
                    </p>
                </section>

                {/* ── DIVISOR ── */}
                <div className="max-w-xs mx-auto mb-16 flex items-center gap-4 px-6 opacity-60">
                    <div className="h-px flex-1 bg-primary/40" />
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="h-px flex-1 bg-primary/40" />
                </div>

                {/* ── SOCIOS FUNDADORES ── */}
                <section className="mb-20 max-w-5xl mx-auto">
                    <h2 className="font-serif text-3xl md:text-4xl font-black text-center mb-12 text-foreground">
                        Nuestros Socios
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {socios.map((socio) => (
                            <div
                                key={socio.nombre}
                                className="rounded-xl overflow-hidden border border-border-card bg-card shadow-sm hover:shadow-md transition-shadow duration-300"
                            >
                                {/* Foto */}
                                <div className="aspect-[4/3] bg-input flex items-center justify-center relative overflow-hidden border-b border-border-card">
                                    {socio.imagen ? (
                                        <Image
                                            src={socio.imagen}
                                            alt={`Foto de ${socio.nombre}`}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-foreground/20">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-16 h-16">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                            <span className="font-sans text-xs font-bold uppercase tracking-wider">Foto pendiente</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-6">
                                    <h3 className="font-serif text-xl font-black text-foreground">{socio.nombre}</h3>
                                    <p className="font-sans text-xs font-bold uppercase tracking-wider text-primary mb-3 mt-1">{socio.rol}</p>
                                    <p className="font-sans text-sm text-foreground/70 leading-relaxed">
                                        {socio.descripcion}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── EL EQUIPO ── */}
                <section className="bg-card border border-border-card rounded-3xl p-8 md:p-12 mb-20 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                        {/* Texto */}
                        <div>
                            <h2 className="font-serif text-3xl md:text-4xl font-black mb-6 text-foreground">El Equipo Minini</h2>
                            <div className="space-y-4 font-sans text-sm md:text-base text-foreground/80 leading-relaxed">
                                <p>
                                    Minini Administración de Propiedades comenzó con Román Minini y el legado de León
                                    Estrugo, reconocido administrador histórico del partido. Hoy lo acompañan su hijo
                                    Juan Minini, Oscar Saint Martin a cargo del procesamiento de datos; Marcela Giménez
                                    como secretaria administrativa y asesora inmobiliaria, y Belén Sansone como
                                    responsable de la carga de datos.
                                </p>
                                <p>
                                    Además, contamos con un grupo de especialistas en las distintas áreas de la
                                    construcción y la administración —ingenieros, agrimensores, arquitectos, técnicos,
                                    albañiles, electricistas, plomeros, pintores, cerrajeros— y nos asesoran
                                    permanentemente estudios impositivos-contables y legales.
                                </p>
                                <p className="font-bold text-foreground">
                                    Porque conocemos y disfrutamos de nuestra ciudad, trabajamos para verla crecer y
                                    mejorar.
                                </p>
                            </div>
                        </div>

                        {/* Foto equipo */}
                        <div className="rounded-xl overflow-hidden shadow-sm aspect-[16/10] bg-input border border-border-card flex items-center justify-center relative">
                            {/* <Image src="/equipo.jpg" alt="Equipo Minini" fill className="object-cover" /> */}
                            <div className="flex flex-col items-center gap-3 text-foreground/20">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-16 h-16">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                <span className="font-sans text-xs font-bold uppercase tracking-wider">Foto grupal pendiente</span>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ── MISIÓN Y VISIÓN ── */}
                <section className="mb-20 max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        <div className="relative border border-border-card rounded-2xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow">
                            <span className="absolute -top-4 left-8 bg-primary text-white font-sans text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                                Misión
                            </span>
                            <p className="font-sans text-sm md:text-base text-foreground/80 leading-relaxed mt-2">
                                Aportar a la calidad de vida en el Partido de la Costa ofreciendo servicios
                                inmobiliarios que transformen cada propiedad mientras acompañamos a nuestros clientes
                                en sus inversiones.
                            </p>
                        </div>

                        <div className="relative border border-border-card rounded-2xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow">
                            <span className="absolute -top-4 left-8 bg-foreground text-background font-sans text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                                Visión
                            </span>
                            <p className="font-sans text-sm md:text-base text-foreground/80 leading-relaxed mt-2">
                                Ser un equipo de trabajo referente en el Partido de la Costa por la agilidad, mejora
                                constante y su transparencia en nuestro servicio.
                            </p>
                        </div>

                    </div>
                </section>

                {/* ── VALORES ── */}
                <section className="bg-card border border-border-card rounded-3xl py-16 px-6 mb-20 shadow-sm">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="font-serif text-3xl md:text-4xl font-black text-center mb-12 text-foreground">
                            Nuestros Valores
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                            {valores.map((v) => (
                                <div key={v.titulo} className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        {v.icono}
                                    </div>
                                    <h3 className="font-serif text-xl font-black text-foreground">{v.titulo}</h3>
                                    <p className="font-sans text-sm text-foreground/70 leading-relaxed max-w-xs">
                                        {v.texto}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA FINAL ── */}
                <section className="text-center max-w-2xl mx-auto bg-primary text-white p-10 md:p-12 rounded-3xl shadow-xl shadow-primary/20">
                    <h2 className="font-serif text-3xl md:text-4xl font-black mb-4">
                        ¿Listo para dar el siguiente paso?
                    </h2>
                    <p className="font-sans text-base text-white/90 mb-8 leading-relaxed">
                        Tenemos un grupo de especialistas listo para atender sus necesidades. Nuestra meta es que
                        año a año sus ladrillos valgan cada vez más.
                    </p>
                    <a
                        href="/contacto"
                        className="inline-flex items-center gap-3 bg-white text-primary hover:bg-gray-100 font-sans font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-md"
                    >
                        Contactar al equipo
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                    </a>
                </section>

            </main>
        </div>
    );
}