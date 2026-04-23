"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase"; // Recordá verificar que esta ruta esté bien

export default function SearchBar() {
    const router = useRouter();

    // Estados de búsqueda
    const [keyword, setKeyword] = useState("");
    const [operation, setOperation] = useState("");
    const [type, setType] = useState("");
    const [location, setLocation] = useState("");

    // Estado para guardar las opciones que vienen de la Base de Datos
    const [options, setOptions] = useState<Record<string, string[]>>({});

    // Cargar las opciones dinámicas al montar el componente
    useEffect(() => {
        const loadOptions = async () => {
            const { data } = await supabase.from('form_options').select('*');
            if (data) {
                const grouped = data.reduce((acc, curr) => {
                    if (!acc[curr.category]) acc[curr.category] = [];
                    acc[curr.category].push(curr.value);
                    return acc;
                }, {} as Record<string, string[]>);
                setOptions(grouped);
            }
        };
        loadOptions();
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();

        // Cargar los parámetros asegurándonos de que coincidan con cómo los lee PropiedadesPage
        if (keyword) params.set("q", keyword); // Se pasa, pero fijate que en tu PropiedadesPage lo usamos como 'searchQuery' a nivel local, podemos usar 'q' para llenar el input
        if (operation) params.set("operacion", operation);
        if (type) params.set("propiedad", type); // OJO ACÁ: En PropiedadesPage leíamos "propiedad", no "tipo"
        if (location) params.set("localidad", location); // OJO ACÁ: En PropiedadesPage leíamos "localidad", no "ubicacion"

        router.push(`/propiedades?${params.toString()}`);
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl px-6 py-5 flex flex-col md:flex-row items-end gap-4">

            {/* 1. Búsqueda libre (Palabra Clave) */}
            <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-[#6b5a4e] uppercase tracking-widest mb-1.5">
                    Búsqueda específica
                </label>
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0a090]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar palabra clave o dirección"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full pl-9 pr-3 py-2.5 border border-[#e0d8ce] rounded-lg text-sm text-[#4a3728] placeholder:text-[#c0b0a0] focus:outline-none focus:border-[#8B1A1A] transition"
                    />
                </div>
            </div>

            {/* 2. Operación (DINÁMICO) */}
            <div className="w-full md:w-36 relative">
                <label className="block text-xs font-semibold text-[#6b5a4e] uppercase tracking-widest mb-1.5">
                    Operación
                </label>
                <select
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                    className="w-full py-2.5 pl-3 pr-8 border border-[#e0d8ce] rounded-lg text-sm text-[#4a3728] bg-white focus:outline-none focus:border-[#8B1A1A] transition appearance-none cursor-pointer"
                >
                    <option value="">Todas</option>
                    {options.tipo_operacion?.map((op) => (
                        <option key={op} value={op}>{op}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-[34px] pointer-events-none text-[#b0a090]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            {/* 3. Tipo de Propiedad (DINÁMICO) */}
            <div className="w-full md:w-36 relative">
                <label className="block text-xs font-semibold text-[#6b5a4e] uppercase tracking-widest mb-1.5">
                    Tipo
                </label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full py-2.5 pl-3 pr-8 border border-[#e0d8ce] rounded-lg text-sm text-[#4a3728] bg-white focus:outline-none focus:border-[#8B1A1A] transition appearance-none cursor-pointer"
                >
                    <option value="">Todos</option>
                    {options.tipo_propiedad?.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-[34px] pointer-events-none text-[#b0a090]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            {/* 4. Localidad / Ubicación (DINÁMICO) */}
            {/* Transformamos el input de texto libre a un select para asegurar consistencia con el Admin */}
            <div className="w-full md:w-40 relative">
                <label className="block text-xs font-semibold text-[#6b5a4e] uppercase tracking-widest mb-1.5">
                    Ubicación
                </label>
                <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full py-2.5 pl-3 pr-8 border border-[#e0d8ce] rounded-lg text-sm text-[#4a3728] bg-white focus:outline-none focus:border-[#8B1A1A] transition appearance-none cursor-pointer"
                >
                    <option value="">Cualquiera</option>
                    {options.localidad?.map((l) => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-[34px] pointer-events-none text-[#b0a090]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            {/* 5. Botón de Buscar */}
            <button
                onClick={handleSearch}
                className="w-full md:w-auto px-8 py-2.5 bg-[#8B1A1A] hover:bg-[#6e1414] active:scale-95 text-white font-bold text-sm tracking-widest uppercase rounded-lg transition-all duration-200 shadow-md whitespace-nowrap h-[42px]"
            >
                Buscar
            </button>
        </div>
    );
}