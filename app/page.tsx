import Image from "next/image";
import Link from "next/link";
import { supabase } from "./lib/supabase";
import SearchBar from "./components/SearchBar";
import Header from "./components/Header";
import SocialSection from "./components/SocialSection";
import PropertyCard from "./components/PropertyCard";
import type { Metadata } from "next";

export const revalidate = 60; //OPTIMIZACIÓN: Vercel cacheará la home por 60 segs. Reduce costos y es súper rápido.

// SEO: Optimizamos la meta descripción para Google
export const metadata: Metadata = {
  title: "Inmobiliaria Minini | Venta y Alquiler en La Costa",
  description:
    "Inmobiliaria Minini: Líderes en venta, alquiler y administración de propiedades en San Bernardo, Mar de Ajó y todo el Partido de la Costa.",
  keywords: ["Inmobiliaria Minini", "Minini Propiedades", "San Bernardo", "Mar de Ajó", "venta casas la costa", "alquileres la costa", "administracion de consorcios minini"],
  openGraph: {
    title: "Inmobiliaria Minini | San Bernardo y Mar de Ajó",
    description:
      "Encontrá casas, departamentos, dúplex y lotes en el Partido de la Costa con Inmobiliaria Minini.",
    url: "https://tudominio.com",
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
              alt="Inmobiliaria Minini - Venta y Alquiler de Propiedades" // 🚀 SEO: Mejor texto alternativo
              fill
              priority // 🚀 CRUCIAL para LCP rápido
              sizes="100vw" // 🚀 Le dice al navegador que esta imagen ocupa toda la pantalla
              quality={85} // Balance ideal entre peso y calidad visual
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
              Encontrá tu próxima propiedad en La Costa con la experiencia y confianza de la familia Minini.
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