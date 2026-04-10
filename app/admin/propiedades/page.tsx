'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

// ─── Tipo de dato ─────────────────────────────────────────────────────────────
interface Property {
    id: string
    title: string
    location: string
    price: number | null
    currency: string
    operation_type: string
    status: string
    images: string[]
}

export default function AdminPropertiesList() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)

    // Estados para búsqueda y paginación
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10 // Mostramos 10 propiedades por página

    // Cargar propiedades al iniciar
    useEffect(() => {
        fetchProperties()
    }, [])

    // Cuando el usuario escribe algo en el buscador, lo devolvemos a la página 1
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const fetchProperties = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('properties')
            .select('id, title, location, price, currency, operation_type, status, images')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error al cargar propiedades:', error)
        } else {
            setProperties(data || [])
        }
        setLoading(false)
    }

    // Función para eliminar
    const handleDelete = async (id: string, title: string) => {
        const confirmar = window.confirm(`¿Estás seguro que querés eliminar "${title}"?\nEsta acción no se puede deshacer.`)

        if (confirmar) {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id)

            if (error) {
                alert('Hubo un error al eliminar la propiedad.')
                console.error(error)
            } else {
                setProperties(properties.filter(p => p.id !== id))
            }
        }
    }

    // ─── Lógica de Filtro Avanzado ───
    const filteredProperties = properties.filter(p => {
        const term = searchTerm.toLowerCase()
        return (
            (p.title && p.title.toLowerCase().includes(term)) ||
            (p.location && p.location.toLowerCase().includes(term)) ||
            (p.id && p.id.toLowerCase().includes(term)) ||
            (p.operation_type && p.operation_type.toLowerCase().includes(term)) ||
            (p.status && p.status.toLowerCase().includes(term))
        )
    })

    // ─── Lógica de Paginación ───
    const totalItems = filteredProperties.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    // Cortamos el array filtrado para mostrar solo los 10 de la página actual
    const currentItems = filteredProperties.slice(indexOfFirstItem, indexOfLastItem)

    return (
        <div>
            {/* ── Encabezado y Acciones ── */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mis Propiedades</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestioná tu catálogo ({properties.length} en total)</p>
                </div>
                <Link
                    href="/admin/propiedades/nueva"
                    className="bg-red-900 hover:bg-red-800 text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-sm flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Nueva Propiedad
                </Link>
            </div>

            {/* ── Buscador ── */}
            <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input
                    type="text"
                    placeholder="Buscar por ID, título, ubicación, operación o estado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full focus:outline-none text-gray-700 bg-transparent"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-red-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                )}
            </div>

            {/* ── Tabla de Datos ── */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                <th className="p-4 font-semibold">Foto</th>
                                <th className="p-4 font-semibold">Info & ID</th>
                                <th className="p-4 font-semibold">Precio</th>
                                <th className="p-4 font-semibold">Estado</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Cargando catálogo...</td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No se encontraron propiedades que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((property) => (
                                    <tr key={property.id} className="hover:bg-gray-50 transition">

                                        {/* Foto */}
                                        <td className="p-4">
                                            <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden relative">
                                                {property.images && property.images.length > 0 ? (
                                                    <img src={property.images[0]} alt="Miniatura" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin foto</div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Info principal y ID */}
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-900 text-sm line-clamp-1" title={property.title}>{property.title}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">{property.operation_type}</span>
                                                <span className="truncate max-w-[150px]" title={property.location}>• {property.location || 'Sin ubicación'}</span>
                                            </div>
                                            {/* Agregamos el ID chiquito abajo para que sea fácil de copiar/buscar */}
                                            <div className="text-[10px] text-gray-400 mt-1 uppercase font-mono">ID: {property.id.split('-')[0]}</div>
                                        </td>

                                        {/* Precio */}
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {property.price ? `${property.currency === 'USD' ? 'U$S' : '$'} ${property.price.toLocaleString('es-AR')}` : 'Consultar'}
                                            </div>
                                        </td>

                                        {/* Estado */}
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${property.status?.toLowerCase() === 'disponible'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {property.status || 'Desconocido'}
                                            </span>
                                        </td>

                                        {/* Acciones */}
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            <Link
                                                href={`/admin/propiedades/editar/${property.id}`}
                                                className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 hover:text-red-900 transition"
                                            >
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(property.id, property.title)}
                                                className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-red-200 rounded text-sm text-red-600 hover:bg-red-50 hover:border-red-300 transition"
                                            >
                                                Borrar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Footer con Paginación ── */}
            {!loading && totalItems > 0 && (
                <div className="bg-white p-4 border border-t-0 border-gray-200 rounded-b-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600">
                        Mostrando <span className="font-semibold">{indexOfFirstItem + 1}</span> a <span className="font-semibold">{Math.min(indexOfLastItem, totalItems)}</span> de <span className="font-semibold">{totalItems}</span> resultados
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Anterior
                        </button>
                        <div className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded">
                            Página {currentPage} de {totalPages}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}