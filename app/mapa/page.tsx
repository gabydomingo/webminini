import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import MapaCliente from "./MapaCliente";
import type { Metadata } from "next";
import type { PropiedadEnMapa } from "../components/MapaPropiedades";

// Se revalida cada 5 minutos: el mapa no necesita estar al segundo y así
// no consultamos la base en cada visita.
export const revalidate = 300;

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
        .order("created_at", { ascending: false });

    // El tipo lo define el propio componente: pedimos exactamente lo que usa.
    const propiedades: PropiedadEnMapa[] = data || [];

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
