"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase"; // Ajustá esta ruta si es diferente
import Header from "../../components/Header";
import { Property } from "../../types";
import dynamic from 'next/dynamic';

// ─── Componente del Mapa ──────────────────────────────────────────────────────
const MapViewer = dynamic(() => import('../../components/MapViewer'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 font-medium">Cargando mapa...</div>
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price: number | null, currency: string) {
    if (!price) return "Consultar valor";
    return `${currency} ${price.toLocaleString("es-AR")}`;
}

// ─── Mini Tarjeta para Propiedades Similares ─────────────────────────────────
function MiniPropertyCard({ property }: { property: Property }) {
    const img = property.images?.[0] ?? null;
    return (
        <Link href={`/propiedades/${property.id}`} className="group block shrink-0 w-64 md:w-72">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="relative h-40 overflow-hidden">
                    {img ? (
                        <Image src={img} alt={property.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                        <div className="w-full h-full bg-gray-200" />
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded">
                        {formatPrice(property.price, property.currency)}
                    </div>
                </div>
                <div className="p-3">
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-[#8B1A1A]">{property.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{property.property_type} en {property.operation_type}</p>
                </div>
            </div>
        </Link>
    );
}

// ─── Página Individual de Propiedad ───────────────────────────────────────────
export default function PropertyDetailPage() {
    const { id } = useParams();
    const [property, setProperty] = useState<Property | null>(null);
    const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados para el formulario de contacto
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Estados para el Visor de Fotos (Lightbox)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            // 1. Buscar la propiedad actual
            const { data: currentProp, error } = await supabase
                .from('properties')
                .select('*')
                .eq('id', id)
                .single();

            if (!error && currentProp) {
                setProperty(currentProp as Property);
                setFormData(prev => ({
                    ...prev,
                    message: `Hola, quiero recibir más información sobre la propiedad "${currentProp.title}" en ${currentProp.localidad}.`
                }));

                // 2. Buscar propiedades similares en la misma localidad (máximo 4)
                const { data: similar } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('localidad', currentProp.localidad)
                    .eq('status', 'disponible')
                    .neq('id', currentProp.id) // Excluimos la actual
                    .limit(6);

                if (similar) setSimilarProperties(similar as Property[]);
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    // Bloquear scroll del body cuando el lightbox está abierto
    useEffect(() => {
        if (isLightboxOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isLightboxOpen]);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const { error } = await supabase.from('inquiries').insert([
                {
                    property_id: id,
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    message: formData.message
                }
            ]);

            if (error) throw error;
            setSubmitStatus('success');
            setFormData(prev => ({ ...prev, name: '', phone: '', email: '' }));
            setTimeout(() => setSubmitStatus('idle'), 5000);
        } catch (error) {
            console.error('Error al enviar consulta:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Funciones del Lightbox
    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setIsLightboxOpen(true);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === (property?.images?.length || 1) - 1 ? 0 : prev + 1));
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === 0 ? (property?.images?.length || 1) - 1 : prev - 1));
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf7f2] flex flex-col pt-28">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#8B1A1A] rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-[#faf7f2] flex flex-col pt-28 text-center px-4">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-3xl font-bold text-[#2a1f1a] mb-4">Propiedad no encontrada</h2>
                    <p className="text-gray-600 mb-8">La propiedad que buscás no existe o fue dada de baja.</p>
                    <Link href="/propiedades" className="bg-[#8B1A1A] text-white px-6 py-3 rounded-lg font-bold">
                        Volver al catálogo
                    </Link>
                </div>
            </div>
        );
    }

    const images = property.images && property.images.length > 0 ? property.images : [];
    const mainImage = images[0];

    let parsedFeatures: string[] = [];
    if (property.features) {
        if (Array.isArray(property.features)) {
            parsedFeatures = property.features;
        } else if (typeof property.features === 'string') {
            parsedFeatures = property.features.split(',').map(f => f.trim()).filter(f => f !== '');
        }
    }

    const lat = property.latitude ? Number(property.latitude) : null;
    const lng = property.longitude ? Number(property.longitude) : null;

    const WA_NUMBER = "5492257307064";
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const waMessage = encodeURIComponent(`Hola! Estoy interesado en esta propiedad:\n\n${property.title} (${property.operation_type})\n${currentUrl}`);

    return (
        <div className="bg-[#faf7f2] min-h-screen pb-20 pt-28">
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* ── BREADCRUMBS ── */}
                <div className="mb-6 flex items-center text-sm text-gray-500 font-medium">
                    <Link href="/propiedades" className="hover:text-[#8B1A1A] transition-colors">Propiedades</Link>
                    <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    <span className="text-gray-900">{property.operation_type} en {property.localidad}</span>
                </div>

                {/* ── GALERÍA DE IMÁGENES ── */}
                {images.length > 0 ? (
                    <div className="relative rounded-2xl mb-10 h-[40vh] md:h-[50vh] lg:h-[60vh]">

                        {/* Desktop: scroll horizontal con drag */}
                        <div
                            className="hidden md:flex h-full rounded-2xl overflow-x-scroll snap-x snap-mandatory gap-2 bg-black"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                            ref={(el) => {
                                if (!el) return;
                                // Drag to scroll
                                let isDown = false, startX = 0, scrollLeft = 0;
                                el.onmousedown = (e) => { isDown = true; el.style.cursor = 'grabbing'; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; };
                                el.onmouseleave = () => { isDown = false; el.style.cursor = 'grab'; };
                                el.onmouseup = () => { isDown = false; el.style.cursor = 'grab'; };
                                el.onmousemove = (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; el.scrollLeft = scrollLeft - (x - startX) * 1.5; };
                                el.style.cursor = 'grab';
                            }}
                        >
                            <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />

                            {Array.from({ length: Math.ceil(images.length / 5) }).map((_, groupIndex) => {
                                const groupImages = images.slice(groupIndex * 5, groupIndex * 5 + 5);
                                return (
                                    <div
                                        key={groupIndex}
                                        className="grid grid-cols-4 grid-rows-2 h-full gap-2 shrink-0 snap-start overflow-hidden rounded-2xl"
                                        style={{ width: '100%', minWidth: '100%' }}
                                    >
                                        <div className="col-span-2 row-span-2 relative">
                                            {groupImages[0] && (
                                                <Image src={groupImages[0]} alt={`Foto ${groupIndex * 5 + 1}`} fill className="object-cover hover:opacity-90 transition-opacity cursor-pointer" onClick={() => openLightbox(groupIndex * 5)} />
                                            )}
                                        </div>
                                        {[1, 2, 3, 4].map((offset) => (
                                            <div key={offset} className="col-span-1 row-span-1 relative">
                                                {groupImages[offset] ? (
                                                    <Image src={groupImages[offset]} alt={`Foto ${groupIndex * 5 + offset + 1}`} fill className="object-cover hover:opacity-90 transition-opacity cursor-pointer" onClick={() => openLightbox(groupIndex * 5 + offset)} />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-900" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile: carrusel simple */}
                        <div
                            className="md:hidden flex h-full rounded-2xl overflow-x-scroll snap-x snap-mandatory bg-black"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {images.map((img, index) => (
                                <div key={index} className="relative h-full w-full shrink-0 snap-center cursor-pointer" onClick={() => openLightbox(index)}>
                                    <Image src={img} alt={`Foto ${index + 1}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => openLightbox(0)}
                            className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-white hover:scale-105 transition-all border border-gray-200 z-10"
                        >
                            Ver las {images.length} fotos
                        </button>
                    </div>
                ) : (
                    <div className="h-[40vh] bg-gray-200 rounded-2xl mb-10 flex items-center justify-center">
                        <span className="text-gray-400 font-bold">Sin imágenes</span>
                    </div>
                )}

                {/* ── CUERPO PRINCIPAL Y SIDEBAR ── */}
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* ── COLUMNA IZQUIERDA (Detalles) ── */}
                    <div className="flex-1 min-w-0">

                        {/* Encabezado: Título y Precio unidos */}
                        <div className="mb-8 border-b border-gray-200 pb-8">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-widest rounded-md mb-3">
                                        {property.property_type} en {property.operation_type}
                                    </span>
                                    <h1 className="text-3xl md:text-4xl font-bold text-[#2a1f1a]" style={{ fontFamily: "'Georgia', serif" }}>
                                        {property.title}
                                    </h1>
                                </div>
                                <div className="md:text-right shrink-0">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                        Precio
                                    </span>
                                    <h2 className="text-4xl font-bold text-[#8B1A1A]">
                                        {formatPrice(property.price, property.currency)}
                                    </h2>
                                </div>
                            </div>

                            <p className="flex items-center gap-2 text-gray-500 font-medium">
                                <svg className="w-5 h-5 text-[#8B1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                {property.location}, {property.localidad}
                            </p>
                        </div>

                        {/* Ficha Resumen (Íconos) */}
                        <div className="flex flex-wrap gap-4 md:gap-8 mb-10 py-6 px-2 bg-white rounded-xl shadow-sm border border-gray-100 justify-around">

                            {(property.environments !== undefined && property.environments > 0) && (
                                <>
                                    <div className="flex flex-col items-center justify-center text-center">
                                        {/* Icono de Ambientes mejorado (tipo plano/habitación) */}
                                        <svg className="w-7 h-7 text-[#8B1A1A] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 12h8m0 0v8m0-8V4"></path></svg>
                                        <span className="font-bold text-gray-900 text-lg">{property.environments}</span>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">Ambientes</span>
                                    </div>
                                    <div className="w-px h-12 bg-gray-200 hidden md:block"></div>
                                </>
                            )}

                            {(property.bedrooms !== undefined && property.bedrooms > 0) && (
                                <>
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <svg className="w-7 h-7 text-[#8B1A1A] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9V19M21 9V19M3 13H21M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2"></path></svg>
                                        <span className="font-bold text-gray-900 text-lg">{property.bedrooms}</span>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">Dormitorios</span>
                                    </div>
                                    <div className="w-px h-12 bg-gray-200 hidden md:block"></div>
                                </>
                            )}

                            {(property.bathrooms !== undefined && property.bathrooms > 0) && (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <svg className="w-7 h-7 text-[#8B1A1A] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 12h16M4 12V8a4 4 0 018 0M4 12v6h16v-6"></path></svg>
                                    <span className="font-bold text-gray-900 text-lg">{property.bathrooms}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">Baños</span>
                                </div>
                            )}
                        </div>

                        {/* Descripción */}
                        <div className="mb-10">
                            <h3 className="text-2xl font-bold text-[#2a1f1a] mb-4" style={{ fontFamily: "'Georgia', serif" }}>
                                Descripción
                            </h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-[15px]">
                                {property.description || "Esta propiedad no cuenta con una descripción detallada en este momento."}
                            </p>
                        </div>

                        {/* Características */}
                        {parsedFeatures.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-2xl font-bold text-[#2a1f1a] mb-6" style={{ fontFamily: "'Georgia', serif" }}>
                                    Características
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {parsedFeatures.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-[#8B1A1A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                            <span className="text-gray-700 font-medium capitalize">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ubicación / Mapa Más Grande */}
                        <div className="mb-16">
                            <h3 className="text-2xl font-bold text-[#2a1f1a] mb-6" style={{ fontFamily: "'Georgia', serif" }}>
                                Ubicación
                            </h3>
                            <div className="w-full h-[450px] bg-gray-200 rounded-xl overflow-hidden border border-gray-300 relative z-0 shadow-sm">
                                {lat && lng ? (
                                    <MapViewer lat={lat} lng={lng} />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-gray-500 font-medium bg-white px-4 py-2 rounded-lg shadow-sm">Ubicación exacta no especificada</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── CARRUSEL PROPIEDADES SIMILARES ── */}
                        {similarProperties.length > 0 && (
                            <div className="mb-10 pt-10 border-t border-gray-200">
                                <h3 className="text-2xl font-bold text-[#2a1f1a] mb-6" style={{ fontFamily: "'Georgia', serif" }}>
                                    Más opciones en {property.localidad}
                                </h3>
                                <div className="flex overflow-x-auto pb-6 gap-6 hide-scroll snap-x">
                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                        .hide-scroll::-webkit-scrollbar { display: none; }
                                        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                                    `}} />

                                    {similarProperties.map(prop => (
                                        <div key={prop.id} className="snap-start flex-shrink-0">
                                            <MiniPropertyCard property={prop} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ── COLUMNA DERECHA (Sidebar Pegajoso de Contacto) ── */}
                    <aside className="w-full lg:w-[380px] shrink-0">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-28">

                            {/* Cabecera del Formulario */}
                            <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center gap-4">
                                <div className="relative w-14 h-14 bg-white rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-sm flex items-center justify-center">
                                    <Image
                                        src="https://cvgnpyzgglrclzxxlbsp.supabase.co/storage/v1/object/public/FotosPagina/2.png"
                                        alt="Logo Inmobiliaria Minini"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Contactar con</p>
                                    <h4 className="font-bold text-gray-900 text-lg leading-tight">Asesor de ventas de Minini Propiedades</h4>
                                </div>
                            </div>

                            {/* Formulario */}
                            <div className="p-6">
                                {submitStatus === 'success' && (
                                    <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded text-sm text-green-800">
                                        ¡Consulta enviada! Nos pondremos en contacto a la brevedad.
                                    </div>
                                )}
                                {submitStatus === 'error' && (
                                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-800">
                                        Hubo un error al enviar el mensaje. Por favor, intentá nuevamente.
                                    </div>
                                )}

                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            placeholder="Nombre completo *"
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#8B1A1A] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleFormChange}
                                            placeholder="Teléfono *"
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#8B1A1A] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="Email *"
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#8B1A1A] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            name="message"
                                            required
                                            value={formData.message}
                                            onChange={handleFormChange}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#8B1A1A] transition-colors resize-none"
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#8B1A1A] hover:bg-[#6e1414] text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Enviando...' : 'Enviar consulta'}
                                    </button>
                                </form>

                                <div className="mt-5 flex items-center gap-4">
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-xs text-gray-400 font-bold uppercase">O mediante</span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <a
                                    href={`https://wa.me/${WA_NUMBER}?text=${waMessage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-5 w-full bg-white border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.87-2.053-.97-.297-.099-.511-.149-.722.149-.209.298-.769.969-.942 1.169-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.405-.881-.733-1.476-1.638-1.649-1.937-.173-.298-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.721-1.747-.988-2.392-.264-.625-.533-.541-.722-.553-.178-.011-.383-.013-.594-.013s-.549.074-.833.372c-.284.298-1.089 1.066-1.089 2.597 0 1.531 1.115 3.013 1.272 3.211.149.198 2.191 3.348 5.309 4.698 2.059.89 3.125.962 4.195.801 1.233-.186 3.791-1.546 4.321-3.037.53-1.49.53-2.766.372-3.036z" /></svg>
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    </aside>

                </div>
            </div>

            {/* ── LIGHTBOX (Visor Pantalla Completa) ── */}
            {isLightboxOpen && images.length > 0 && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm" onClick={() => setIsLightboxOpen(false)}>

                    {/* Botón Cerrar */}
                    <button className="absolute top-6 right-6 text-white hover:text-gray-300 z-[110] p-2" onClick={() => setIsLightboxOpen(false)}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>

                    {/* Contador */}
                    <div className="absolute top-6 left-6 text-white font-medium tracking-widest text-sm z-[110] bg-black/50 px-3 py-1 rounded-full">
                        {currentImageIndex + 1} / {images.length}
                    </div>

                    {/* Controles: Anterior */}
                    <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[110] p-4 bg-black/20 hover:bg-black/50 rounded-full transition-colors" onClick={prevImage}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                    </button>

                    {/* Imagen Grande */}
                    <div className="relative w-full h-full max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={images[currentImageIndex]}
                            alt={`Foto ${currentImageIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                        />
                    </div>

                    {/* Controles: Siguiente */}
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[110] p-4 bg-black/20 hover:bg-black/50 rounded-full transition-colors" onClick={nextImage}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </button>

                </div>
            )}
        </div>
    );
}