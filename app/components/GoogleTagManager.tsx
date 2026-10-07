// ============================================================
//  Google Tag Manager
// ============================================================
//  GTM es el "contenedor": una vez puesto acá, Google Analytics, Google
//  Ads, el píxel de Meta o lo que haga falta se agregan y se sacan desde
//  el panel de Tag Manager, sin volver a tocar el código ni redesplegar.
//
//  DÓNDE VA CADA PARTE (las dos que pide Google)
//
//  1. El <script> — Google dice "lo más arriba posible en el <head>".
//     Acá lo carga `next/script` con strategy="afterInteractive", que es
//     lo que recomienda Next para GTM y lo que usa el paquete oficial
//     @next/third-parties. Next decide dónde inyectarlo, así que no
//     importa en qué lugar del árbol esté este componente.
//
//     ¿Por qué no "beforeInteractive", que sí lo mete en el HTML inicial?
//     Porque bloquea el primer pintado con un script de terceros de ~90 KB
//     y se come varios puntos de Performance. GTM no necesita correr antes
//     de que la página sea usable: lo único que se pierde es registrar los
//     primeros ~200 ms de una visita.
//
//  2. El <noscript> con el iframe — tiene que quedar INMEDIATAMENTE
//     después de la etiqueta <body>. Por eso este componente se monta
//     como primer hijo de <body> en app/layout.tsx. Ese `return` se
//     renderiza en el servidor y sale en el HTML, justo donde va.
//
//  SOBRE EL ID
//
//  No es un secreto: viaja en el HTML de todas las páginas y cualquiera
//  lo puede leer con Ctrl+U. Por eso va escrito acá y no en una variable
//  de entorno — una cosa menos que configurar en Vercel y una cosa menos
//  que se puede olvidar y dejar el sitio sin medición.
//
//  OJO CON EL PANEL
//
//  Esto se carga en TODO el sitio, /admin incluido. Si no querés que las
//  visitas de la inmobiliaria al panel ensucien las métricas de Analytics,
//  el lugar correcto para filtrarlas es el propio Tag Manager: en el
//  disparador de la etiqueta, excepción con "Page Path" → "contiene" →
//  "/admin". Se hace desde la web de GTM, sin tocar el código.
// ============================================================

import Script from "next/script";

/** Contenedor de Tag Manager de propiedadesminini.com. */
export const GTM_ID = "GTM-TZV87TSM";

export default function GoogleTagManager() {
    return (
        <>
            {/* 1. Snippet del <head> — mismo código que da Google, con el
                   ID tomado de la constante de arriba. */}
            <Script id="google-tag-manager" strategy="afterInteractive">
                {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
            </Script>

            {/* 2. Snippet de después del <body> — para los navegadores con
                   JavaScript desactivado. Es el mismo iframe que da Google;
                   los atributos van en sintaxis JSX (style como objeto). */}
            <noscript>
                <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                    height="0"
                    width="0"
                    style={{ display: "none", visibility: "hidden" }}
                    title="Google Tag Manager"
                />
            </noscript>
        </>
    );
}
