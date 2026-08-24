"use client";

// ============================================================
//  Mantener los filtros en la barra de direcciones
// ============================================================
//  El problema que resuelve: los filtros vivían solo en el estado de
//  React. El visitante acomodaba operación, tipo, localidad, precio,
//  pasaba a la página 3, entraba a una propiedad… y al volver con el
//  botón "atrás" el componente se montaba de cero y perdía todo.
//
//  Con los filtros en la URL, volver atrás los restaura solo: el
//  navegador devuelve la dirección con sus parámetros y el componente
//  arranca leyéndolos.
//
//  Dos decisiones:
//
//  · Usa `replace` y no `push`. Con `push`, cada tecla escrita en el
//    buscador dejaría una entrada en el historial y "atrás" haría
//    recorrer una por una todas las combinaciones de filtros.
//
//  · Espera 300 ms antes de escribir. Sin eso, escribir "san bernardo"
//    dispararía 12 navegaciones seguidas.
// ============================================================

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useUrlSincronizada(query: string, esperaMs = 300) {
    const router = useRouter();
    const pathname = usePathname();
    const primeraVez = useRef(true);

    useEffect(() => {
        // En el primer render la URL ya viene con lo que corresponde
        // (venimos de "atrás" o de un link compartido). Si escribiéramos
        // acá, la pisaríamos antes de que el estado termine de leerla.
        if (primeraVez.current) {
            primeraVez.current = false;
            return;
        }

        const t = setTimeout(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }, esperaMs);

        return () => clearTimeout(t);
    }, [query, pathname, router, esperaMs]);
}
