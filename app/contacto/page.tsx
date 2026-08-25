import type { Metadata } from "next";
import ContactoContent from "./ContactoContent";

// Esta página es de servidor únicamente para poder exportar `metadata`:
// Next no lo permite dentro de un archivo con "use client". Todo lo
// interactivo vive en ContactoContent.tsx, que sí es de cliente.
export const metadata: Metadata = {
    title: "Contacto",
    description:
        "Escribinos o visitanos. Inmobiliaria Minini en San Bernardo y Mar de Ajó: venta, alquiler y administración de propiedades en el Partido de la Costa.",
};

export default function Page() {
    return <ContactoContent />;
}
