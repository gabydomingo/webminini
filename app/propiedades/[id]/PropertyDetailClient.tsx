"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import { Property } from "../../types";
import dynamic from 'next/dynamic';

const MapViewer = dynamic(() => import('../../components/MapViewer'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-input animate-pulse flex items-center justify-center text-foreground/40 font-medium">Cargando mapa...</div>
});

function formatPrice(price: number | null, currency: string) {
    if (!price) return "Consultar valor";
    const symbol = currency === "USD" ? "U$S" : "$";
    return `${symbol} ${price.toLocaleString("es-AR")}`;
}

// ─── Mini Tarjeta para Propiedades Similares (Optimizada) ───────────────────
function MiniPropertyCard({ property }: { property: Property }) {
    const imgArray = Array.isArray(property.images) ? property.images : [];
    const img = imgArray.length > 0 ? imgArray[0] : null;

    return (
        <Link href={`/propiedades/${property.id}`} className="group block shrink-0 w-64 md:w-72">
            <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border-card hover:shadow-md transition-all">
                <div className="relative h-40 overflow-hidden bg-input">
                    {img && (
                        <Image
                            src={img}
                            alt={property.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform"
                        />
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded font-sans">
                        {formatPrice(property.price, property.currency)}
                    </div>
                </div>
                <div className="p-3">
                    <h4 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors font-serif">{property.title}</h4>
                    <p className="text-xs text-foreground/60 mt-1 font-sans">{property.property_type} en {property.operation_type}</p>
                </div>
            </div>
        </Link>
    );
}

export default function PropertyDetailClient({ id }: { id: string }) {
    const [property, setProperty] = useState<Property | null>(null);
    const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const sideGalleryRef = useRef<HTMLDivElement>(null);
    const similarCarouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            const { data: currentProp, error } = await supabase.from('properties').select('*').eq('id', id).single();
            if (!error && currentProp) {
                setProperty(currentProp as Property);
                setFormData(prev => ({ ...prev, message: `Hola, quiero recibir más información sobre la propiedad "${currentProp.title}" en ${currentProp.localidad}.` }));
                const { data: similar } = await supabase.from('properties').select('id, title, property_type, operation_type, price, currency, images').eq('localidad', currentProp.localidad).eq('status', 'disponible').neq('id', currentProp.id).limit(6);
                if (similar) setSimilarProperties(similar as Property[]);
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (isLightboxOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isLightboxOpen]);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true); setSubmitStatus('idle');
        try {
            const { error } = await supabase.from('inquiries').insert([{ property_id: id, name: formData.name, phone: formData.phone, email: formData.email, message: formData.message }]);
            if (error) throw error;
            setSubmitStatus('success');
            setFormData(prev => ({ ...prev, name: '', phone: '', email: '' }));
            setTimeout(() => setSubmitStatus('idle'), 5000);
        } catch (error) {
            console.error('Error al enviar consulta:', error);
            setSubmitStatus('error');
        } finally { setIsSubmitting(false); }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const openLightbox = (index: number) => { setCurrentImageIndex(index); setIsLightboxOpen(true); };
    const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); const t = Array.isArray(property?.images) ? property.images.length : 1; setCurrentImageIndex(p => p === t - 1 ? 0 : p + 1); };
    const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); const t = Array.isArray(property?.images) ? property.images.length : 1; setCurrentImageIndex(p => p === 0 ? t - 1 : p - 1); };
    const scrollSideGallery = (direction: 'up' | 'down') => { if (sideGalleryRef.current) sideGalleryRef.current.scrollBy({ top: direction === 'up' ? -250 : 250, behavior: 'smooth' }); };
    const scrollSimilar = (direction: 'left' | 'right') => { if (similarCarouselRef.current) similarCarouselRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' }); };

    if (loading) return <div className="min-h-screen bg-background flex flex-col pt-28 transition-colors duration-300"><Header /><div className="flex-1 flex items-center justify-center"><div className="w-12 h-12 border-4 border-input border-t-primary rounded-full animate-spin"></div></div></div>;
    if (!property) return <div className="min-h-screen bg-background flex flex-col pt-28 text-center px-4 transition-colors duration-300"><Header /><div className="flex-1 flex flex-col items-center justify-center"><h2 className="text-3xl font-bold text-foreground mb-4 font-serif">Propiedad no encontrada</h2><Link href="/propiedades" className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-bold font-sans transition-colors">Volver al catálogo</Link></div></div>;

    const images = Array.isArray(property.images) ? property.images : [];
    const mainImage = images.length > 0 ? images[0] : null;
    const sideImages = images.slice(1);
    let parsedFeatures: string[] = [];
    if (property.features) { if (Array.isArray(property.features)) parsedFeatures = property.features; else if (typeof property.features === 'string') parsedFeatures = property.features.split(',').map(f => f.trim()).filter(f => f !== ''); }
    const lat = property.latitude ? Number(property.latitude) : null;
    const lng = property.longitude ? Number(property.longitude) : null;
    const WA_NUMBER = "5492257307064";
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const waMessage = encodeURIComponent(`Hola! Estoy interesado en esta propiedad:\n\n${property.title} (${property.operation_type})\n${currentUrl}`);

    return (
        <div className="bg-background min-h-screen pb-20 pt-28 transition-colors duration-300">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="mb-6 flex items-center text-sm text-foreground/50 font-medium font-sans">
                    <Link href="/propiedades" className="hover:text-primary transition-colors">Propiedades</Link>
                    <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    <span className="text-foreground/90">{property.operation_type} en {property.localidad}</span>
                </div>

                {images.length > 0 && mainImage ? (
                    <div className="relative mb-10 h-[50vh] md:h-[60vh] lg:h-[70vh] flex gap-2">
                        <div className="relative flex-[2] md:flex-[3] h-full rounded-2xl overflow-hidden cursor-pointer group bg-input" onClick={() => openLightbox(0)}>
                            <Image src={mainImage} alt="Foto principal" fill sizes="(max-width: 768px) 100vw, 75vw" className="object-cover transition-transform duration-500 group-hover:scale-105" priority />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                        </div>
                        {sideImages.length > 0 && (
                            <div className="relative flex-1 hidden sm:flex flex-col h-full overflow-hidden">
                                {sideImages.length > 2 && <button onClick={() => scrollSideGallery('up')} className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-card/90 backdrop-blur text-foreground rounded-full flex items-center justify-center shadow-md hover:text-primary transition-all border border-border-card"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"></path></svg></button>}
                                <div ref={sideGalleryRef} className="flex flex-col gap-2 h-full overflow-y-auto snap-y snap-mandatory hide-scroll pb-12" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    <style dangerouslySetInnerHTML={{ __html: `.hide-scroll::-webkit-scrollbar { display: none; }` }} />
                                    {sideImages.map((img, idx) => (
                                        <div key={idx} className="relative w-full h-[50%] shrink-0 snap-center rounded-2xl overflow-hidden cursor-pointer group bg-input" onClick={() => openLightbox(idx + 1)}>
                                            {/* 👇 OPTIMIZACIÓN: Las fotos de la barra lateral son chicas y lazy */}
                                            <Image src={img} alt={`Foto ${idx + 2}`} fill sizes="(max-width: 768px) 0vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" unoptimized />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                                        </div>
                                    ))}
                                </div>
                                {sideImages.length > 2 && <button onClick={() => scrollSideGallery('down')} className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-card/90 backdrop-blur text-foreground rounded-full flex items-center justify-center shadow-md hover:text-primary transition-all border border-border-card"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg></button>}
                            </div>
                        )}
                        <button onClick={() => openLightbox(0)} className="absolute bottom-6 right-6 sm:right-[calc(25%+1.5rem)] md:right-[calc(25%+1.5rem)] bg-card/95 backdrop-blur-sm text-foreground px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-all border border-border-card z-20 flex items-center gap-2 font-sans"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>Ver {images.length} fotos</button>
                    </div>
                ) : (
                    <div className="h-[40vh] bg-input rounded-2xl mb-10 flex items-center justify-center"><span className="text-foreground/40 font-bold font-sans">Sin imágenes</span></div>
                )}

                <div className="flex flex-col lg:flex-row gap-10 pb-10">
                    <div className="flex-1 min-w-0">
                        <div className="mb-8 border-b border-border-card pb-8">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div><span className="inline-block px-3 py-1 bg-input text-foreground/70 text-xs font-bold uppercase tracking-widest rounded-md mb-3 font-sans">{property.property_type} en {property.operation_type}</span><h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">{property.title}</h1></div>
                                <div className="md:text-right shrink-0"><span className="text-xs font-bold text-foreground/50 uppercase tracking-widest block mb-1 font-sans">Precio</span><h2 className="text-4xl font-bold text-primary font-sans">{formatPrice(property.price, property.currency)}</h2></div>
                            </div>
                            <p className="flex items-center gap-2 text-foreground/60 font-medium font-sans"><svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>{property.location}, {property.localidad}</p>
                        </div>
                        <div className="flex flex-wrap gap-4 md:gap-8 mb-10 py-6 px-2 bg-card rounded-xl shadow-sm border border-border-card justify-around font-sans">
                            {(property.environments !== undefined && property.environments > 0) && (<><div className="flex flex-col items-center justify-center text-center"><svg className="w-7 h-7 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 12h8m0 0v8m0-8V4"></path></svg><span className="font-bold text-foreground text-lg">{property.environments}</span><span className="text-xs text-foreground/60 uppercase tracking-widest font-semibold mt-1">Ambientes</span></div><div className="w-px h-12 bg-border-card hidden md:block"></div></>)}
                            {(property.bedrooms !== undefined && property.bedrooms > 0) && (<><div className="flex flex-col items-center justify-center text-center"><svg className="w-7 h-7 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9V19M21 9V19M3 13H21M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2"></path></svg><span className="font-bold text-foreground text-lg">{property.bedrooms}</span><span className="text-xs text-foreground/60 uppercase tracking-widest font-semibold mt-1">Dormitorios</span></div><div className="w-px h-12 bg-border-card hidden md:block"></div></>)}
                            {(property.bathrooms !== undefined && property.bathrooms > 0) && (<div className="flex flex-col items-center justify-center text-center"><svg className="w-7 h-7 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 12h16M4 12V8a4 4 0 018 0M4 12v6h16v-6"></path></svg><span className="font-bold text-foreground text-lg">{property.bathrooms}</span><span className="text-xs text-foreground/60 uppercase tracking-widest font-semibold mt-1">Baños</span></div>)}
                        </div>
                        <div className="mb-10"><h3 className="text-2xl font-bold text-foreground mb-4 font-serif">Descripción</h3><p className="text-foreground/80 leading-relaxed whitespace-pre-line text-[15px] font-sans">{property.description || "Esta propiedad no cuenta con una descripción detallada en este momento."}</p></div>
                        {parsedFeatures.length > 0 && (<div className="mb-10"><h3 className="text-2xl font-bold text-foreground mb-6 font-serif">Características</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-sans">{parsedFeatures.map((feat, idx) => (<div key={idx} className="flex items-center gap-3"><svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg><span className="text-foreground/80 font-medium capitalize">{feat}</span></div>))}</div></div>)}
                        <div className="mb-16"><h3 className="text-2xl font-bold text-foreground mb-6 font-serif">Ubicación</h3><div className="w-full h-[450px] bg-input rounded-xl overflow-hidden border border-border-card relative z-0 shadow-sm">{lat && lng ? <MapViewer lat={lat} lng={lng} /> : <div className="absolute inset-0 flex items-center justify-center"><span className="text-foreground/50 font-medium bg-card px-4 py-2 rounded-lg shadow-sm font-sans border border-border-card">Ubicación exacta no especificada</span></div>}</div></div>
                    </div>
                    <aside className="w-full lg:w-[380px] shrink-0 relative font-sans">
                        <div className="bg-card rounded-2xl shadow-xl border border-border-card overflow-hidden sticky top-28 z-10">
                            <div className="bg-input border-b border-border-card p-6 flex items-center gap-4">
                                <div className="relative w-14 h-14 bg-white rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-sm flex items-center justify-center"><Image src="https://cvgnpyzgglrclzxxlbsp.supabase.co/storage/v1/object/public/FotosPagina/2.png" alt="Logo Inmobiliaria Minini" fill className="object-cover" unoptimized /></div>
                                <div><p className="text-xs text-foreground/50 uppercase tracking-widest font-bold mb-1">Contactar con</p><h4 className="font-bold text-foreground text-lg leading-tight">Asesor de ventas de Minini Propiedades</h4></div>
                            </div>
                            <div className="p-6">
                                {submitStatus === 'success' && <div className="mb-4 bg-green-500/10 border-l-4 border-green-500 p-4 rounded text-sm text-green-700 dark:text-green-400">¡Consulta enviada! Nos pondremos en contacto a la brevedad.</div>}
                                {submitStatus === 'error' && <div className="mb-4 bg-red-500/10 border-l-4 border-red-500 p-4 rounded text-sm text-red-700 dark:text-red-400">Hubo un error al enviar el mensaje. Por favor, intentá nuevamente.</div>}
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <input type="text" name="name" required value={formData.name} onChange={handleFormChange} placeholder="Nombre completo *" className="w-full px-4 py-3 bg-input border border-border-input rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                                    <input type="tel" name="phone" required value={formData.phone} onChange={handleFormChange} placeholder="Teléfono *" className="w-full px-4 py-3 bg-input border border-border-input rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                                    <input type="email" name="email" required value={formData.email} onChange={handleFormChange} placeholder="Email *" className="w-full px-4 py-3 bg-input border border-border-input rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                                    <textarea name="message" required value={formData.message} onChange={handleFormChange} rows={4} className="w-full px-4 py-3 bg-input border border-border-input rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
                                    <button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Enviando...' : 'Enviar consulta'}</button>
                                </form>
                                <div className="mt-5 flex items-center gap-4"><div className="flex-1 h-px bg-border-card"></div><span className="text-xs text-foreground/40 font-bold uppercase">O mediante</span><div className="flex-1 h-px bg-border-card"></div></div>
                                <a href={`https://wa.me/${WA_NUMBER}?text=${waMessage}`} target="_blank" rel="noopener noreferrer" className="mt-5 w-full bg-card border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.87-2.053-.97-.297-.099-.511-.149-.722.149-.209.298-.769.969-.942 1.169-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.405-.881-.733-1.476-1.638-1.649-1.937-.173-.298-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.721-1.747-.988-2.392-.264-.625-.533-.541-.722-.553-.178-.011-.383-.013-.594-.013s-.549.074-.833.372c-.284.298-1.089 1.066-1.089 2.597 0 1.531 1.115 3.013 1.272 3.211.149.198 2.191 3.348 5.309 4.698 2.059.89 3.125.962 4.195.801 1.233-.186 3.791-1.546 4.321-3.037.53-1.49.53-2.766.372-3.036z" /></svg>WhatsApp</a>
                            </div>
                        </div>
                    </aside>
                </div>

                {similarProperties.length > 0 && (
                    <div className="pt-10 border-t border-border-card">
                        <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-bold text-foreground font-serif">Más opciones en {property.localidad}</h3><div className="hidden md:flex gap-2"><button onClick={() => scrollSimilar('left')} className="w-10 h-10 rounded-full border border-border-card flex items-center justify-center text-foreground/60 hover:bg-primary hover:text-white hover:border-primary transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button><button onClick={() => scrollSimilar('right')} className="w-10 h-10 rounded-full border border-border-card flex items-center justify-center text-foreground/60 hover:bg-primary hover:text-white hover:border-primary transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button></div></div>
                        <div ref={similarCarouselRef} className="flex overflow-x-auto pb-6 gap-6 hide-scroll snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <style dangerouslySetInnerHTML={{ __html: `.hide-scroll::-webkit-scrollbar { display: none; }` }} />
                            {similarProperties.map(prop => <div key={prop.id} className="snap-start flex-shrink-0"><MiniPropertyCard property={prop} /></div>)}
                        </div>
                    </div>
                )}
            </div>

            {isLightboxOpen && images.length > 0 && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm" onClick={() => setIsLightboxOpen(false)}>
                    <button className="absolute top-6 right-6 text-white hover:text-gray-300 z-[110] p-2" onClick={() => setIsLightboxOpen(false)}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    <div className="absolute top-6 left-6 text-white font-medium tracking-widest text-sm z-[110] bg-black/50 px-3 py-1 rounded-full font-sans">{currentImageIndex + 1} / {images.length}</div>
                    <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[110] p-4 bg-black/20 hover:bg-black/50 rounded-full transition-colors" onClick={prevImage}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg></button>
                    <div className="relative w-full h-full max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {images[currentImageIndex] && <Image src={images[currentImageIndex]} alt={`Foto ${currentImageIndex + 1}`} fill className="object-contain" sizes="100vw" unoptimized />}
                    </div>
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-[110] p-4 bg-black/20 hover:bg-black/50 rounded-full transition-colors" onClick={nextImage}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg></button>
                </div>
            )}
        </div>
    );
}