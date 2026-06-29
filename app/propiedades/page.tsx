import { Suspense } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import PropiedadesContent from "./PropiedadesContent";
import type { Metadata } from "next";

export const revalidate = 120;

export const metadata: Metadata = {
    title: "Propiedades en Venta y Alquiler | Minini",
    description:
        "Explorá nuestro catálogo completo de casas, departamentos, dúplex y lotes en San Bernardo, Mar de Ajó y el Partido de la Costa.",
};

export default async function PropiedadesPage() {
    const [{ data: propData }, { data: optionsData }] = await Promise.all([
        supabase
            .from("properties")
            .select(
                "id, title, description, localidad, location, property_type, operation_type, features, environments, bedrooms, bathrooms, price, currency, images, created_at, provincia, latitude, longitude, status"
            )
            .eq("status", "disponible")
            .order("created_at", { ascending: false }),
        supabase.from("form_options").select("*"),
    ]);

    const properties = propData || [];

    const options: Record<string, string[]> = {};
    if (optionsData) {
        for (const curr of optionsData) {
            if (!options[curr.category]) options[curr.category] = [];
            if (!options[curr.category].includes(curr.value)) {
                options[curr.category].push(curr.value);
            }
        }
    }

    return (
        <div className="bg-background min-h-screen pb-20 pt-28 transition-colors duration-300">
            <Header />
            <Suspense
                fallback={
                    <div className="py-20 flex justify-center">
                        <div className="w-10 h-10 border-4 border-border-card border-t-primary rounded-full animate-spin"></div>
                    </div>
                }
            >
                <PropiedadesContent
                    initialProperties={properties}
                    initialOptions={options}
                />
            </Suspense>
        </div>
    );
}
