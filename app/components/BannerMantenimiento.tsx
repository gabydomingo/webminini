"use client";

// ============================================================
//  Cartel de "página en mantenimiento"
// ============================================================
//  Se prende y se apaga con una variable de entorno, sin tocar código:
//
//     NEXT_PUBLIC_MANTENIMIENTO=1     → se muestra
//     NEXT_PUBLIC_MANTENIMIENTO=0     → no se muestra
//     (o directamente borrar la línea)
//
//  En Vercel: Settings → Environment Variables → cambiar el valor →
//  Redeploy. Tarda un minuto y no hace falta pushear nada.
//
//  Detalles de diseño:
//   · No aparece en /admin: ahí sabés que estás trabajando.
//   · El header del sitio es `fixed top-0`, así que el cartel le pisaría
//     el lugar. Por eso agrega la clase `con-banner-mantenimiento` al
//     <html>, y globals.css se encarga de bajar el header y el contenido
//     justo lo que mide el cartel.
//   · El teléfono es tocable: en celular abre el discador y también
//     ofrece WhatsApp.
// ============================================================

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TELEFONO_LINDO = "+54 9 2257 65-3292";
const TELEFONO_TEL = "+5492257653292";
const TELEFONO_WA = "5492257653292";

const MENSAJE_WA = encodeURIComponent(
    "Hola! Entré a la página y vi el cartel de mantenimiento. Quería hacer una consulta."
);

const ACTIVO =
    process.env.NEXT_PUBLIC_MANTENIMIENTO === "1" ||
    process.env.NEXT_PUBLIC_MANTENIMIENTO === "true";

export default function BannerMantenimiento() {
    const pathname = usePathname();
    const enAdmin = pathname?.startsWith("/admin") ?? false;
    const mostrar = ACTIVO && !enAdmin;

    useEffect(() => {
        const clase = "con-banner-mantenimiento";
        if (mostrar) {
            document.documentElement.classList.add(clase);
        } else {
            document.documentElement.classList.remove(clase);
        }
        return () => document.documentElement.classList.remove(clase);
    }, [mostrar]);

    if (!mostrar) return null;

    return (
        <div
            role="status"
            className="fixed top-0 left-0 right-0 z-[60] h-11 md:h-10 bg-secondary text-[#171717] shadow-md"
        >
            <div className="h-full max-w-7xl mx-auto px-3 md:px-6 flex items-center justify-center gap-2 md:gap-3 text-center">
                {/* Icono */}
                <svg
                    className="w-4 h-4 md:w-[18px] md:h-[18px] shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>

                <p className="text-[12.5px] md:text-sm font-sans font-bold leading-tight truncate">
                    {/* Celular: versión corta */}
                    <span className="md:hidden">Sitio en actualización</span>
                    {/* Escritorio: versión completa */}
                    <span className="hidden md:inline">
                        Página en mantenimiento — estamos actualizando el sitio
                    </span>
                    <span className="hidden sm:inline font-normal opacity-80">
                        {" · "}Ante cualquier duda comunicate al{" "}
                    </span>
                    <span className="sm:hidden font-normal opacity-80">{" · "}</span>
                </p>

                {/* Teléfono: llamada directa */}
                <a
                    href={`tel:${TELEFONO_TEL}`}
                    className="shrink-0 text-[12.5px] md:text-sm font-sans font-bold underline underline-offset-2 decoration-2 hover:opacity-70 transition-opacity whitespace-nowrap"
                >
                    {TELEFONO_LINDO}
                </a>

                {/* Atajo a WhatsApp */}
                <a
                    href={`https://wa.me/${TELEFONO_WA}?text=${MENSAJE_WA}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Escribinos por WhatsApp"
                    className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#25D366] hover:scale-110 transition-transform"
                >
                    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.892 6.994c-.003 5.45-4.437 9.884-9.884 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
                    </svg>
                </a>
            </div>
        </div>
    );
}
