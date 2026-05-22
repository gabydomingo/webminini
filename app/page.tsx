import Image from "next/image";
import Link from "next/link";
import { supabase } from "./lib/supabase";
import SearchBar from "./components/SearchBar";
import Header from "./components/Header";
import SocialSection from "./components/SocialSection";
import PropertyCard from "./components/PropertyCard";
import type { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Propiedades en Venta y Alquiler en La Costa",
  description:
    "Explorá nuestro listado de casas, departamentos, dúplex y lotes en San Bernardo, Mar de Ajó y toda la Costa Atlántica. Filtrá por tipo, operación y ubicación.",
  openGraph: {
    title: "Propiedades en Venta y Alquiler en La Costa | Minini",
    description:
      "Casas, departamentos, dúplex y lotes en San Bernardo y Mar de Ajó.",
    url: "/propiedades",
  },
};

export default async function HomePage() {
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("is_featured", true)
    .neq("status", "oculto")
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
              Lo que buscás,
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
                contactar
              </Link>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-10 -mb-10">
            <SearchBar />
          </div>
        </section>

        {/* ── FEATURED PROPERTIES ──────────────────────────────────────────── */}
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
                className="flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-widest hover:gap-3 transition-all duration-200 font-sans"
              >
                Ver más
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-20 text-foreground/60 font-sans">
                <p className="text-lg">No hay propiedades destacadas en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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