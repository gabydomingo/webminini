"use client";

// ============================================================
//  Galería de la ficha + visor a pantalla completa
// ============================================================
//  QUÉ ESTABA MAL
//
//  Pasar de foto en foto era un problema, sobre todo en celular:
//
//   · Las flechas eran dos botones de ~64 px pegados al borde, y además
//     quedaban solapados con el contenedor de la foto (`max-w-[90vw]`).
//     En un teléfono la zona realmente útil terminaba siendo una franja
//     de unos 20 px. De ahí que hubiera que "embocar".
//   · No había gesto de deslizar, que es lo primero que intenta cualquiera
//     en un celular.
//   · No había teclado: ni flechas ni Escape.
//   · Cada cambio de foto esperaba la descarga completa de la siguiente,
//     así que se veía negro un segundo entre foto y foto.
//
//  CÓMO QUEDÓ
//
//   · Dos zonas táctiles que ocupan el 30 % del ancho y toda la altura
//     útil. Imposible errarle. En escritorio son dos columnas de 96 px
//     con la flecha centrada.
//   · Deslizar para pasar de foto, y deslizar hacia abajo para cerrar.
//   · ← → para navegar, Escape para cerrar, Tab que no se escapa del visor.
//   · Mientras baja la foto grande se muestra la miniatura ampliada y
//     desenfocada — que ya está en caché del navegador — así nunca se ve
//     un hueco negro.
//   · Se precarga únicamente la foto siguiente. Precargar las dos gastaría
//     el doble de tráfico del bucket para algo que la mayoría no usa.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { urlMiniatura } from "../../lib/imagenes";

// Cuánto hay que deslizar para que cuente como gesto, en píxeles.
const MINIMO_DESLIZAR = 50;
// Lo mismo hacia abajo, para cerrar.
const MINIMO_CERRAR = 90;
// A partir de cuánto movimiento dejamos de considerarlo un toque.
const TOLERANCIA_TOQUE = 10;

type Props = {
    images: string[];
    titulo: string;
};

