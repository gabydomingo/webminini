import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import MapaCliente from "./MapaCliente";
import type { Metadata } from "next";
import type { PropiedadEnMapa } from "../components/MapaPropiedades";

// Red de seguridad diaria. El refresco real lo dispara el panel a través de
// /api/revalidar cuando se toca una propiedad, así que los 5 minutos de
// antes solo servían para consultar Supabase de más.
export const revalidate = 86400;

export const metadata: Metadata = {
    title: "Mapa de Propiedades | Minini",
    description:
        "Mirá todas nuestras propiedades ubicadas en el mapa del Partido de la Costa: San Bernardo, Mar de Ajó, La Lucila del Mar, Costa Azul y alrededores.",
};

export default async function MapaPage() {
    // Traemos solo las columnas que el mapa usa. `description` pesa mucho
    // y acá no se muestra, así que queda afuera a propósito.
    const { data } = await supabase
        .from("properties")
        .select(
            "id, title, price, currency, operation_type, property_type, localidad, location, latitude, longitude, status, images"
        )
        .in("status", ["disponible", "reservado", "vendido"])
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        // Desempate por id: sin un orden total, dos propiedades con el mismo
        // created_at pueden alternarse entre regeneraciones. Eso cambia el HTML
        // sin que haya cambiado ningun dato, y Vercel cobra la escritura ISR
        // entera (solo se saltea la escritura si la pagina sale identica).
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });

    // El mapa dibuja UNA sola miniatura por punto (la del hover), pero la
    // consulta devuelve el array entero de fotos de cada propiedad. Medido
    // sobre el build anterior: 2.939 URLs de Supabase dentro del HTML de
    // esta página para usar 150. Eran ~350 KB que viajaban al visitante
    // para nada, y que además se escriben en el caché ISR cada vez que la
    // página se regenera (Vercel cobra por bytes escritos, 8 KB por unidad).
    //
    // Es el mismo recorte que ya hacía /propiedades; acá se había quedado
    // sin hacer. Si algún día el mapa muestra más de una foto, alcanza con
    // ampliar el slice.
    const propiedades: PropiedadEnMapa[] = (data || []).map((p) => ({
        ...p,
        images: Array.isArray(p.images) && p.images.length ? [p.images[0]] : [],
    }));

    return (
        <div className="bg-background min-h-screen transition-colors duration-300">
            <Header />

            <div className="pt-28 pb-6 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-serif font-black text-foreground">
                        Mapa de propiedades
                    </h1>
                    <p className="text-foreground/60 mt-2 font-sans text-sm md:text-base max-w-2xl">
                        Todas nuestras propiedades ubicadas en el Partido de la Costa. Pasá el
                        mouse por un punto para ver la propiedad, y hacé clic para abrirla.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                <div className="h-[65vh] md:h-[75vh] w-full rounded-2xl overflow-hidden border border-border-card shadow-lg relative">
                    <MapaCliente propiedades={propiedades} />
                </div>

                <p className="text-foreground/40 text-xs mt-3 font-sans">
                    Las propiedades sin ubicación cargada no aparecen en el mapa. Se pueden
                    agregar desde el panel, en el campo de coordenadas de cada propiedad.
                </p>
            </div>
        </div>
    );
}
