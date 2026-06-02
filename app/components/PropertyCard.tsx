import Image from "next/image";
import Link from "next/link";
import { Property } from "../types";

// ─── Helpers locales ──────────────────────────────────────────────────────────
function formatPrice(price: number | null, currency: string) {
    if (!price) return "Consultar valor";
    const symbol = currency === "USD" ? "U$S" : "$";
    return `${symbol} ${price.toLocaleString("es-AR")}`;
}

function getStatusColor(op: string) {
    const opLower = op?.toLowerCase() || '';
    if (opLower.includes("alquiler")) return "bg-green-700 text-white";
    if (opLower.includes("pozo")) return "bg-blue-800 text-white";
    return "bg-primary text-white";
}

function deduplicateLocation(location: string | null): string {
    if (!location) return 'Ubicación a consultar';
    const parts = location.split(',').map(p => p.trim());
    const seen = new Set<string>();
    const unique = parts.filter(p => {
        const lower = p.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
    });
    return unique.join(', ');
}

export default function PropertyCard({ property }: { property: Property }) {
    const imgArray = Array.isArray(property.images) ? property.images : [];
    const img = imgArray.length > 0 ? imgArray[0] : null;

    return (
        <Link href={`/propiedades/${property.id}`} className="group block h-full">
            <div className="bg-card border border-border-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full">

                <div className="relative h-52 overflow-hidden shrink-0 bg-input">
                    {img ? (
                        <Image
                            src={img}
                            alt={property.title}
                            fill
                            // 👇 OPTIMIZACIÓN CLAVE: Le dice a Next.js qué ancho descargar según el dispositivo
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
                            </svg>
                        </div>
                    )}

                    <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${getStatusColor(property.operation_type)}`}>
                        {property.operation_type}
                    </span>

                    <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-lg">
                        {formatPrice(property.price, property.currency)}
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-serif font-bold text-foreground text-base leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {property.title}
                    </h3>

                    <p className="text-xs text-foreground/60 flex items-start gap-1 mb-3">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        </svg>
                        <span className="line-clamp-2">{deduplicateLocation(property.location)}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/70 border-t border-border-card pt-3 mt-auto">
                        {property.bedrooms > 0 && (
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9V19M21 9V19M3 13H21M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2" />
                                </svg>
                                {property.bedrooms}
                            </span>
                        )}
                        {property.bathrooms > 0 && (
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12h16M4 12V8a4 4 0 018 0M4 12v6h16v-6" />
                                </svg>
                                {property.bathrooms}
                            </span>
                        )}
                        {property.environments > 0 && (
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 12h8m0 0v8m0-8V4" />
                                </svg>
                                {property.environments} amb.
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}