export default function Galeria({ images, titulo }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [indice, setIndice] = useState(0);
    const [cargada, setCargada] = useState(false);
    const [desplazamiento, setDesplazamiento] = useState(0);

    const visorRef = useRef<HTMLDivElement>(null);
    const tiraRef = useRef<HTMLDivElement>(null);
    const galeriaLateralRef = useRef<HTMLDivElement>(null);
    const gesto = useRef({ x: 0, y: 0, activo: false, arrastro: false });
    // Quién tenía el foco antes de abrir, para devolvérselo al cerrar.
    const focoPrevio = useRef<HTMLElement | null>(null);

    const total = images.length;

    // ── Navegación ───────────────────────────────────────────────────────
    const irA = useCallback(
        (i: number) => {
            setIndice(((i % total) + total) % total);
            setCargada(false);
        },
        [total]
    );

    const siguiente = useCallback(() => irA(indice + 1), [irA, indice]);
    const anterior = useCallback(() => irA(indice - 1), [irA, indice]);

    const abrir = (i: number) => {
        focoPrevio.current = document.activeElement as HTMLElement;
        setIndice(i);
        setCargada(false);
        setAbierto(true);
    };

    const cerrar = useCallback(() => {
        setAbierto(false);
        setDesplazamiento(0);
        focoPrevio.current?.focus();
    }, []);

    // ── Bloquear el scroll del fondo mientras el visor está abierto ──────
    useEffect(() => {
        if (!abierto) return;
        const previo = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previo;
        };
    }, [abierto]);

    // ── Teclado ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!abierto) return;

        const alPresionar = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                cerrar();
                return;
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                siguiente();
                return;
            }
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                anterior();
                return;
            }
            // El foco no se escapa del visor: mientras está abierto, lo que
            // hay detrás no debería ser alcanzable con Tab.
            if (e.key === "Tab" && visorRef.current) {
                const focusables = visorRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
                );
                if (!focusables.length) return;
                const primero = focusables[0];
                const ultimo = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === primero) {
                    e.preventDefault();
                    ultimo.focus();
                } else if (!e.shiftKey && document.activeElement === ultimo) {
                    e.preventDefault();
                    primero.focus();
                }
            }
        };

        window.addEventListener("keydown", alPresionar);
        return () => window.removeEventListener("keydown", alPresionar);
    }, [abierto, cerrar, siguiente, anterior]);

    // Al abrir, el foco va al visor para que el teclado funcione de entrada.
    useEffect(() => {
        if (abierto) visorRef.current?.focus();
    }, [abierto]);

    // ── Precarga de la foto siguiente ────────────────────────────────────
    useEffect(() => {
        if (!abierto || total < 2) return;
        const proxima = images[(indice + 1) % total];
        if (!proxima) return;
        const img = new window.Image();
        img.src = proxima;
    }, [abierto, indice, images, total]);

    // ── La miniatura activa siempre visible en la tira ───────────────────
    useEffect(() => {
        if (!abierto || !tiraRef.current) return;
        const activa = tiraRef.current.querySelector<HTMLElement>('[data-activa="true"]');
        activa?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }, [abierto, indice]);

    // ── Gestos ───────────────────────────────────────────────────────────
    const alTocar = (e: React.PointerEvent) => {
        // La tira de miniaturas se desplaza de costado con el dedo. Ese gesto
        // es suyo: si lo tomáramos nosotros, arrastrar la tira cambiaría de
        // foto en vez de correrla.
        if ((e.target as HTMLElement).closest("[data-tira]")) {
            gesto.current.activo = false;
            gesto.current.arrastro = false;
            return;
        }
        gesto.current = { x: e.clientX, y: e.clientY, activo: true, arrastro: false };
    };

    const alMover = (e: React.PointerEvent) => {
        if (!gesto.current.activo) return;
        const dx = e.clientX - gesto.current.x;
        const dy = e.clientY - gesto.current.y;
        if (Math.abs(dx) > TOLERANCIA_TOQUE || Math.abs(dy) > TOLERANCIA_TOQUE) {
            gesto.current.arrastro = true;
        }
        // La foto acompaña el dedo: sin esto el gesto se siente muerto.
        if (Math.abs(dx) > Math.abs(dy)) setDesplazamiento(dx);
    };

    const alSoltar = (e: React.PointerEvent) => {
        if (!gesto.current.activo) return;
        const dx = e.clientX - gesto.current.x;
        const dy = e.clientY - gesto.current.y;
        gesto.current.activo = false;
        setDesplazamiento(0);

        // Hacia abajo se cierra, como en la galería del teléfono.
        if (dy > MINIMO_CERRAR && Math.abs(dy) > Math.abs(dx)) {
            cerrar();
            return;
        }
        if (Math.abs(dx) >= MINIMO_DESLIZAR && total > 1) {
            if (dx < 0) siguiente();
            else anterior();
        }
    };

    /** Un toque en una zona lateral no debe dispararse si en realidad fue un deslizamiento. */
    const siFueToque = (accion: () => void) => () => {
        if (gesto.current.arrastro) {
            gesto.current.arrastro = false;
            return;
        }
        accion();
    };

    /** Los chevrones de la columna lateral de la portada. */
    const desplazarLateral = (hacia: "arriba" | "abajo") => {
        galeriaLateralRef.current?.scrollBy({
            top: hacia === "arriba" ? -250 : 250,
            behavior: "smooth",
        });
    };

    if (!total) {
        return (
            <div className="h-[40vh] bg-input rounded-2xl mb-10 flex items-center justify-center">
                <span className="text-foreground/60 font-bold font-sans">Sin imágenes</span>
            </div>
        );
    }

    const principal = images[0];
    const laterales = images.slice(1);
    const actual = images[indice];

    return (
        <>
            {/* ── Portada de la ficha ────────────────────────────────── */}
            <div className="relative mb-10 h-[50vh] md:h-[60vh] lg:h-[70vh] flex gap-2">
                <button
                    type="button"
                    onClick={() => abrir(0)}
                    aria-label={`Abrir la galería de ${total} fotos`}
                    className="relative flex-[2] md:flex-[3] h-full rounded-2xl overflow-hidden cursor-pointer group bg-input focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
                >
                    <Image
                        src={principal}
                        alt={`${titulo} — foto principal`}
                        fill
                        sizes="(max-width: 768px) 100vw, 75vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                        unoptimized
                    />
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </button>

                {laterales.length > 0 && (
                    <div className="relative flex-1 hidden sm:flex flex-col h-full overflow-hidden">
                        {laterales.length > 2 && (
                            <button
                                type="button"
                                onClick={() => desplazarLateral("arriba")}
                                aria-label="Ver las fotos anteriores de la columna"
                                className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-card/90 backdrop-blur text-foreground rounded-full flex items-center justify-center shadow-md hover:text-primary transition-all border border-border-card"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                        )}

                        <div
                            ref={galeriaLateralRef}
                            className="flex flex-col gap-2 h-full overflow-y-auto snap-y snap-mandatory pb-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {laterales.map((img, idx) => (
                                <button
                                    type="button"
                                    key={idx}
                                    onClick={() => abrir(idx + 1)}
                                    aria-label={`Abrir la foto ${idx + 2} de ${total}`}
                                    className="relative w-full h-[50%] shrink-0 snap-center rounded-2xl overflow-hidden cursor-pointer group bg-input focus:outline-none focus-visible:ring-4 focus-visible:ring-primary"
                                >
                                    {/* La barra lateral se dibuja a ~25vw: pide la miniatura
                                        (~25 KB) en vez de la grande (~150 KB). En una propiedad
                                        de 25 fotos eso es bajar ~600 KB en vez de ~3,7 MB. */}
                                    <Image
                                        src={urlMiniatura(img)}
                                        alt=""
                                        fill
                                        sizes="25vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                        unoptimized
                                    />
                                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                </button>
                            ))}
                        </div>

                        {laterales.length > 2 && (
                            <button
                                type="button"
                                onClick={() => desplazarLateral("abajo")}
                                aria-label="Ver las fotos siguientes de la columna"
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-card/90 backdrop-blur text-foreground rounded-full flex items-center justify-center shadow-md hover:text-primary transition-all border border-border-card"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => abrir(0)}
                    className="absolute bottom-6 right-6 sm:right-[calc(25%+1.5rem)] bg-card/95 backdrop-blur-sm text-foreground px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-all border border-border-card z-20 flex items-center gap-2 font-sans"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Ver {total} fotos
                </button>
            </div>

            {/* ── Visor a pantalla completa ──────────────────────────── */}
            {abierto && (
                <div
                    ref={visorRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Fotos de ${titulo}`}
                    tabIndex={-1}
                    onPointerDown={alTocar}
                    onPointerMove={alMover}
                    onPointerUp={alSoltar}
                    onPointerCancel={() => {
                        gesto.current.activo = false;
                        setDesplazamiento(0);
                    }}
                    // touchAction en línea y no con clases de Tailwind porque acá el
                    // valor exacto importa: `pan-y pinch-zoom` le deja al navegador
                    // el desplazamiento vertical y el zoom con dos dedos, y nos
                    // reserva el gesto horizontal — que es el que cambia de foto.
                    // Con `auto` el navegador se queda con todo y el deslizar no
                    // funciona; con `none` se pierde el pellizcar para agrandar.
                    style={{ touchAction: "pan-y pinch-zoom" }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm select-none focus:outline-none"
                >
                    {/* Barra superior */}
                    <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-3 sm:px-5 z-30">
                        <span className="text-white font-medium tracking-widest text-sm bg-black/50 px-3 py-1.5 rounded-full font-sans">
                            {indice + 1} / {total}
                        </span>
                        <button
                            type="button"
                            onClick={cerrar}
                            aria-label="Cerrar la galería"
                            className="w-12 h-12 flex items-center justify-center text-white rounded-full hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* La foto. Detrás va la miniatura ampliada y borrosa, que ya está
                        en la caché del navegador, así nunca se ve un hueco negro
                        mientras baja la grande.

                        Ojo con el orden: la miniatura va DETRÁS y la foto grande
                        siempre opaca, nunca al revés. Si la grande arrancara
                        transparente esperando el onLoad y ese evento no llegara
                        —imagen ya cacheada, error de red—, el visitante se quedaría
                        mirando una mancha borrosa para siempre. Así, lo peor que
                        puede pasar es que quede una miniatura tapada por la foto. */}
                    <div className={`absolute inset-x-0 top-16 ${total > 1 ? "bottom-24" : "bottom-4"} flex items-center justify-center px-2`}>
                        <div
                            className="relative w-full h-full"
                            style={{
                                transform: `translateX(${desplazamiento}px)`,
                                transition: desplazamiento ? "none" : "transform 200ms ease-out",
                            }}
                        >
                            <Image
                                key={`fondo-${indice}`}
                                src={urlMiniatura(actual)}
                                alt=""
                                aria-hidden="true"
                                fill
                                sizes="100vw"
                                unoptimized
                                className={`object-contain blur-lg scale-105 transition-opacity duration-300 ${cargada ? "opacity-0" : "opacity-100"}`}
                            />
                            <Image
                                key={`foto-${indice}`}
                                src={actual}
                                alt={`${titulo} — foto ${indice + 1} de ${total}`}
                                fill
                                sizes="100vw"
                                priority
                                unoptimized
                                onLoad={() => setCargada(true)}
                                className="object-contain"
                            />
                        </div>
                    </div>

                    {total > 1 && (
                        <>
                            {/* Zonas táctiles: 30 % del ancho y toda la altura útil.
                                Este es el arreglo de fondo — en celular ya no hay que
                                apuntarle a un botón chico pegado al borde. */}
                            <button
                                type="button"
                                onClick={siFueToque(anterior)}
                                aria-label="Foto anterior"
                                className="group absolute left-0 top-16 bottom-24 w-[30%] sm:w-24 z-20 flex items-center justify-center focus:outline-none focus-visible:bg-white/10"
                            >
                                <span className="w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center transition-all group-hover:bg-black/70 group-active:scale-90">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={siFueToque(siguiente)}
                                aria-label="Foto siguiente"
                                className="group absolute right-0 top-16 bottom-24 w-[30%] sm:w-24 z-20 flex items-center justify-center focus:outline-none focus-visible:bg-white/10"
                            >
                                <span className="w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center transition-all group-hover:bg-black/70 group-active:scale-90">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </button>

                            {/* Tira de miniaturas: para saltar directo a una foto sin
                                pasar por las veinte del medio. */}
                            <div
                                ref={tiraRef}
                                data-tira="true"
                                style={{ touchAction: "pan-x" }}
                                className="absolute bottom-0 inset-x-0 h-24 flex items-center gap-2 px-3 overflow-x-auto z-30 bg-gradient-to-t from-black/80 to-transparent [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {images.map((img, i) => (
                                    <button
                                        type="button"
                                        key={i}
                                        data-activa={i === indice}
                                        onClick={siFueToque(() => irA(i))}
                                        aria-label={`Ver la foto ${i + 1}`}
                                        aria-current={i === indice}
                                        className={`relative h-16 w-24 shrink-0 rounded-lg overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${i === indice
                                            ? "ring-2 ring-white opacity-100"
                                            : "opacity-50 hover:opacity-80"
                                            }`}
                                    >
                                        <Image
                                            src={urlMiniatura(img)}
                                            alt=""
                                            fill
                                            sizes="96px"
                                            loading="lazy"
                                            unoptimized
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
