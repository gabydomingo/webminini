"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
    const router = useRouter();
    const [keyword, setKeyword] = useState("");
    const [operation, setOperation] = useState("");
    const [type, setType] = useState("");
    const [location, setLocation] = useState("");

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (keyword) params.set("q", keyword);
        if (operation) params.set("operacion", operation);
        if (type) params.set("tipo", type);
        if (location) params.set("ubicacion", location);

        router.push(`/propiedades?${params.toString()}`);
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl px-6 py-5 flex flex-col md:flex-row items-end gap-4">
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

            <div className="w-full md:w-36">
                <label className="block text-xs font-semibold text-[#6b5a4e] uppercase tracking-widest mb-1.5">
                    Operación
                </label>
                <select
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                    className="w-full py-2.5 px-3 border border-[#e0d8ce] rounded-lg text-sm text-[#4a3728] bg-white focus:outline-none focus:border-[#8B1A1A] transition appearance-none cursor-pointer"
                >
                    <option value="">Todas</option>
                    <option value="Venta">Venta</option>
                    <option value="Alquiler">Alquiler</option>
                </select>
            </div>

            <div className="w-full md:w-36">
                <label className="block text-xs font-semibold text-[#6b5a4e] uppercase tracking-widest mb-1.5">
                    Tipo
                </label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full py-2.5 px-3 border border-[#e0d8ce] rounded-lg text-sm text-[#4a3728] bg-white focus:outline-none focus:border-[#8B1A1A] transition appearance-none cursor-pointer"
                >
                    <option value="">Todos</option>
                    <option value="Casa">Casa</option>
                    <option value="Departamento">Departamento</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Local">Local</option>
                    <option value="Oficina">Oficina</option>
                </select>
            </div>

            <div className="w-full md:w-40">
                <label className="block text-xs font-semibold text-[#6b5a4e] uppercase tracking-widest mb-1.5">
                    Ubicación
                </label>
                <input
                    type="text"
                    placeholder="Ciudad o barrio"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full py-2.5 px-3 border border-[#e0d8ce] rounded-lg text-sm text-[#4a3728] placeholder:text-[#c0b0a0] focus:outline-none focus:border-[#8B1A1A] transition"
                />
            </div>

            <button
                onClick={handleSearch}
                className="w-full md:w-auto px-8 py-2.5 bg-[#8B1A1A] hover:bg-[#6e1414] active:scale-95 text-white font-bold text-sm tracking-widest uppercase rounded-lg transition-all duration-200 shadow-md whitespace-nowrap"
            >
                Buscar
            </button>
        </div>
    );
}