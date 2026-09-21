// ============================================================
//  Ficha de propiedad — ahora se arma en el servidor
// ============================================================
//  ANTES: esta página no traía nada. Montaba un componente de cliente que
//  hacía `select('*')` dentro de un useEffect. Consecuencias:
//
//   · Supabase: 2 consultas en vivo por cada visita, sin caché. Era la
//     mayor fuente de consumo del proyecto, más que las fotos.
//   · Google: entraba a las ~100 URLs del sitemap y encontraba un spinner.
//     Precio, descripción, características y fotos no existían para el
//     buscador.
//   · Velocidad: la primera foto no podía ni empezar a bajarse hasta que
//     el navegador ejecutara el JS, hidratara y volviera de Supabase.
//
//  AHORA: los datos se leen acá, en el servidor, y las ~100 fichas se
//  generan en el build (`generateStaticParams`). Visitar una ficha no
//  consulta Supabase: sirve HTML ya armado. Cuando la clienta toca algo en
//  el panel, `/api/revalidar` regenera lo que corresponde.
//
//  De cliente quedan solo dos islas: la galería (por el lightbox) y el
//  formulario. Todo el resto es HTML que Google lee de una.
// ============================================================

import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { supabase } from "../../lib/supabase";
import { idDesdeRuta, rutaPropiedad, slugPropiedad } from "../../lib/slug";
import { urlMiniatura } from "../../lib/imagenes";
import Header from "../../components/Header";
import type { Property } from "../../types";

import Galeria from "./Galeria";
import FormularioConsulta from "./FormularioConsulta";
import UbicacionMapa from "./UbicacionMapa";

// Red de seguridad: si por lo que sea nunca llegara el aviso del panel, la
// página se refresca sola una vez por día. La actualización de verdad la
// dispara /api/revalidar en el momento en que se guarda un cambio.
export const revalidate = 86400;

const SITIO = "https://propiedadesminini.com";
const WA_NUMBER = "5492257307064";

const COLUMNAS_FICHA =
    "id, title, description, price, currency, operation_type, property_type, provincia, location, localidad, latitude, longitude, bedrooms, bathrooms, environments, features, status, images, created_at";

// ─── Acceso a datos ───────────────────────────────────────────────────────────

/**
 * `cache()` de React hace que generateMetadata y el componente compartan la
 * misma consulta en vez de pedir dos veces lo mismo.
 */
const traerPropiedad = cache(async (id: string): Promise<Property | null> => {
    const { data } = await supabase
        .from("properties")
        .select(COLUMNAS_FICHA)
        .eq("id", id)
        .neq("status", "oculto")
        .maybeSingle();

    return (data as Property) ?? null;
});

const traerSimilares = cache(async (localidad: string | null, id: string) => {
    if (!localidad) return [];
    const { data } = await supabase
        .from("properties")
        .select("id, title, property_type, operation_type, localidad, price, currency, images")
        .eq("localidad", localidad)
        .eq("status", "disponible")
        .neq("id", id)
        .limit(6);
    return data ?? [];
});

// ─── Generación estática ──────────────────────────────────────────────────────

/**
 * Una sola consulta en el build devuelve las rutas de todas las fichas, y
 * Next las prerenderiza. Una propiedad nueva que no estuvo en el build se
 * renderiza igual la primera vez que alguien entra, y después queda cacheada.
 */
export async function generateStaticParams() {
    const { data } = await supabase
        .from("properties")
        .select("id, title, property_type, operation_type, localidad")
        .neq("status", "oculto");

    return (data ?? []).map((p) => ({ id: slugPropiedad(p) }));
}

