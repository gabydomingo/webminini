// ============================================================
//  El pin de los mapas, sin depender de ningún CDN
// ============================================================
//  ANTES: los tres mapas del sitio cargaban las imágenes del marcador
//  desde afuera —dos desde unpkg.com y uno desde cdnjs.cloudflare.com—.
//  Eran 6 pedidos a servidores de terceros solo para dibujar un pin.
//
//  Eso trae dos problemas:
//
//  1. Redes restrictivas (universidades, oficinas, algunos wifis
//     públicos) bloquean esos CDN, y el mapa aparecía sin marcadores o
//     directamente colgado.
//  2. Cada dominio externo suma resolución DNS, handshake TLS y una
//     descarga; Lighthouse lo penaliza y el visitante lo espera.
//
//  AHORA: el pin es un SVG escrito acá mismo. Cero pedidos externos,
//  se ve nítido en cualquier pantalla y usa el rojo de la marca.
// ============================================================

import L from "leaflet";

const COLOR = "#D90000"; // primario Minini

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" width="26" height="37"
     style="filter: drop-shadow(0 2px 3px rgba(0,0,0,.35))">
  <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 22 12 22s12-13.6 12-22c0-6.6-5.4-12-12-12z"
        fill="${COLOR}"/>
  <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
</svg>`;

/**
 * Pin estándar de los mapas.
 * `iconAnchor` apunta a la punta de abajo, que es la que marca el lugar exacto.
 */
export const marcadorMinini = L.divIcon({
    html: SVG,
    className: "marcador-minini", // sin estilos propios: evita el fondo blanco de Leaflet
    iconSize: [26, 37],
    iconAnchor: [13, 37],
    popupAnchor: [0, -34],
});

/** Variante en dorado, para diferenciar un segundo tipo de punto. */
export const marcadorSecundario = L.divIcon({
    html: SVG.replace(COLOR, "#BE9B5F"),
    className: "marcador-minini",
    iconSize: [26, 37],
    iconAnchor: [13, 37],
    popupAnchor: [0, -34],
});
