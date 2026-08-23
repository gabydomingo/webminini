"use client";

// ============================================================
//  La foto de la tarjeta del listado
// ============================================================
//  Pide la miniatura (~25 KB) en lugar de la foto grande (~200 KB, y hasta
//  1 MB en las viejas). En una grilla de 12 propiedades eso es la
//  diferencia entre bajar ~12 MB y bajar ~300 KB.
//
//  Y como no todas las fotos tienen miniatura —las subidas antes de la
//  migración no la tienen—, si la miniatura da 404 vuelve sola a la
//  imagen grande. El visitante nunca ve un hueco.
//
//  Es un componente de cliente solo por el onError. La tarjeta que lo usa
//  sigue siendo de servidor.
// ============================================================

import { useState } from "react";
import Image from "next/image";
import { urlMiniatura } from "../lib/imagenes";

type Props = {
    src: string;
    alt: string;
    className?: string;
    sizes?: string;
    priority?: boolean;
};

export default function FotoPropiedad({ src, alt, className, sizes, priority = false }: Props) {
    const miniatura = urlMiniatura(src);
    const [actual, setActual] = useState(miniatura);
    const [fallo, setFallo] = useState(false);

    if (fallo) {
        // Ni la miniatura ni la grande cargaron: dejamos el placeholder
        return (
            <div className="w-full h-full flex items-center justify-center bg-input">
                <svg className="w-12 h-12 text-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
                </svg>
            </div>
        );
    }

    return (
        <Image
            src={actual}
            alt={alt}
            fill
            sizes={sizes}
            loading={priority ? undefined : "lazy"}
            priority={priority}
            unoptimized
            className={className}
            onError={() => {
                if (actual !== src) setActual(src); // la miniatura no estaba → probamos la grande
                else setFallo(true);                // tampoco está la grande
            }}
        />
    );
}