// ─── Metadatos ────────────────────────────────────────────────────────────────

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id: parametro } = await params;
    const id = idDesdeRuta(parametro);
    const propiedad = id ? await traerPropiedad(id) : null;

    if (!propiedad) {
        return {
            title: "Propiedad no encontrada",
            description: "Esta propiedad no existe o fue dada de baja.",
            robots: { index: false, follow: true },
        };
    }

    const precio = propiedad.price
        ? `${propiedad.currency === "USD" ? "U$S" : "$"} ${propiedad.price.toLocaleString("es-AR")}`
        : "Consultar valor";

    const titulo = `${propiedad.property_type} en ${propiedad.operation_type} — ${propiedad.localidad}`;
    const descripcion =
        `${propiedad.property_type} en ${propiedad.operation_type} en ${propiedad.localidad}. ${precio}. ` +
        (propiedad.description?.replace(/\s+/g, " ").trim().slice(0, 110) ||
            "Consultá con Minini Propiedades.");

    // La foto de la propiedad como vista previa. Antes toda ficha compartida
    // por WhatsApp salía sin imagen, o con el hero genérico de 1,9 MB.
    // Se manda la miniatura a propósito: pesa ~25 KB y WhatsApp descarta las
    // vistas previas pesadas.
    const fotos = Array.isArray(propiedad.images) ? propiedad.images : [];
    const portada = fotos.length ? urlMiniatura(fotos[0]) : undefined;

    return {
        title: titulo,
        description: descripcion,
        alternates: { canonical: rutaPropiedad(propiedad) },
        openGraph: {
            title: `${titulo} | Minini`,
            description: descripcion,
            url: rutaPropiedad(propiedad),
            type: "website",
            locale: "es_AR",
            images: portada ? [{ url: portada, alt: titulo }] : undefined,
        },
    };
}

// ─── Helpers de presentación ──────────────────────────────────────────────────

function formatPrice(price: number | null, currency: string) {
    if (!price) return "Consultar valor";
    const symbol = currency === "USD" ? "U$S" : "$";
    return `${symbol} ${price.toLocaleString("es-AR")}`;
}

function caracteristicas(features: Property["features"]): string[] {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    return features.split(",").map((f) => f.trim()).filter(Boolean);
}

// ─── Tarjeta de propiedad similar ─────────────────────────────────────────────

type Similar = {
    id: string;
    title: string;
    property_type: string;
    operation_type: string;
    localidad: string | null;
    price: number | null;
    currency: string;
    images: string[] | null;
};

