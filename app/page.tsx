import Image from "next/image";
import Link from "next/link";
import { supabase } from "./lib/supabase";
import SearchBar from "./components/SearchBar";
import Header from "./components/Header";
import SocialSection from "./components/SocialSection";
import { Property } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── PropertyCard Component ───────────────────────────────────────────────────
function PropertyCard({ property }: { property: Property }) {
  const img = property.images?.[0] ?? null;

  return (
    <Link href={`/propiedades/${property.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-52 overflow-hidden">
          {img ? (
            <Image
              src={img}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="p-4">
          {/* Aquí aplicamos font-serif (Aleo) y hover:text-primary */}
          <h3 className="font-serif font-bold text-foreground text-base leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
            {property.title}
          </h3>
          <p className="text-xs text-foreground/60 flex items-center gap-1 mb-3">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
            {property.location || 'Ubicación a consultar'}
          </p>

          <div className="flex items-center gap-4 text-xs text-foreground/70 border-t border-gray-100 pt-3">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h18v18H3z" />
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

// ─── Main Page Component (SSR) ────────────────────────────────────────────────
export default async function HomePage() {
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "disponible")
    .order("created_at", { ascending: false })
    .limit(6);

  const properties = data || [];

  return (
    <>
      <Header />

      <main>
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[88vh] flex flex-col">
          <div className="absolute inset-0">
            <Image
              src="https://cvgnpyzgglrclzxxlbsp.supabase.co/storage/v1/object/public/FotosPagina/heroprueba.png"
              alt="Hero"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6 lg:px-16 pt-10 pb-32 max-w-7xl mx-auto w-full">
            <h1 className="font-serif text-white text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-2xl mx-auto">
              Lo que buscas,
              <br />
              <span className="text-secondary">lo tenemos.</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-sans">
              Encontrá tu próxima propiedad con la experiencia y confianza de años en el mercado inmobiliario.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/propiedades"
                className="font-serif px-7 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm tracking-widest uppercase rounded-sm transition-all duration-200 shadow-lg active:scale-95"
              >
                Ver propiedades
              </Link>
              <Link
                href="/contacto"
                className="font-serif px-7 py-3.5 border-2 border-white/60 hover:border-white text-white font-semibold text-sm tracking-widest uppercase rounded-sm transition-all duration-200 backdrop-blur-sm hover:bg-white/10"
              >
                Ponte en contacto
              </Link>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-10 -mb-10">
            <SearchBar />
          </div>
        </section>

        {/* ── FEATURED PROPERTIES ──────────────────────────────────────────── */}
        {/* Cambiamos el color harcodeado por bg-background */}
        <section className="bg-background pt-24 pb-20 px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                  Propiedades destacadas
                </h2>
                <div className="mt-2 h-[3px] w-14 bg-primary rounded-full" />
              </div>
              <Link
                href="/propiedades"
                className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-widest hover:gap-3 transition-all duration-200"
              >
                Ver más
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-20 text-foreground/60">
                <p className="text-lg">No hay propiedades disponibles en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── SOCIAL Y VIDEOS ─────────────────────────────────────────────── */}
        <SocialSection />
      </main>
    </>
  );
}