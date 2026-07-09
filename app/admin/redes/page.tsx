'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// ─── Tipo para cada video en la lista ───
// "mp4" solo puede existir en videos cargados antes (legacy); ya no se pueden crear nuevos.
type VideoItem = {
    id: string;
    type: 'tiktok' | 'mp4';
    url: string;
}

export default function RedesYVideos() {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [successMsg, setSuccessMsg] = useState('')

    // ─── Estado de la lista (Playlist) ───
    const [videos, setVideos] = useState<VideoItem[]>([])

    // ─── Estados para agregar un NUEVO video ───
    // NOTA: Solo se permiten links de TikTok. Subir MP4 directo infla el Storage de Supabase
    // (cada video pesa varios MB y el plan Free tiene solo 1GB de storage total).
    const [newUrl, setNewUrl] = useState('')

    // Cargar la configuración actual al abrir la página
    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('site_settings').select('*')
            if (data) {
                // Buscamos si ya existe nuestra nueva lista de videos
                const feedSetting = data.find(s => s.key === 'home_videos_feed')

                if (feedSetting && feedSetting.value) {
                    try {
                        const parsed = JSON.parse(feedSetting.value)
                        // Le agregamos un ID temporal a cada uno para poder borrarlos de la lista visualmente
                        setVideos(parsed.map((v: any, i: number) => ({ ...v, id: `old-${i}` })))
                    } catch (e) {
                        console.error('Error al leer los videos guardados')
                    }
                } else {
                    // Retrocompatibilidad: Si estaba guardado el formato viejo (1 solo video), lo metemos en la lista
                    const oldType = data.find(s => s.key === 'home_video_type')
                    const oldUrl = data.find(s => s.key === 'home_video_url')
                    if (oldType && oldUrl) {
                        setVideos([{ id: 'old-0', type: oldType.value as 'tiktok' | 'mp4', url: oldUrl.value }])
                    }
                }
            }
            setFetching(false)
        }
        fetchSettings()
    }, [])

    // Agregar video a la cola visual (todavía no se guarda en la BD)
    const handleAddToList = () => {
        if (!newUrl.trim()) return alert('Por favor, pegá un link de TikTok.')

        const newItem: VideoItem = {
            id: Math.random().toString(36).substring(7),
            type: 'tiktok',
            url: newUrl.trim()
        }

        setVideos(prev => [...prev, newItem])
        setNewUrl('')
    }

    const handleRemoveFromList = (idToRemove: string) => {
        setVideos(prev => prev.filter(v => v.id !== idToRemove))
    }

    // Guardar toda la lista en Supabase
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (videos.length === 0) return alert('Agregá al menos un video a la lista antes de guardar.')

        setLoading(true)
        setSuccessMsg('')

        try {
            const finalFeedToSave = videos.map(item => ({ type: item.type, url: item.url }))

            // Guardamos el array completo como JSON (texto) en la base de datos
            const { error: dbError } = await supabase
                .from('site_settings')
                .upsert([{ key: 'home_videos_feed', value: JSON.stringify(finalFeedToSave) }])

            if (dbError) throw dbError

            setSuccessMsg('¡Feed de videos guardado exitosamente!')
            setTimeout(() => setSuccessMsg(''), 3000)

        } catch (error) {
            console.error('Error al guardar:', error)
            alert('Hubo un error al guardar la configuración.')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) return <div className="p-8 text-foreground/50 font-sans">Cargando configuraciones...</div>

    return (
        <div className="max-w-5xl mx-auto pb-12 font-sans">
            <h1 className="text-3xl font-bold text-black mb-2">Feed de Videos (Home)</h1>
            <p className="text-black mb-8">Armá tu lista de reproducción. Los usuarios podrán deslizar para verlos todos.</p>

            {successMsg && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-sm font-medium transition-all">
                    ✓ {successMsg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ── COLUMNA IZQ: Añadir Nuevo Video ── */}
                <div className="bg-card rounded-xl shadow-sm border border-border-card overflow-hidden h-fit">
                    <div className="bg-input p-4 border-b border-border-card font-bold text-[#8B1A1A]">
                        Agregar Video a la Lista
                    </div>
                    <div className="p-6 space-y-6">
                        <p className="text-xs text-foreground/50 bg-input/60 border border-border-card rounded-lg p-3">
                            Solo se admiten links de TikTok. Subir videos MP4 directo consume el storage limitado de Supabase.
                        </p>

                        <div>
                            <input
                                type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="Ej: https://www.tiktok.com/@user/video/123"
                                className="w-full p-2.5 bg-input border border-border-input text-foreground rounded-lg focus:outline-none focus:border-[#8B1A1A] text-sm transition-colors"
                            />
                        </div>

                        <button
                            type="button" onClick={handleAddToList}
                            className="w-full py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white font-bold rounded-lg transition text-sm shadow-md"
                        >
                            + Añadir a la lista
                        </button>
                    </div>
                </div>

                {/* ── COLUMNA DER: Lista Actual y Guardado ── */}
                <form onSubmit={handleSave} className="bg-card rounded-xl shadow-sm border border-border-card overflow-hidden flex flex-col">
                    <div className="bg-input p-4 border-b border-border-card font-bold flex justify-between items-center text-foreground">
                        <span>Tu Lista de Reproducción ({videos.length})</span>
                    </div>

                    <div className="p-6 flex-1 bg-foreground/[0.02]">
                        {videos.length === 0 ? (
                            <div className="text-center text-foreground/40 py-10 text-sm italic">
                                La lista está vacía. Agregá videos desde el panel izquierdo.
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {videos.map((vid, index) => (
                                    <li key={vid.id} className="flex justify-between items-center bg-card p-3 border border-border-card rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="font-bold text-foreground/40 text-xs">{index + 1}.</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${vid.type === 'tiktok' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'}`}>
                                                {vid.type}
                                            </span>
                                            <span className="text-xs text-foreground/80 truncate max-w-[200px]" title={vid.url}>
                                                {vid.url}
                                            </span>
                                        </div>
                                        <button
                                            type="button" onClick={() => handleRemoveFromList(vid.id)}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs font-bold transition-colors"
                                        >
                                            Borrar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-6 border-t border-border-card">
                        <button
                            type="submit" disabled={loading || videos.length === 0}
                            className="w-full py-3 bg-[#8B1A1A] hover:bg-[#6e1414] text-white font-bold rounded-lg shadow-md transition disabled:opacity-50 text-sm tracking-wide uppercase flex items-center justify-center gap-2"
                        >
                            {loading ? 'Guardando...' : 'Guardar y Publicar en la Web'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}