function MiniPropertyCard({ property }: { property: Similar }) {
    const imgArray = Array.isArray(property.images) ? property.images : [];
    // La tarjeta se dibuja a ~290 px: pide la miniatura, no la foto grande.
    const img = imgArray.length > 0 ? urlMiniatura(imgArray[0]) : null;

    return (
        <Link href={rutaPropiedad(property)} className="group block shrink-0 w-64 md:w-72">
            <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border-card hover:shadow-md transition-all">
                <div className="relative h-40 overflow-hidden bg-input">
                    {img && (
                        <Image
                            src={img}
                            alt={`${property.property_type} en ${property.operation_type} — ${property.localidad ?? ""}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            loading="lazy"
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform"
                        />
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded font-sans">
                        {formatPrice(property.price, property.currency)}
                    </div>
                </div>
                <div className="p-3">
                    <h3 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors font-serif">
                        {property.title}
                    </h3>
                    <p className="text-xs text-foreground/70 mt-1 font-sans">
                        {property.property_type} en {property.operation_type}
                    </p>
                </div>
            </div>
        </Link>
    );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function PropertyDetailPage(
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: parametro } = await params;

    const id = idDesdeRuta(parametro);
    if (!id) notFound();

    const property = await traerPropiedad(id);
    if (!property) notFound();

    // Si entraron por una URL vieja (UUID pelado) o por un slug desactualizado,
    // los mandamos a la canónica con un 308. Google traspasa el posicionamiento
    // y los links que andan dando vueltas por WhatsApp siguen funcionando.
    const canonico = slugPropiedad(property);
    if (parametro !== canonico) permanentRedirect(`/propiedades/${canonico}`);

    const similares = (await traerSimilares(property.localidad, property.id)) as Similar[];

    const images = Array.isArray(property.images) ? property.images : [];
    const features = caracteristicas(property.features);
    const lat = property.latitude ? Number(property.latitude) : null;
    const lng = property.longitude ? Number(property.longitude) : null;

    const urlCanonica = `${SITIO}/propiedades/${canonico}`;
    const waMessage = encodeURIComponent(
        `Hola! Estoy interesado en esta propiedad:\n\n${property.title} (${property.operation_type})\n${urlCanonica}`
    );

    // ── Datos estructurados ──────────────────────────────────────────────
    // Le dicen a Google qué es esto: una publicación inmobiliaria con precio,
    // ambientes y ubicación, no un texto suelto. Antes el único JSON-LD del
    // sitio era el de la inmobiliaria, repetido igual en todas las páginas.
    const esAlquiler = /alquiler/i.test(property.operation_type || "");
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "RealEstateListing",
                "@id": urlCanonica,
                url: urlCanonica,
                name: property.title,
                description: property.description || undefined,
                datePosted: property.created_at || undefined,
                image: images.slice(0, 6),
                mainEntity: {
                    "@type": "Accommodation",
                    name: property.title,
                    numberOfRooms: property.environments || undefined,
                    numberOfBedrooms: property.bedrooms || undefined,
                    numberOfBathroomsTotal: property.bathrooms || undefined,
                    address: {
                        "@type": "PostalAddress",
                        streetAddress: property.location || undefined,
                        addressLocality: property.localidad || undefined,
                        addressRegion: property.provincia || "Buenos Aires",
                        addressCountry: "AR",
                    },
                    ...(lat && lng
                        ? { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng } }
                        : {}),
                },
                ...(property.price
                    ? {
                        offers: {
                            "@type": "Offer",
                            price: property.price,
                            priceCurrency: property.currency || "USD",
                            businessFunction: esAlquiler
                                ? "http://purl.org/goodrelations/v1#LeaseOut"
                                : "http://purl.org/goodrelations/v1#Sell",
                            availability:
                                property.status === "disponible"
                                    ? "https://schema.org/InStock"
                                    : "https://schema.org/OutOfStock",
                            seller: { "@type": "RealEstateAgent", name: "Minini Propiedades" },
                        },
                    }
                    : {}),
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Inicio", item: SITIO },
                    { "@type": "ListItem", position: 2, name: "Propiedades", item: `${SITIO}/propiedades` },
                    { "@type": "ListItem", position: 3, name: property.title, item: urlCanonica },
                ],
            },
        ],
    };

    return (
        <div className="bg-background min-h-screen pb-20 pt-28 transition-colors duration-300">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <nav aria-label="Migas de pan" className="mb-6 flex items-center text-sm text-foreground/70 font-medium font-sans">
                    <Link href="/propiedades" className="hover:text-primary transition-colors">
                        Propiedades
                    </Link>
                    <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-foreground/90">
                        {property.operation_type} en {property.localidad}
                    </span>
                </nav>

                <Galeria images={images} titulo={property.title} />

                <div className="flex flex-col lg:flex-row gap-10 pb-10">
                    <div className="flex-1 min-w-0">
                        <div className="mb-8 border-b border-border-card pb-8">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-input text-foreground/80 text-xs font-bold uppercase tracking-widest rounded-md mb-3 font-sans">
                                        {property.property_type} en {property.operation_type}
                                    </span>
                                    <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
                                        {property.title}
                                    </h1>
                                </div>
                                <div className="md:text-right shrink-0">
                                    <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest block mb-1 font-sans">
                                        Precio
                                    </span>
                                    <p className="text-4xl font-bold text-primary font-sans">
                                        {formatPrice(property.price, property.currency)}
                                    </p>
                                </div>
                            </div>
                            <p className="flex items-center gap-2 text-foreground/70 font-medium font-sans">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {property.location}, {property.localidad}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 md:gap-8 mb-10 py-6 px-2 bg-card rounded-xl shadow-sm border border-border-card justify-around font-sans">
                            {property.environments > 0 && (
                                <>
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <svg className="w-7 h-7 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 12h8m0 0v8m0-8V4" />
                                        </svg>
                                        <span className="font-bold text-foreground text-lg">{property.environments}</span>
                                        <span className="text-xs text-foreground/70 uppercase tracking-widest font-semibold mt-1">Ambientes</span>
                                    </div>
                                    <div className="w-px h-12 bg-border-card hidden md:block" />
                                </>
                            )}
                            {property.bedrooms > 0 && (
                                <>
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <svg className="w-7 h-7 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9V19M21 9V19M3 13H21M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2" />
                                        </svg>
                                        <span className="font-bold text-foreground text-lg">{property.bedrooms}</span>
                                        <span className="text-xs text-foreground/70 uppercase tracking-widest font-semibold mt-1">Dormitorios</span>
                                    </div>
                                    <div className="w-px h-12 bg-border-card hidden md:block" />
                                </>
                            )}
                            {property.bathrooms > 0 && (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <svg className="w-7 h-7 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 12h16M4 12V8a4 4 0 018 0M4 12v6h16v-6" />
                                    </svg>
                                    <span className="font-bold text-foreground text-lg">{property.bathrooms}</span>
                                    <span className="text-xs text-foreground/70 uppercase tracking-widest font-semibold mt-1">Baños</span>
                                </div>
                            )}
                        </div>

                        <div className="mb-10">
                            <h2 className="text-2xl font-bold text-foreground mb-4 font-serif">Descripción</h2>
                            <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-[15px] font-sans">
                                {property.description ||
                                    "Esta propiedad no cuenta con una descripción detallada en este momento."}
                            </p>
                        </div>

                        {features.length > 0 && (
                            <div className="mb-10">
                                <h2 className="text-2xl font-bold text-foreground mb-6 font-serif">Características</h2>
                                <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 font-sans">
                                    {features.map((feat, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-foreground/80 font-medium capitalize">{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mb-16">
                            <h2 className="text-2xl font-bold text-foreground mb-6 font-serif">Ubicación</h2>
                            <UbicacionMapa lat={lat} lng={lng} />
                        </div>
                    </div>

                    <aside className="w-full lg:w-[380px] shrink-0 relative font-sans">
                        <div className="bg-card rounded-2xl shadow-xl border border-border-card overflow-hidden sticky top-28 z-10">
                            <div className="bg-input border-b border-border-card p-6 flex items-center gap-4">
                                <div className="relative w-14 h-14 bg-white rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-sm flex items-center justify-center">
                                    <Image
                                        src="https://syqfekxxiztmlqydtgec.supabase.co/storage/v1/object/public/FotosPagina/2.png"
                                        alt="Logo Inmobiliaria Minini"
                                        fill
                                        sizes="56px"
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <div>
                                    <p className="text-xs text-foreground/70 uppercase tracking-widest font-bold mb-1">
                                        Contactar con
                                    </p>
                                    <p className="font-bold text-foreground text-lg leading-tight">
                                        Asesor de ventas de Minini Propiedades
                                    </p>
                                </div>
                            </div>

                            <div className="p-6">
                                <FormularioConsulta
                                    propiedadId={property.id}
                                    mensajeInicial={`Hola, quiero recibir más información sobre la propiedad "${property.title}" en ${property.localidad}.`}
                                />

                                <div className="mt-5 flex items-center gap-4">
                                    <div className="flex-1 h-px bg-border-card" />
                                    <span className="text-xs text-foreground/60 font-bold uppercase">O mediante</span>
                                    <div className="flex-1 h-px bg-border-card" />
                                </div>

                                <a
                                    href={`https://wa.me/${WA_NUMBER}?text=${waMessage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-5 w-full bg-card border-2 border-[#25D366] text-[#128C4A] dark:text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.87-2.053-.97-.297-.099-.511-.149-.722.149-.209.298-.769.969-.942 1.169-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.405-.881-.733-1.476-1.638-1.649-1.937-.173-.298-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.721-1.747-.988-2.392-.264-.625-.533-.541-.722-.553-.178-.011-.383-.013-.594-.013s-.549.074-.833.372c-.284.298-1.089 1.066-1.089 2.597 0 1.531 1.115 3.013 1.272 3.211.149.198 2.191 3.348 5.309 4.698 2.059.89 3.125.962 4.195.801 1.233-.186 3.791-1.546 4.321-3.037.53-1.49.53-2.766.372-3.036z" />
                                    </svg>
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>

                {similares.length > 0 && (
                    <div className="pt-10 border-t border-border-card">
                        <h2 className="text-2xl font-bold text-foreground font-serif mb-6">
                            Más opciones en {property.localidad}
                        </h2>
                        {/* Scroll horizontal nativo: se arrastra con el dedo en celular y con
                            shift+rueda en escritorio. Antes había dos botones que solo
                            funcionaban con mouse y no eran alcanzables por teclado. */}
                        <ul className="flex overflow-x-auto pb-6 gap-6 snap-x list-none">
                            {similares.map((prop) => (
                                <li key={prop.id} className="snap-start flex-shrink-0">
                                    <MiniPropertyCard property={prop} />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
