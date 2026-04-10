'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// ─── Tipo para cada video en la lista ───
type VideoItem = {
    id: string;
    type: 'tiktok' | 'mp4';
    url: string;
    file?: File; // Solo existirá si es un archivo MP4 recién seleccionado
}

export default function RedesYVideos() {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [successMsg, setSuccessMsg] = useState('')

    // ─── Estado de la lista (Playlist) ───
    const [videos, setVideos] = useState<VideoItem[]>([])

    // ─── Estados para agregar un NUEVO video ───
    const [newType, setNewType] = useState<'tiktok' | 'mp4'>('tiktok')
    const [newUrl, setNewUrl] = useState('')
    const [newFile, setNewFile] = useState<File | null>(null)

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setNewFile(e.target.files[0])
        }
    }

    // Agregar video a la cola visual (todavía no se guarda en la BD)
    const handleAddToList = () => {
        if (newType === 'tiktok' && !newUrl.trim()) return alert('Por favor, pegá un link de TikTok.')
        if (newType === 'mp4' && !newFile) return alert('Por favor, seleccioná un archivo de video.')

        const newItem: VideoItem = {
            id: Math.random().toString(36).substring(7),
            type: newType,
            url: newType === 'tiktok' ? newUrl.trim() : URL.createObjectURL(newFile!),
            file: newType === 'mp4' ? newFile! : undefined
        }

        setVideos(prev => [...prev, newItem])

        // Limpiamos los inputs
        setNewUrl('')
        setNewFile(null)
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
            const finalFeedToSave = []

            for (const item of videos) {
                // Si es un archivo nuevo que subió el usuario, lo mandamos al Storage primero
                if (item.file) {
                    const fileExt = item.file.name.split('.').pop()
                    const fileName = `home-feed-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                    const { error: uploadError } = await supabase.storage.from('propiedades').upload(fileName, item.file)
                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage.from('propiedades').getPublicUrl(fileName)

                    finalFeedToSave.push({ type: 'mp4', url: publicUrl })
                } else {
                    // Si ya era un link de TikTok o un MP4 que ya estaba en la base, lo guardamos tal cual
                    finalFeedToSave.push({ type: item.type, url: item.url })
                }
            }

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

    if (fetching) return <div className="p-8 text-gray-500">Cargando configuraciones...</div>

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed de Videos (Home)</h1>
            <p className="text-gray-500 mb-8">Armá tu lista de reproducción. Los usuarios podrán deslizar para verlos todos.</p>

            {successMsg && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-sm font-medium transition-all">
                    ✓ {successMsg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ── COLUMNA IZQ: Añadir Nuevo Video ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                    <div className="bg-gray-50 p-4 border-b border-gray-200 font-bold text-[#8B1A1A]">
                        Agregar Video a la Lista
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex gap-4">
                            <label className={`flex-1 border-2 rounded-lg p-3 cursor-pointer transition flex items-center gap-2 ${newType === 'tiktok' ? 'border-[#8B1A1A] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input type="radio" checked={newType === 'tiktok'} onChange={() => setNewType('tiktok')} className="w-4 h-4 text-[#8B1A1A]" />
                                <span className="font-semibold text-sm">Link TikTok</span>
                            </label>
                            <label className={`flex-1 border-2 rounded-lg p-3 cursor-pointer transition flex items-center gap-2 ${newType === 'mp4' ? 'border-[#8B1A1A] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input type="radio" checked={newType === 'mp4'} onChange={() => setNewType('mp4')} className="w-4 h-4 text-[#8B1A1A]" />
                                <span className="font-semibold text-sm">Archivo MP4</span>
                            </label>
                        </div>

                        <div>
                            {newType === 'tiktok' ? (
                                <input
                                    type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                                    placeholder="Ej: https://www.tiktok.com/@user/video/123"
                                    className="w-full p-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#8B1A1A] text-sm"
                                />
                            ) : (
                                <input
                                    type="file" accept="video/mp4,video/webm" onChange={handleFileChange}
                                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                                />
                            )}
                        </div>

                        <button
                            type="button" onClick={handleAddToList}
                            className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded transition text-sm"
                        >
                            + Añadir a la lista
                        </button>
                    </div>
                </div>

                {/* ── COLUMNA DER: Lista Actual y Guardado ── */}
                <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="bg-gray-50 p-4 border-b border-gray-200 font-bold flex justify-between items-center">
                        <span className="text-gray-800">Tu Lista de Reproducción ({videos.length})</span>
                    </div>

                    <div className="p-6 flex-1 bg-gray-50/50">
                        {videos.length === 0 ? (
                            <div className="text-center text-gray-400 py-10 text-sm italic">
                                La lista está vacía. Agregá videos desde el panel izquierdo.
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {videos.map((vid, index) => (
                                    <li key={vid.id} className="flex justify-between items-center bg-white p-3 border border-gray-200 rounded shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="font-bold text-gray-400 text-xs">{index + 1}.</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${vid.type === 'tiktok' ? 'bg-black text-white' : 'bg-blue-100 text-blue-800'}`}>
                                                {vid.type}
                                            </span>
                                            <span className="text-xs text-gray-600 truncate max-w-[200px]" title={vid.url}>
                                                {vid.file ? vid.file.name : vid.url}
                                            </span>
                                        </div>
                                        <button
                                            type="button" onClick={() => handleRemoveFromList(vid.id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                                        >
                                            Borrar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-100">
                        <button
                            type="submit" disabled={loading || videos.length === 0}
                            className="w-full py-3 bg-[#8B1A1A] hover:bg-[#6e1414] text-white font-bold rounded shadow-sm transition disabled:opacity-50 text-sm tracking-wide uppercase"
                        >
                            {loading ? 'Subiendo archivos y guardando...' : 'Guardar y Publicar en la Web'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}