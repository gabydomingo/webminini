import type { Metadata } from "next";
import ConcretadasContent from "./ConcretadasContent";

// Esta página es de servidor únicamente para poder exportar `metadata`:
// Next no lo permite dentro de un archivo con "use client". Todo lo
// interactivo vive en ConcretadasContent.tsx, que sí es de cliente.
export const metadata: Metadata = {
    title: "Operaciones Concretadas",
    description:
        "Propiedades que ya vendimos o alquilamos en San Bernardo, Mar de Ajó y el Partido de la Costa. Más de 20 años acompañando operaciones.",
};

export default function Page() {
    return <ConcretadasContent />;
}
