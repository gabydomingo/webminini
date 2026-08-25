"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "../lib/supabase"; 
import Header from "../components/Header";
import PropertyCard from "../components/PropertyCard";
import { Property } from "../types";


// ─── Paginación ───────────────────────────────────────────────────────────────
const PROPERTIES_PER_PAGE = 12;

function Pagination({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
        if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const pages = getPages();

    return (
        <div className="flex items-center justify-center gap-1.5 mt-12 font-sans pb-10">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-border-card text-foreground/40 hover:border-primary hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {pages.map((page, i) =>
                page === '...' ? (
                    <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-foreground/30 text-sm select-none">
                        ···
                    </span>
                ) : (
                    <button
                        key={`page-${page}`}
                        onClick={() => onPageChange(page as number)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${page === currentPage
                            ? 'bg-primary text-white shadow-md'
                            : 'text-foreground/60 hover:text-primary hover:bg-input border border-transparent hover:border-border-card'
                            }`}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-border-card text-foreground/40 hover:border-primary hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}

// ─── Componente de Contenido ──────────────────────────────────────────────────
function SoldPropertiesContent() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState('recent'); // 'recent', 'oldest'

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            
            const { data: propData, error } = await supabase
                .from('properties')
                .select('*')
                .in('status', ['vendido', 'alquilado', 'reservado']) 
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error cargando operaciones concretadas:", error);
            } else if (propData) {
                setProperties(propData);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    // Aplicar ordenamiento
    let sortedProperties = [...properties];
    if (sortOrder === 'oldest') {
        sortedProperties.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
        sortedProperties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const totalPages = Math.ceil(sortedProperties.length / PROPERTIES_PER_PAGE);
    const paginatedProperties = sortedProperties.slice(
        (currentPage - 1) * PROPERTIES_PER_PAGE,
        currentPage * PROPERTIES_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            
            {/* ── ENCABEZADO Y CONTROLES ── */}
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-card pb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground font-serif mb-4">
                        Operaciones Concretadas
                    </h1>
                    <p className="text-foreground/70 font-sans max-w-2xl text-base md:text-lg">
                        Conocé algunas de las propiedades que ya encontraron a sus nuevos dueños gracias a nuestra gestión y compromiso.
                    </p>
                </div>

                {!loading && properties.length > 0 && (
                    <div className="flex items-center justify-center md:justify-end gap-3 shrink-0">
                        <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider hidden sm:inline">Ordenar:</span>
                        <select
                            className="bg-card border border-border-card text-foreground/80 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 outline-none font-medium cursor-pointer shadow-sm transition-colors"
                            value={sortOrder}
                            onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="recent">Más recientes primero</option>
                            <option value="oldest">Más antiguas primero</option>
                        </select>
                    </div>
                )}
            </div>

            {/* ── ESTADO: CARGANDO ── */}
            {loading && (
                <div className="py-32 flex justify-center">
                    <div className="w-12 h-12 border-4 border-input border-t-primary rounded-full animate-spin"></div>
                </div>
            )}

            {/* ── ESTADO: VACÍO ── */}
            {!loading && properties.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border-card shadow-sm px-4">
                    <svg className="w-20 h-20 text-foreground/10 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    <h3 className="text-2xl font-bold text-foreground/80 mb-3 font-serif">Aún no hay operaciones registradas</h3>
                    <p className="text-foreground/50 font-sans">A medida que se concreten ventas o alquileres, aparecerán en esta sección.</p>
                </div>
            )}

            {/* ── GRILLA DE RESULTADOS ── */}
            {!loading && properties.length > 0 && (
                <>
                    {/* Badge contador */}
                    <div className="mb-6 font-sans text-sm font-bold text-foreground/50">
                        Mostrando {paginatedProperties.length} de {properties.length} propiedades
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedProperties.map(p => {
                            // 👇 LÓGICA DE ETIQUETAS Y COLORES 👇
                            let labelText = "Vendido";
                            let bgColor = "bg-[#8B1A1A]"; // Rojo por defecto (Vendido)

                            if (p.status === "alquilado") {
                                labelText = "Alquilado";
                                bgColor = "bg-green-700"; // Verde para Alquilado
                            } else if (p.status === "reservado") {
                                labelText = "Reservado";
                                bgColor = "bg-yellow-600"; // Amarillo oscuro para Reservado
                            }

                            return (
                                <div key={p.id} className="relative group">
                                    <PropertyCard property={p} />
                                    
                                    {/* Overlay Visual Dinámico */}
                                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                                        <span className={`${bgColor} text-white px-3 py-1 rounded-sm text-xs font-black uppercase tracking-widest shadow-lg transform -rotate-2 inline-block`}>
                                            {labelText}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
}

// ─── Página Principal (Export Default) ─────────────────────────────────────────
export default function ConcretadasContent() {
    return (
        <div className="bg-background min-h-screen pb-10 pt-32 transition-colors duration-300">
            <Header />
            <Suspense fallback={
                <div className="py-32 flex justify-center">
                    <div className="w-12 h-12 border-4 border-input border-t-primary rounded-full animate-spin"></div>
                </div>
            }>
                <SoldPropertiesContent />
            </Suspense>
        </div>
    );
}