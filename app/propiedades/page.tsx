"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import PropertyCard from "../components/PropertyCard"; // ¡Lo importamos!
import { Property } from "../types";
import { useSearchParams } from "next/navigation";

// ─── Paginación ───────────────────────────────────────────────────────────────
const PROPERTIES_PER_PAGE = 9;

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
        <div className="flex items-center justify-center gap-1.5 mt-10 font-sans">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-card text-foreground/40 hover:border-primary hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {pages.map((page, i) =>
                page === '...' ? (
                    <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-foreground/30 text-sm select-none">
                        ···
                    </span>
                ) : (
                    <button
                        key={`page-${page}`}
                        onClick={() => onPageChange(page as number)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${page === currentPage
                            ? 'bg-primary text-white'
                            : 'text-foreground/50 hover:text-primary hover:bg-input'
                            }`}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-card text-foreground/40 hover:border-primary hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function PropiedadesPage() {
    const searchParams = useSearchParams();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState<Record<string, string[]>>({});

    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || '');
    const [opType, setOpType] = useState(searchParams.get("operacion") || '');
    const [propType, setPropType] = useState(searchParams.get("propiedad") || '');
    const [loc, setLoc] = useState(searchParams.get("localidad") || '');
    const [ambientesSelected, setAmbientesSelected] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const [sortOrder, setSortOrder] = useState('recent');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            const { data: optionsData } = await supabase.from('form_options').select('*');
            if (optionsData) {
                const grouped = optionsData.reduce((acc, curr) => {
                    if (!acc[curr.category]) acc[curr.category] = [];
                    acc[curr.category].push(curr.value);
                    return acc;
                }, {} as Record<string, string[]>);
                setOptions(grouped);

                if (!searchParams.get("operacion") && grouped['tipo_operacion'] && grouped['tipo_operacion'].length > 0) {
                    setOpType(grouped['tipo_operacion'][0]);
                }
            }

            const { data: propData } = await supabase
                .from('properties')
                .select('*')
                .eq('status', 'disponible')
                .order('created_at', { ascending: false });

            if (propData) setProperties(propData);
            setLoading(false);
        };
        loadData();
    }, [searchParams]);

    const handleAmbienteToggle = (amb: string) => {
        setAmbientesSelected(prev =>
            prev.includes(amb) ? prev.filter(a => a !== amb) : [...prev, amb]
        );
        resetPage();
    };

    const resetPage = () => setCurrentPage(1);

    let filteredProperties = properties.filter(p => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const searchableText = `
        ${p.title || ''} 
        ${p.description || ''} 
        ${p.localidad || ''} 
        ${p.location || ''} 
        ${p.property_type || ''} 
        ${p.operation_type || ''}
        ${p.features ? (Array.isArray(p.features) ? p.features.join(' ') : p.features) : ''}
      `.toLowerCase();
            if (!searchableText.includes(query)) return false;
        }

        if (opType && !p.operation_type?.toLowerCase().includes(opType.toLowerCase().trim())) return false;
        if (propType && p.property_type !== propType) return false;
        if (loc && p.localidad !== loc) return false;

        if (ambientesSelected.length > 0) {
            const matchesAmbiente = ambientesSelected.some(amb => {
                if (amb === '1' && p.environments === 1) return true;
                if (amb === '2' && p.environments === 2) return true;
                if (amb === '3' && p.environments === 3) return true;
                if (amb === '4+' && p.environments >= 4) return true;
                return false;
            });
            if (!matchesAmbiente) return false;
        }

        if (minPrice && p.price && p.price < Number(minPrice)) return false;
        if (maxPrice && p.price && p.price > Number(maxPrice)) return false;

        return true;
    });

    if (sortOrder === 'price_asc') {
        filteredProperties.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOrder === 'price_desc') {
        filteredProperties.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
        filteredProperties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const totalPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE);
    const paginatedProperties = filteredProperties.slice(
        (currentPage - 1) * PROPERTIES_PER_PAGE,
        currentPage * PROPERTIES_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="bg-background min-h-screen pb-20 pt-28 transition-colors duration-300">
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-8">

                {/* ── SIDEBAR FILTROS ── */}
                <aside className="w-full lg:w-[320px] shrink-0">
                    {/* USAMOS LAS VARIABLES CSS bg-card y border-border-card */}
                    <div className="bg-card rounded-xl shadow-sm border border-border-card p-6 sticky top-24 font-sans transition-colors duration-300">

                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-card">
                            <h3 className="font-bold text-foreground font-serif text-xl">
                                Filtros
                            </h3>
                            {(searchQuery || ambientesSelected.length > 0 || minPrice || maxPrice || propType || loc || opType !== '') && (
                                <button
                                    onClick={() => { setSearchQuery(''); setAmbientesSelected([]); setMinPrice(''); setMaxPrice(''); setPropType(''); setLoc(''); setOpType(''); resetPage(); }}
                                    className="text-xs text-primary hover:underline font-bold"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        <div className="space-y-8">

                            {/* 0. Buscador Global */}
                            <div>
                                <h4 className="font-bold text-sm text-foreground/80 mb-3 uppercase tracking-wider">Buscar</h4>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Ej: Depto con cochera..."
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
                                        // USAMOS bg-input y border-border-input
                                        className="w-full pl-10 pr-4 py-3 bg-input border border-border-input text-foreground font-medium rounded-lg outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            {/* 1. Operación */}
                            <div>
                                <h4 className="font-bold text-sm text-foreground/80 mb-3 uppercase tracking-wider">Operación</h4>
                                <div className="flex flex-wrap gap-2">
                                    {options.tipo_operacion?.map((op, idx) => (
                                        <button
                                            key={`op-${idx}`}
                                            className={`flex-1 min-w-[30%] py-2 px-2 rounded-md font-bold text-sm transition-all duration-200 text-center ${opType === op ? 'bg-primary text-white shadow-sm' : 'bg-input text-foreground/70 hover:bg-input/80'}`}
                                            onClick={() => { setOpType(op); resetPage(); }}
                                        >
                                            {op}
                                        </button>
                                    ))}
                                    <button
                                        className={`flex-1 min-w-[30%] py-2 px-2 rounded-md font-bold text-sm transition-all duration-200 text-center ${opType === '' ? 'bg-foreground text-background shadow-sm' : 'bg-input text-foreground/70 hover:bg-input/80'}`}
                                        onClick={() => { setOpType(''); resetPage(); }}
                                    >
                                        Todas
                                    </button>
                                </div>
                            </div>

                            {/* 2. Tipo de Propiedad */}
                            <div>
                                <h4 className="font-bold text-sm text-foreground/80 mb-3 uppercase tracking-wider">Tipo de Propiedad</h4>
                                <div className="relative">
                                    <select
                                        className="w-full bg-input border border-border-input text-foreground font-medium py-3 px-4 rounded-lg appearance-none outline-none focus:border-primary transition-colors"
                                        value={propType}
                                        onChange={e => { setPropType(e.target.value); resetPage(); }}
                                    >
                                        <option value="">Cualquier tipo</option>
                                        {options.tipo_propiedad?.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Ubicación */}
                            <div>
                                <h4 className="font-bold text-sm text-foreground/80 mb-3 uppercase tracking-wider">Localidad</h4>
                                <div className="relative">
                                    <select
                                        className="w-full bg-input border border-border-input text-foreground font-medium py-3 px-4 rounded-lg appearance-none outline-none focus:border-primary transition-colors"
                                        value={loc}
                                        onChange={e => { setLoc(e.target.value); resetPage(); }}
                                    >
                                        <option value="">Todas las localidades</option>
                                        {options.localidad?.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Ambientes */}
                            <div>
                                <h4 className="font-bold text-sm text-foreground/80 mb-3 uppercase tracking-wider">Ambientes</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {['1', '2', '3', '4+'].map((amb, idx) => {
                                        const isSelected = ambientesSelected.includes(amb);
                                        return (
                                            <button
                                                key={`amb-${idx}`}
                                                onClick={() => handleAmbienteToggle(amb)}
                                                className={`py-2 px-1 text-center font-bold text-sm rounded-lg border transition-all duration-200 ${isSelected
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-card border-border-card text-foreground/60 hover:bg-input'
                                                    }`}
                                            >
                                                {amb}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* 5. Precio */}
                            <div>
                                <h4 className="font-bold text-sm text-foreground/80 mb-3 uppercase tracking-wider">Precio (U$S)</h4>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 font-medium">$</span>
                                        <input
                                            type="number"
                                            placeholder="Mínimo"
                                            value={minPrice}
                                            onChange={e => { setMinPrice(e.target.value); resetPage(); }}
                                            className="w-full pl-7 pr-2 py-2.5 bg-input border border-border-input rounded-lg focus:border-primary outline-none text-sm font-medium transition-colors text-foreground"
                                        />
                                    </div>
                                    <span className="text-foreground/30 font-bold">-</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 font-medium">$</span>
                                        <input
                                            type="number"
                                            placeholder="Máximo"
                                            value={maxPrice}
                                            onChange={e => { setMaxPrice(e.target.value); resetPage(); }}
                                            className="w-full pl-7 pr-2 py-2.5 bg-input border border-border-input rounded-lg focus:border-primary outline-none text-sm font-medium transition-colors text-foreground"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </aside>

                {/* ── GRILLA DE PROPIEDADES ── */}
                <div className="flex-1 flex flex-col min-h-[600px] font-sans">
                    <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-border-card pb-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-serif">
                            {loading ? "Buscando..." : `${filteredProperties.length} Propiedades`}
                        </h2>

                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider hidden sm:inline">Ordenar por:</span>
                            <select
                                className="bg-card border border-border-card text-foreground/80 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none font-medium cursor-pointer shadow-sm w-full sm:w-auto transition-colors"
                                value={sortOrder}
                                onChange={(e) => { setSortOrder(e.target.value); resetPage(); }}
                            >
                                <option value="recent">Más recientes</option>
                                <option value="price_asc">Menor precio</option>
                                <option value="price_desc">Mayor precio</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 flex justify-center flex-1">
                            <div className="w-10 h-10 border-4 border-border-card border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : filteredProperties.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center bg-card rounded-xl border border-border-card shadow-sm px-4 flex-1">
                            <svg className="w-16 h-16 text-foreground/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <h3 className="text-xl font-bold text-foreground/80 mb-2">No encontramos coincidencias</h3>
                            <p className="text-foreground/50">Probá ajustando los filtros de la izquierda.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-1 content-start">
                                {paginatedProperties.map(p => (
                                    <PropertyCard key={p.id} property={p} />
                                ))}
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
        </div>
    );
}