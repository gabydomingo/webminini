"use client";

// ============================================================
//  Operaciones concretadas — parte interactiva
// ============================================================
//  Las propiedades llegan ya resueltas desde page.tsx. Acá solo quedan el
//  ordenamiento y la paginación, que no necesitan volver a la base: se
//  trabaja sobre la lista que ya está en memoria.
//
//  Antes este archivo hacía el fetch con un useEffect, así que había un
//  estado de "cargando" y un spinner. Ya no hacen falta: cuando el HTML
//  llega al navegador, las tarjetas están dibujadas.
// ============================================================

import { useMemo, useState } from "react";
import Header from "../components/Header";
import PropertyCard, { type PropiedadTarjeta } from "../components/PropertyCard";

const PROPERTIES_PER_PAGE = 12;

export type PropiedadConcretada = PropiedadTarjeta & {
    status: string | null;
    created_at: string;
};

// ─── Paginación ───────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    const getPages = (): (number | string)[] => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
        if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const pages = getPages();

    return (
        <nav aria-label="Paginación" className="flex items-center justify-center gap-1.5 mt-12 font-sans pb-10">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-border-card text-foreground/70 hover:border-primary hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {pages.map((page, i) =>
                page === '...' ? (
                    <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-foreground/50 text-sm select-none" aria-hidden="true">
                        ···
                    </span>
                ) : (
                    <button
                        key={`page-${page}`}
                        onClick={() => onPageChange(page as number)}
                        aria-label={`Ir a la página ${page}`}
                        aria-current={page === currentPage ? "page" : undefined}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${page === currentPage
                            ? 'bg-primary text-white shadow-md'
                            : 'text-foreground/70 hover:text-primary hover:bg-input border border-transparent hover:border-border-card'
                            }`}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-border-card text-foreground/70 hover:border-primary hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </nav>
    );
}

// ─── Etiqueta según el estado ─────────────────────────────────────────────────
function etiqueta(status: string | null) {
    if (status === "alquilado") return { texto: "Alquilado", color: "bg-green-700" };
    if (status === "reservado") return { texto: "Reservado", color: "bg-yellow-700" };
    return { texto: "Vendido", color: "bg-[#8B1A1A]" };
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ConcretadasContent({ propiedades }: { propiedades: PropiedadConcretada[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");

    const ordenadas = useMemo(() => {
        const copia = [...propiedades];
        copia.sort((a, b) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            return sortOrder === "oldest" ? ta - tb : tb - ta;
        });
        return copia;
    }, [propiedades, sortOrder]);

    const totalPages = Math.ceil(ordenadas.length / PROPERTIES_PER_PAGE);
    const pagina = ordenadas.slice(
        (currentPage - 1) * PROPERTIES_PER_PAGE,
        currentPage * PROPERTIES_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="bg-background min-h-screen pb-10 pt-32 transition-colors duration-300">
            <Header />

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

                    {propiedades.length > 0 && (
                        <div className="flex items-center justify-center md:justify-end gap-3 shrink-0">
                            <label htmlFor="orden-concretadas" className="text-sm font-semibold text-foreground/70 uppercase tracking-wider hidden sm:inline">
                                Ordenar:
                            </label>
                            <select
                                id="orden-concretadas"
                                aria-label="Ordenar las operaciones"
                                className="bg-card border border-border-card text-foreground/80 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 outline-none font-medium cursor-pointer shadow-sm transition-colors"
                                value={sortOrder}
                                onChange={(e) => {
                                    setSortOrder(e.target.value as "recent" | "oldest");
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="recent">Más recientes primero</option>
                                <option value="oldest">Más antiguas primero</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* ── ESTADO: VACÍO ── */}
                {propiedades.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border-card shadow-sm px-4">
                        <svg className="w-20 h-20 text-foreground/20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h2 className="text-2xl font-bold text-foreground/80 mb-3 font-serif">Aún no hay operaciones registradas</h2>
                        <p className="text-foreground/70 font-sans">A medida que se concreten ventas o alquileres, aparecerán en esta sección.</p>
                    </div>
                ) : (
                    <>
                        <p className="mb-6 font-sans text-sm font-bold text-foreground/70">
                            Mostrando {pagina.length} de {propiedades.length} propiedades
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {pagina.map((p) => {
                                const { texto, color } = etiqueta(p.status);
                                return (
                                    <div key={p.id} className="relative group">
                                        <PropertyCard property={p} />
                                        <div className="absolute top-4 left-4 z-20 pointer-events-none">
                                            <span className={`${color} text-white px-3 py-1 rounded-sm text-xs font-black uppercase tracking-widest shadow-lg transform -rotate-2 inline-block`}>
                                                {texto}
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
        </div>
    );
}
