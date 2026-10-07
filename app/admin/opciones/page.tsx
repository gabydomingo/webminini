'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { avisarCambio } from '../../lib/revalidar'

interface Option {
    id: number
    category: string
    value: string
}

export default function GestionOpciones() {
    const [options, setOptions] = useState<Option[]>([])
    const [loading, setLoading] = useState(true)
    const [newOption, setNewOption] = useState({ category: 'tipo_propiedad', value: '' })
    const [guardando, setGuardando] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const fetchOptions = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('form_options').select('*').order('category').order('value')
        if (!error && data) setOptions(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchOptions()
    }, [])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg(null)

        const valor = newOption.value.trim()
        if (!valor) return

        // No repetir un valor que ya está en esa lista. La tabla no tiene
        // una constraint UNIQUE, así que el duplicado entraría igual y
        // después aparece dos veces en los filtros.
        const yaExiste = options.some(
            o => o.category === newOption.category &&
                 o.value.trim().toLowerCase() === valor.toLowerCase()
        )
        if (yaExiste) {
            setErrorMsg(`"${valor}" ya está en esa lista.`)
            return
        }

        setGuardando(true)
        const { error } = await supabase.from('form_options').insert([
            { category: newOption.category, value: valor }
        ])
        setGuardando(false)

        if (error) {
            // Antes acá decía solo "Error al guardar la opción" y el motivo
            // real quedaba escondido en la consola del navegador.
            console.error('[opciones] insert falló:', error)
            setErrorMsg(`No se pudo guardar: ${error.message}`)
            return
        }

        setNewOption({ ...newOption, value: '' })
        await fetchOptions()
        // Los filtros del buscador y del listado público se arman con esta
        // tabla, y esas páginas están en caché. Sin este aviso, la opción
        // nueva no aparece en la web hasta el día siguiente.
        avisarCambio()
    }

    const handleDelete = async (id: number) => {
        setErrorMsg(null)
        const { error } = await supabase.from('form_options').delete().eq('id', id)
        if (error) {
            console.error('[opciones] delete falló:', error)
            setErrorMsg(`No se pudo borrar: ${error.message}`)
            return
        }
        await fetchOptions()
        avisarCambio()
    }

    // Agrupamos las opciones para mostrarlas ordenadas
    const groupedOptions = options.reduce((acc, opt) => {
        if (!acc[opt.category]) acc[opt.category] = []
        acc[opt.category].push(opt)
        return acc
    }, {} as Record<string, Option[]>)

    const categories = [
        { id: 'tipo_propiedad', label: 'Tipos de Propiedad' },
        { id: 'tipo_operacion', label: 'Tipos de Operación' },
        { id: 'provincia', label: 'Provincias' },
        { id: 'localidad', label: 'Localidades' }
    ]

    return (
        <div className="max-w-5xl mx-auto pb-12 font-sans">
            <h1 className="text-3xl font-bold text-black mb-2">Gestión de Listas y Categorías</h1>
            <p className="text-black mb-8">Agregá o eliminá los valores que aparecerán en los formularios de propiedades.</p>

            {/* Formulario para agregar nuevos */}
            <form onSubmit={handleAdd} className="bg-card p-6 rounded-xl shadow-sm border border-border-card mb-8 flex flex-col md:flex-row items-end gap-4 transition-colors">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-foreground/80 mb-1">¿A qué lista pertenece?</label>
                    <select
                        value={newOption.category}
                        onChange={(e) => setNewOption({ ...newOption, category: e.target.value })}
                        className="w-full p-2.5 bg-input border border-border-input text-foreground rounded-lg focus:outline-none focus:border-[#8B1A1A] transition-colors"
                    >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-foreground/80 mb-1">Nuevo Valor</label>
                    <input
                        type="text"
                        required
                        value={newOption.value}
                        onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                        placeholder="Ej: Galpón, Buenos Aires, Permuta..."
                        className="w-full p-2.5 bg-input border border-border-input text-foreground rounded-lg focus:outline-none focus:border-[#8B1A1A] transition-colors"
                    />
                </div>
                <button
                    type="submit"
                    disabled={guardando}
                    className="px-6 py-2.5 bg-[#8B1A1A] hover:bg-[#6e1414] disabled:opacity-60 text-white font-bold rounded-lg transition-colors w-full md:w-auto shadow-sm"
                >
                    {guardando ? 'Guardando...' : 'Agregar a la lista'}
                </button>
            </form>

            {errorMsg && (
                <div
                    role="alert"
                    className="mb-8 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                >
                    {errorMsg}
                </div>
            )}

            {/* Grilla mostrando lo que ya existe */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-border-card border-t-[#8B1A1A] rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.map(category => (
                        <div key={category.id} className="bg-card rounded-xl shadow-sm border border-border-card overflow-hidden transition-colors">
                            {/* Devolvemos el texto a bold y gris oscuro/claro según el tema */}
                            <div className="bg-input p-4 border-b border-border-card font-bold text-foreground">
                                {category.label}
                            </div>
                            <ul className="divide-y divide-border-card max-h-60 overflow-y-auto">
                                {(groupedOptions[category.id] || []).length === 0 ? (
                                    <li className="p-4 text-sm text-foreground/50 italic text-center">No hay valores cargados aún.</li>
                                ) : (
                                    groupedOptions[category.id].map(opt => (
                                        <li key={opt.id} className="p-4 flex justify-between items-center text-sm hover:bg-foreground/[0.02] transition-colors">
                                            <span className="font-medium text-foreground/80">{opt.value}</span>
                                            <button onClick={() => handleDelete(opt.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs font-semibold px-2 py-1 rounded transition-colors">
                                                Borrar
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}