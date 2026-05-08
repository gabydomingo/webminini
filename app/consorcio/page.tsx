"use client";

import Header from "../components/Header";
import Link from "next/link";

export default function AdministracionPage() {
    return (
        <div className="bg-background min-h-screen transition-colors duration-300 font-sans">
            <Header />

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">

                {/* ── HERO SECTION ── */}
                <section className="text-center max-w-3xl mx-auto mb-20">
                    <p className="text-sm font-bold uppercase tracking-widest text-primary mb-4 font-sans">
                        Servicios Profesionales
                    </p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground">
                        Administración de Consorcios
                    </h1>
                    <p className="font-sans text-base md:text-lg text-foreground/70 leading-relaxed">
                        Con mas de una decada de experiencia en el Partido de la Costa, ofrecemos una gestión transparente, eficiente y enfocada en revalorizar su patrimonio. Su tranquilidad es nuestro principal objetivo.
                    </p>
                </section>

                {/* ── SERVICIOS (GRILLA) ── */}
                <section className="mb-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Tarjeta 1 */}
                        <div className="bg-card border border-border-card p-8 md:p-10 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold font-serif text-foreground mb-4">Gestión Contable y Administrativa</h3>
                            <p className="text-foreground/70 leading-relaxed">
                                Liquidación de expensas claras y detalladas. Seguimiento riguroso de morosos, pago a proveedores y presentación de balances mensuales para garantizar la total transparencia de los fondos del consorcio.
                            </p>
                        </div>

                        {/* Tarjeta 2 */}
                        <div className="bg-card border border-border-card p-8 md:p-10 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold font-serif text-foreground mb-4">Mantenimiento Edilicio</h3>
                            <p className="text-foreground/70 leading-relaxed">
                                Contamos con un equipo de oficios especializado (plomeros, electricistas, albañiles) para resolver urgencias y planificar el mantenimiento preventivo, asegurando que su edificio no pierda valor.
                            </p>
                        </div>

                        {/* Tarjeta 3 */}
                        <div className="bg-card border border-border-card p-8 md:p-10 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold font-serif text-foreground mb-4">Atención al Copropietario</h3>
                            <p className="text-foreground/70 leading-relaxed">
                                Canales de comunicación ágiles para consultas y reclamos. Convocatoria y mediación en asambleas ordinarias y extraordinarias, fomentando la convivencia armónica.
                            </p>
                        </div>

                        {/* Tarjeta 4 */}
                        <div className="bg-card border border-border-card p-8 md:p-10 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold font-serif text-foreground mb-4">Asesoramiento Legal y Técnico</h3>
                            <p className="text-foreground/70 leading-relaxed">
                                Respaldo constante de estudios jurídicos y contables. Cumplimiento estricto de las normativas vigentes, seguros obligatorios y regulaciones municipales para proteger al consorcio ante cualquier eventualidad.
                            </p>
                        </div>

                    </div>
                </section>

                {/* ── POR QUÉ ELEGIRNOS ── */}
                <section className="bg-input border border-border-card rounded-3xl p-8 md:p-16 mb-16 shadow-sm">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground font-serif mb-8">¿Por qué confiar en nosotros?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <h4 className="font-bold text-lg text-primary">Experiencia</h4>
                                <p className="text-sm text-foreground/70 leading-relaxed">Más de una década administrando consorcios con el legado y la seriedad que nos caracteriza.</p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-bold text-lg text-primary">Transparencia</h4>
                                <p className="text-sm text-foreground/70 leading-relaxed">Sin grises. Usted sabrá exactamente a dónde va destinado cada peso de sus expensas.</p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-bold text-lg text-primary">Respuesta Rápida</h4>
                                <p className="text-sm text-foreground/70 leading-relaxed">Oficinas céntricas en San Bernardo y atención personalizada para urgencias fuera de horario.</p>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-border-card">
                            <p className="text-foreground/80 mb-6 font-medium">¿Desea solicitar un presupuesto para su edificio?</p>
                            <Link
                                href="/contacto"
                                className="inline-flex items-center gap-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-md"
                            >
                                Contáctenos
                            </Link>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}