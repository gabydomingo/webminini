// ============================================================
//  Operaciones concretadas
// ============================================================
//  Tenía el mismo problema que la ficha de propiedad: el contenido lo
//  traía un useEffect del lado del cliente. Una consulta a Supabase por
//  cada visita, sin caché, y una página que para Google estaba vacía.
//
//  Ahora los datos se leen acá y la página se sirve ya armada. El
//  ordenamiento y la paginación siguen siendo del cliente, que es donde
//  corresponden: no hacen falta datos nuevos para eso.
// ============================================================

import type { Metadata } from "next";
import { supabase } from "../lib/supabase";
import ConcretadasContent from "./ConcretadasContent";

// Red de seguridad. El refresco real lo dispara el panel vía /api/revalidar.
export const revalidate = 86400;

export const metadata: Metadata = {
    title: "Operaciones Concretadas",
    description:
        "Propiedades que ya vendimos o alquilamos en San Bernardo, Mar de Ajó y el Partido de la Costa. Más de 20 años acompañando operaciones.",
    alternates: { canonical: "/concretadas" },
};

export default async function Page() {
    // Solo las columnas que se muestran. Antes era select('*'), que traía la
    // descripción completa y las ~19 URLs de fotos de cada propiedad para
    // dibujar tarjetas que usan una sola.
    const { data } = await supabase
        .from("properties")
        .select(
            "id, title, price, currency, operation_type, property_type, localidad, location, bedrooms, bathrooms, environments, images, status, created_at"
        )
        .in("status", ["vendido", "alquilado", "reservado"])
        .order("created_at", { ascending: false });

    // La tarjeta usa la primera foto y nada más: el resto del array serían
    // kilobytes de URLs viajando al navegador para no usarse.
    const propiedades = (data ?? []).map((p) => ({
        ...p,
        images: Array.isArray(p.images) && p.images.length ? [p.images[0]] : [],
    }));

    return <ConcretadasContent propiedades={propiedades} />;
}
