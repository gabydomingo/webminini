'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { comprimirImagen, type ImagenComprimida } from '../../../../lib/imageCompress'
import { subirComprimida } from '../../../../lib/storage'
import { avisarCambio } from '../../../../lib/revalidar'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('../../../../components/MapPicker'), { ssr: false })

type GalleryItem = {
    id: string;
    isExisting: boolean;
    url: string;
    /** Solo en las fotos nuevas: la versión ya comprimida lista para subir. */
    comp?: ImagenComprimida;
}

export default function EditarPropiedad() {
    const router = useRouter()
    const params = useParams()
    const propertyId = params.id as string

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '', description: '', price: '', currency: 'USD',
        operation_type: '', property_type: '', provincia: '', localidad: '', location: '',
        latitude: '', longitude: '', bedrooms: '0', bathrooms: '0', environments: '0', status: 'disponible', features: ''
    })

    const [listOptions, setListOptions] = useState<Record<string, string[]>>({
        tipo_propiedad: [], tipo_operacion: [], provincia: [], localidad: []
    })

    const [gallery, setGallery] = useState<GalleryItem[]>([])
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
    const [procesando, setProcesando] = useState(false)
    const [progreso, setProgreso] = useState<string | null>(null)

    useEffect(() => {
        const fetchAllData = async () => {
            setFetching(true)
            const { data: optionsData } = await supabase.from('form_options').select('*')
            let groupedOptions: Record<string, string[]> = {}
            if (optionsData) {
                groupedOptions = optionsData.reduce((acc, curr) => {
                    if (!acc[curr.category]) acc[curr.category] = []
                    acc[curr.category].push(curr.value)
                    return acc
                }, {} as Record<string, string[]>)
                setListOptions(groupedOptions)
            }

            if (propertyId) {
                const { data: propData, error: propError } = await supabase.from('properties').select('*').eq('id', propertyId).single()
                if (propError) setError('No se pudo cargar la propiedad.')
                else if (propData) {
                    let parsedFeatures = '';
                    if (Array.isArray(propData.features)) parsedFeatures = propData.features.join(', ');
                    else if (typeof propData.features === 'string') parsedFeatures = propData.features;

                    setFormData({
                        title: propData.title || '', description: propData.description || '', price: propData.price ? propData.price.toString() : '',
                        currency: propData.currency || 'USD', operation_type: propData.operation_type || groupedOptions.tipo_operacion?.[0] || '',
                        property_type: propData.property_type || groupedOptions.tipo_propiedad?.[0] || '', provincia: propData.provincia || groupedOptions.provincia?.[0] || '',
                        localidad: propData.localidad || groupedOptions.localidad?.[0] || '',
                        location: propData.location || '',
                        latitude: propData.latitude ? propData.latitude.toString() : '', longitude: propData.longitude ? propData.longitude.toString() : '',
                        bedrooms: propData.bedrooms ? propData.bedrooms.toString() : '0', bathrooms: propData.bathrooms ? propData.bathrooms.toString() : '0',
                        environments: propData.environments ? propData.environments.toString() : '0', status: propData.status || 'disponible', features: parsedFeatures
                    })

                    if (Array.isArray(propData.images)) {
                        const existingImgs = propData.images.map((url: string, i: number) => ({
                            id: `old-${i}`,
                            isExisting: true,
                            url: url
                        }))
                        setGallery(existingImgs)
                    }
                }
            }
            setFetching(false)
        }
        fetchAllData()
    }, [propertyId])

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

    const handleNewImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return

        const archivos = Array.from(e.target.files)
        e.target.value = ''
        setProcesando(true)
        setError(null)

        const nuevas: GalleryItem[] = []
        const fallidas: string[] = []

        for (let i = 0; i < archivos.length; i++) {
            setProgreso(`Optimizando ${i + 1} de ${archivos.length}...`)
            try {
                const comp: ImagenComprimida = await comprimirImagen(archivos[i])
                nuevas.push({
                    id: `new-${Date.now()}-${i}`,
                    isExisting: false,
                    url: URL.createObjectURL(comp.full),
                    comp,
                })
            } catch (err: any) {
                fallidas.push(err?.message || archivos[i].name)
            }
        }

        setGallery(prev => [...prev, ...nuevas])
        setProcesando(false)
        setProgreso(null)
        if (fallidas.length) setError(fallidas.join(' · '))
    }

    const removeGalleryImage = (idToRemove: string) => {
        setGallery(prev => prev.filter(img => img.id !== idToRemove))
    }

    const handleDragStart = (index: number) => setDraggedIdx(index)
    const handleDragOver = (e: React.DragEvent) => e.preventDefault()
    const handleDrop = (index: number) => {
        if (draggedIdx === null) return
        const newGallery = [...gallery]
        const [draggedItem] = newGallery.splice(draggedIdx, 1)
        newGallery.splice(index, 0, draggedItem)
        setGallery(newGallery)
        setDraggedIdx(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const finalUrls: string[] = []

            for (const item of gallery) {
                if (item.isExisting) {
                    finalUrls.push(item.url)
                } else if (item.comp) {
                    setProgreso('Subiendo fotos nuevas...')
                    const { url } = await subirComprimida(item.comp)
                    finalUrls.push(url)
                }
            }

            const featuresArray = formData.features.split(',').map(f => f.trim()).filter(f => f !== '')

            const { error: dbError } = await supabase.from('properties').update({
                title: formData.title,
                description: formData.description,
                price: formData.price ? Number(formData.price) : null,
                currency: formData.currency,
                operation_type: formData.operation_type,
                property_type: formData.property_type,
                provincia: formData.provincia,
                localidad: formData.localidad,
                location: formData.location.trim(),
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                environments: Number(formData.environments),
                status: formData.status,
                features: featuresArray,
                images: finalUrls
            }).eq('id', propertyId)

            if (dbError) throw dbError

            // La web pública sirve desde caché: le avisamos que esta
            // propiedad cambió para que la regenere ya.
            await avisarCambio(propertyId)

            router.push('/admin/propiedades')
            router.refresh()

        } catch (err: any) {
            setError(err.message || 'Hubo un error al actualizar la propiedad.')
        } finally {
            setLoading(false)
            setProgreso(null)
        }
    }

    if (fetching) return <div className="text-center py-20 text-foreground/50 font-sans">Cargando datos de la propiedad...</div>

    return (
        <div className="max-w-3xl mx-auto pb-16 font-sans">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/propiedades" className="text-foreground/50 hover:text-foreground transition"><svg className="w-6 h-6" fill="none" stroke="#000000" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></Link>
                {/* ACÁ CORREGIMOS text-gray-900 POR text-foreground */}
                <h1 className="text-3xl font-bold text-black font-serif">Editar Propiedad</h1>
            </div>

            {error && <div className="bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 mb-6 rounded"><p>{error}</p></div>}

            <form onSubmit={handleSubmit} className="bg-card shadow-sm border border-border-card rounded-xl overflow-hidden">

                <div className="p-8 border-b border-border-card">
                    <h2 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2 font-serif"><span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-sans">1</span>Información Básica</h2>
                    <div className="space-y-6">
                        <div><label className="block text-sm font-semibold text-foreground/80 mb-1">Título *</label><input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg focus:ring-1 focus:ring-primary outline-none bg-input transition-colors" /></div>
                        <div><label className="block text-sm font-semibold text-foreground/80 mb-1">Descripción</label><textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg focus:ring-1 focus:ring-primary outline-none bg-input transition-colors"></textarea></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div><label className="block text-sm font-semibold text-foreground/80 mb-1">Tipo</label><select name="property_type" required value={formData.property_type} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none bg-input transition-colors"><option value="" disabled>Seleccionar...</option>{listOptions.tipo_propiedad?.map(opt => <option key={opt} value={opt}>{opt}</option>)}{formData.property_type && !listOptions.tipo_propiedad?.includes(formData.property_type) && <option value={formData.property_type}>{formData.property_type}</option>}</select></div>
                            <div><label className="block text-sm font-semibold text-foreground/80 mb-1">Operación</label><select name="operation_type" required value={formData.operation_type} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none bg-input transition-colors"><option value="" disabled>Seleccionar...</option>{listOptions.tipo_operacion?.map(opt => <option key={opt} value={opt}>{opt}</option>)}{formData.operation_type && !listOptions.tipo_operacion?.includes(formData.operation_type) && <option value={formData.operation_type}>{formData.operation_type}</option>}</select></div>
                            <div><label className="block text-sm font-semibold text-foreground/80 mb-1">Estado</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none bg-input transition-colors"><option value="disponible">Disponible</option><option value="reservado">Reservado</option><option value="vendido">Vendido/Alquilado</option><option value="oculto">Oculto</option></select></div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-b border-border-card bg-foreground/[0.02]">
                    <h2 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2 font-serif"><span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-sans">2</span>Ubicación y Mapa</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-semibold text-foreground/80 mb-1">Provincia *</label><select name="provincia" required value={formData.provincia} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none bg-input transition-colors"><option value="" disabled>Seleccionar...</option>{listOptions.provincia?.map(opt => <option key={opt} value={opt}>{opt}</option>)}{formData.provincia && !listOptions.provincia?.includes(formData.provincia) && <option value={formData.provincia}>{formData.provincia}</option>}</select></div>
                            <div><label className="block text-sm font-semibold text-foreground/80 mb-1">Localidad *</label><select name="localidad" required value={formData.localidad} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none bg-input transition-colors"><option value="" disabled>Seleccionar...</option>{listOptions.localidad?.map(opt => <option key={opt} value={opt}>{opt}</option>)}{formData.localidad && !listOptions.localidad?.includes(formData.localidad) && <option value={formData.localidad}>{formData.localidad}</option>}</select></div>
                        </div>
                        <div><label className="block text-sm font-semibold text-foreground/80 mb-1">Calle y Altura *</label><input type="text" name="location" required value={formData.location} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none bg-input transition-colors" /></div>
                        <div className="bg-card p-5 rounded-lg border border-border-card shadow-sm">
                            {/* <div className="flex justify-between items-center mb-4"><label className="block text-sm font-semibold text-foreground/80">Ubicación exacta en el mapa</label><button type="button" onClick={handleGetLocation} className="text-xs bg-input hover:bg-border-card text-foreground py-1.5 px-3 rounded flex items-center gap-1 font-medium transition-colors">📍 Usar mi ubicación</button></div> */}
                            <MapPicker lat={formData.latitude} lng={formData.longitude} onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })} />
                        </div>
                    </div>
                </div>

                <div className="p-8 border-b border-border-card">
                    <h2 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2 font-serif"><span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-sans">3</span>Precio y Dimensiones</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-1/3"><label className="block text-sm font-semibold text-foreground/80 mb-1">Moneda</label><select name="currency" value={formData.currency} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none bg-input transition-colors"><option value="USD">U$S (Dólar)</option><option value="ARS">$ (Pesos)</option></select></div>
                            <div className="w-2/3"><label className="block text-sm font-semibold text-foreground/80 mb-1">Valor *</label><input type="number" name="price" required value={formData.price} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none bg-input transition-colors" /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div><label className="block text-sm font-semibold text-foreground/80 mb-1 text-center">Ambientes</label><input type="number" name="environments" min="0" value={formData.environments} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none text-center bg-input transition-colors" /></div>
                            <div><label className="block text-sm font-semibold text-foreground/80 mb-1 text-center">Dormitorios</label><input type="number" name="bedrooms" min="0" value={formData.bedrooms} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none text-center bg-input transition-colors" /></div>
                            <div><label className="block text-sm font-semibold text-foreground/80 mb-1 text-center">Baños</label><input type="number" name="bathrooms" min="0" value={formData.bathrooms} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none text-center bg-input transition-colors" /></div>
                        </div>
                        <div><label className="block text-sm font-semibold text-foreground/80 mb-1">Características (Separadas por coma)</label><input type="text" name="features" value={formData.features} onChange={handleChange} className="w-full p-3 border border-border-input text-foreground rounded-lg outline-none bg-input transition-colors" /></div>
                    </div>
                </div>

                <div className="p-8 border-b border-border-card bg-foreground/[0.02]">
                    <h2 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2 font-serif">
                        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-sans">4</span>
                        Galería de Fotos
                    </h2>

                    <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-border-input border-dashed rounded-lg bg-input hover:bg-border-card transition cursor-pointer relative">
                        <div className="space-y-2 text-center">
                            <svg className="mx-auto h-12 w-12 text-foreground/40" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <div className="flex text-sm text-foreground/60 justify-center">
                                <span className="relative rounded-md font-semibold text-primary hover:underline">Hacé clic para subir fotos nuevas</span>
                            </div>
                            <p className="text-xs text-foreground/40">Mantené presionado y arrastrá para cambiar el orden.</p>
                        </div>
                        <input type="file" multiple accept="image/*" onChange={handleNewImageChange} disabled={procesando || loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait" />
                    </div>

                    {(procesando || progreso) && (
                        <div className="mt-4 flex items-center gap-3 text-sm text-foreground/70 bg-input/50 rounded-lg px-4 py-3">
                            <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            {progreso || 'Optimizando fotos...'}
                        </div>
                    )}


                    {gallery.length > 0 && (
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {gallery.map((img, index) => (
                                <div
                                    key={img.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(index)}
                                    className={`relative group rounded-md overflow-hidden bg-input aspect-square shadow-sm cursor-move border-2 transition-all ${draggedIdx === index ? 'opacity-50 border-dashed border-foreground/50' : 'border-transparent hover:border-primary'}`}
                                >
                                    <img src={img.url} alt="Propiedad" className="w-full h-full object-cover pointer-events-none" />

                                    {index === 0 && (
                                        <div className="absolute top-0 left-0 w-full bg-primary/90 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider backdrop-blur-sm">
                                            Portada
                                        </div>
                                    )}

                                    {!img.isExisting && (
                                        <div className="absolute bottom-2 left-2 bg-green-600/90 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                            Nueva
                                        </div>
                                    )}

                                    <button type="button" onClick={() => removeGalleryImage(img.id)} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-card border-t border-border-card flex justify-end gap-4">
                    <Link href="/admin/propiedades" className="px-6 py-3 text-foreground bg-input border border-border-input hover:bg-border-card font-semibold rounded-lg transition shadow-sm">Cancelar</Link>
                    <button type="submit" disabled={loading} className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold tracking-wide rounded-lg transition shadow-md disabled:opacity-50 flex items-center gap-2">
                        {loading ? 'Actualizando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    )
}