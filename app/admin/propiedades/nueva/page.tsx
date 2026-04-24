'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('../../../components/MapPicker'), { ssr: false })

type ImageItem = {
    id: string;
    file: File;
    preview: string;
}

export default function NuevaPropiedad() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '', description: '', price: '', currency: 'USD',
        operation_type: '', property_type: '', provincia: '', localidad: '', location: '',
        latitude: '', longitude: '', bedrooms: '0', bathrooms: '0', environments: '0', status: 'disponible', features: ''
    })

    const [listOptions, setListOptions] = useState<Record<string, string[]>>({
        tipo_propiedad: [], tipo_operacion: [], provincia: [], localidad: []
    })

    const [images, setImages] = useState<ImageItem[]>([])
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

    useEffect(() => {
        const fetchLists = async () => {
            const { data } = await supabase.from('form_options').select('*')
            if (data) {
                const grouped = data.reduce((acc, curr) => {
                    if (!acc[curr.category]) acc[curr.category] = []
                    acc[curr.category].push(curr.value)
                    return acc
                }, {} as Record<string, string[]>)

                setListOptions(grouped)
                setFormData(prev => ({
                    ...prev,
                    property_type: grouped.tipo_propiedad?.[0] || '',
                    operation_type: grouped.tipo_operacion?.[0] || '',
                    provincia: grouped.provincia?.[0] || '',
                    localidad: grouped.localidad?.[0] || '',
                }))
            }
        }
        fetchLists()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleGetLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                pos => setFormData({ ...formData, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() }),
                () => alert("No pudimos obtener la ubicación.")
            );
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files)
            const newImgs = filesArray.map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                preview: URL.createObjectURL(file)
            }))
            setImages(prev => [...prev, ...newImgs])
        }
    }

    const removeImage = (idToRemove: string) => {
        setImages(prev => prev.filter(img => img.id !== idToRemove))
    }

    const handleDragStart = (index: number) => setDraggedIdx(index)
    const handleDragOver = (e: React.DragEvent) => e.preventDefault()
    const handleDrop = (index: number) => {
        if (draggedIdx === null) return
        const newImages = [...images]
        const [draggedItem] = newImages.splice(draggedIdx, 1)
        newImages.splice(index, 0, draggedItem)
        setImages(newImages)
        setDraggedIdx(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const imageUrls: string[] = []
            for (const img of images) {
                const fileExt = img.file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage.from('propiedades').upload(fileName, img.file)
                if (uploadError) throw uploadError
                const { data: { publicUrl } } = supabase.storage.from('propiedades').getPublicUrl(fileName)
                imageUrls.push(publicUrl)
            }

            const featuresArray = formData.features.split(',').map(f => f.trim()).filter(f => f !== '')

            // CORRECCIÓN ACÁ: Ya no concatenamos. Guardamos solo la calle en location.
            const { error: dbError } = await supabase.from('properties').insert([{
                title: formData.title,
                description: formData.description,
                price: formData.price ? Number(formData.price) : null,
                currency: formData.currency,
                operation_type: formData.operation_type,
                property_type: formData.property_type,
                provincia: formData.provincia,
                localidad: formData.localidad,
                location: formData.location.trim(), // Solo guardamos la calle/altura ingresada
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                environments: Number(formData.environments),
                status: formData.status,
                features: featuresArray,
                images: imageUrls
            }])

            if (dbError) throw dbError
            router.push('/admin/propiedades')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Hubo un error al guardar la propiedad.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-16">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/propiedades" className="text-gray-400 hover:text-gray-900 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>Ficha de Propiedad</h1>
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"><p>{error}</p></div>}

            <form onSubmit={handleSubmit} className="bg-white shadow-lg border border-gray-200 rounded-sm">

                <div className="p-8 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-[#8B1A1A] mb-6 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#8B1A1A] text-white flex items-center justify-center text-sm">1</span>Información Básica</h2>
                    <div className="space-y-6">
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Título *</label><input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#8B1A1A] outline-none bg-gray-50" /></div>
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label><textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#8B1A1A] outline-none bg-gray-50"></textarea></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label><select name="property_type" required value={formData.property_type} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded outline-none bg-gray-50"><option value="" disabled>Seleccionar...</option>{listOptions.tipo_propiedad?.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Operación</label><select name="operation_type" required value={formData.operation_type} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded outline-none bg-gray-50"><option value="" disabled>Seleccionar...</option>{listOptions.tipo_operacion?.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded outline-none bg-gray-50"><option value="disponible">Disponible</option><option value="reservado">Reservado</option><option value="vendido">Vendido/Alquilado</option><option value="oculto">Oculto</option></select></div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-b border-gray-100 bg-[#faf7f2]/30">
                    <h2 className="text-xl font-semibold text-[#8B1A1A] mb-6 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#8B1A1A] text-white flex items-center justify-center text-sm">2</span>Ubicación y Mapa</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Provincia *</label><select name="provincia" required value={formData.provincia} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#8B1A1A] outline-none bg-white"><option value="" disabled>Seleccionar...</option>{listOptions.provincia?.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Localidad *</label><select name="localidad" required value={formData.localidad} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#8B1A1A] outline-none bg-white"><option value="" disabled>Seleccionar...</option>{listOptions.localidad?.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                        </div>
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Calle y Altura *</label><input type="text" name="location" required value={formData.location} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#8B1A1A] outline-none bg-white" /></div>
                        <div className="bg-white p-5 rounded border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4"><label className="block text-sm font-semibold text-gray-700">Ubicación exacta en el mapa</label><button type="button" onClick={handleGetLocation} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded flex items-center gap-1 font-medium shadow-sm">📍 Usar mi ubicación actual</button></div>
                            <MapPicker lat={formData.latitude} lng={formData.longitude} onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })} />
                        </div>
                    </div>
                </div>

                <div className="p-8 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-[#8B1A1A] mb-6 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#8B1A1A] text-white flex items-center justify-center text-sm">3</span>Precio y Dimensiones</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-1/3"><label className="block text-sm font-semibold text-gray-700 mb-1">Moneda</label><select name="currency" value={formData.currency} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded outline-none bg-gray-50"><option value="USD">U$S (Dólar)</option><option value="ARS">$ (Pesos)</option></select></div>
                            <div className="w-2/3"><label className="block text-sm font-semibold text-gray-700 mb-1">Valor *</label><input type="number" name="price" required value={formData.price} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#8B1A1A] outline-none bg-gray-50" /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1 text-center">Ambientes</label><input type="number" name="environments" min="0" value={formData.environments} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded outline-none text-center bg-gray-50" /></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1 text-center">Dormitorios</label><input type="number" name="bedrooms" min="0" value={formData.bedrooms} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded outline-none text-center bg-gray-50" /></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1 text-center">Baños</label><input type="number" name="bathrooms" min="0" value={formData.bathrooms} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded outline-none text-center bg-gray-50" /></div>
                        </div>
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Características (Separadas por coma)</label><input type="text" name="features" value={formData.features} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#8B1A1A] outline-none bg-gray-50" /></div>
                    </div>
                </div>

                <div className="p-8">
                    <h2 className="text-xl font-semibold text-[#8B1A1A] mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#8B1A1A] text-white flex items-center justify-center text-sm">4</span>
                        Galería de Fotos
                    </h2>

                    <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                        <div className="space-y-2 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <div className="flex text-sm text-gray-600 justify-center">
                                <span className="relative rounded-md font-semibold text-[#8B1A1A] hover:text-red-700">Hacé clic para subir fotos</span>
                            </div>
                            <p className="text-xs text-gray-500">Podés arrastrar para reordenar. La primera foto será la Portada.</p>
                        </div>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>

                    {images.length > 0 && (
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {images.map((img, index) => (
                                <div
                                    key={img.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(index)}
                                    className={`relative group rounded-md overflow-hidden bg-gray-200 aspect-square shadow-sm cursor-move border-2 transition-all ${draggedIdx === index ? 'opacity-50 border-dashed border-gray-500' : 'border-transparent hover:border-[#8B1A1A]'}`}
                                >
                                    <img src={img.preview} alt="Preview" className="w-full h-full object-cover pointer-events-none" />

                                    {index === 0 && (
                                        <div className="absolute top-0 left-0 w-full bg-[#8B1A1A]/90 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider backdrop-blur-sm">
                                            Portada
                                        </div>
                                    )}

                                    <button type="button" onClick={() => removeImage(img.id)} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-200 flex justify-end gap-4 rounded-b-sm">
                    <Link href="/admin/propiedades" className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 font-semibold rounded transition shadow-sm">Cancelar</Link>
                    <button type="submit" disabled={loading} className="px-8 py-3 bg-[#8B1A1A] hover:bg-[#6e1414] text-white font-bold tracking-wide rounded transition shadow-md disabled:opacity-50 flex items-center gap-2">
                        {loading ? 'Subiendo...' : 'Guardar y Publicar'}
                    </button>
                </div>
            </form>
        </div>
    )
}