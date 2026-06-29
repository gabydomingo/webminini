import type { Metadata } from "next";
import { supabase } from "../../lib/supabase";
import PropertyDetailClient from "./PropertyDetailClient";

export const revalidate = 120;

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await params; // ✅ await aquí

    const { data: propiedad } = await supabase
        .from("properties")
        .select("title, operation_type, property_type, localidad, price, currency")
        .eq("id", id)
        .single();

    if (!propiedad) {
        return {
            title: "Propiedad no encontrada",
            description: "Esta propiedad no existe o fue dada de baja.",
        };
    }

    const precio = propiedad.price
        ? `U$S ${propiedad.price.toLocaleString("es-AR")}`
        : "Consultar valor";

    return {
        title: `${propiedad.property_type} en ${propiedad.operation_type} — ${propiedad.localidad}`,
        description: `${propiedad.property_type} en ${propiedad.operation_type} en ${propiedad.localidad}. ${precio}. Consultá con Minini Propiedades.`,
        openGraph: {
            title: `${propiedad.property_type} en ${propiedad.localidad} | Minini`,
            url: `/propiedades/${id}`,
        },
    };
}

export default async function PropertyDetailPage(
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // ✅ await aquí también
    return <PropertyDetailClient id={id} />;
}