"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function WhatsAppFloating() {
    const pathname = usePathname();

    // Ocultamos el botón flotante en la misma ruta de backoffice
    if (pathname?.startsWith("/admin") || pathname?.includes("/administracion/")) {
        return null;
    }

    const phoneNumber = "5492257309051"; // Formato internacional para Argentina
    const message = encodeURIComponent("Hola! Vengo de su página web y me gustaría realizar una consulta.");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[99] group"
            aria-label="Contactar por WhatsApp"
        >
            {/* Tooltip opcional que aparece al hacer hover */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border-card text-foreground text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none font-sans">
                ¿En qué podemos ayudarte?
            </span>

            {/* Botón Circular con Pulso */}
            <div className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:scale-110 hover:shadow-[0_8px_25px_rgba(37,211,102,0.4)] transition-all duration-300">

                {/* Efecto de onda animada */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 group-hover:opacity-0"></span>

                {/* Icono de WhatsApp (SVG) */}
                <svg
                    className="w-8 h-8 fill-white"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.87-2.053-.97-.297-.099-.511-.149-.722.149-.209.298-.769.969-.942 1.169-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.405-.881-.733-1.476-1.638-1.649-1.937-.173-.298-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.721-1.747-.988-2.392-.264-.625-.533-.541-.722-.553-.178-.011-.383-.013-.594-.013s-.549.074-.833.372c-.284.298-1.089 1.066-1.089 2.597 0 1.531 1.115 3.013 1.272 3.211.149.198 2.191 3.348 5.309 4.698 2.059.89 3.125.962 4.195.801 1.233-.186 3.791-1.546 4.321-3.037.53-1.49.53-2.766.372-3.036z" />
                </svg>
            </div>
        </a>
    );
}