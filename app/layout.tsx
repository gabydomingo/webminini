import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";
import { ThemeProvider } from "./components/ThemeProvider";
import WhatsAppFloating from "./components/WhatsAppFloating";
import BannerMantenimiento from "./components/BannerMantenimiento";
import Footer from "./components/Footer";

const aleo = localFont({
  src: "./fonts/Aleo-Black.ttf",
  variable: "--font-aleo",
  display: "swap",
});

const jost = localFont({
  src: "./fonts/Jost-Bold.ttf",
  variable: "--font-jost",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#D90000", // 🎨 Color primario para la barra de navegación del celular
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tudominio.com"), // ⚠️ CAMBIAR POR EL DOMINIO FINAL
  title: {
    default: "Inmobiliaria Minini | Propiedades en San Bernardo y La Costa",
    template: "%s | Minini Propiedades",
  },
  description:
    "Comprá, vendé o alquilá propiedades en San Bernardo, Mar de Ajó y el Partido de la Costa. Más de 20 años de experiencia. Martilleros matriculados y Administración de Consorcios.",
  robots: "index, follow", // Le decimos a Google que ESPIE todo el sitio
  openGraph: {
    siteName: "Inmobiliaria y Administración Minini",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🚀 SEO JSON-LD: Le decimos a Google EXACTAMENTE quién es Minini (Local Business)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Minini Propiedades y Administración de Consorcios",
    "image": "https://syqfekxxiztmlqydtgec.supabase.co/storage/v1/object/public/FotosPagina/2.png", // Logo
    "@id": "https://tudominio.com", // ⚠️ CAMBIAR POR DOMINIO FINAL
    "url": "https://tudominio.com", // ⚠️ CAMBIAR POR DOMINIO FINAL
    "telephone": "+5492257307064",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Chiozza 1796",
      "addressLocality": "San Bernardo",
      "addressRegion": "Buenos Aires",
      "postalCode": "7111",
      "addressCountry": "AR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -36.685, // Aproximado San Bernardo, podés ajustar si tenés lat exacta
      "longitude": -56.680
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "10:30",
      "closes": "20:00" // Formato 24hs
    }
  };

  return (
    <html
      lang="es-AR"
      className={`${aleo.variable} ${jost.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inyectamos el JSON-LD en el head invisiblemente */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <BannerMantenimiento />
          <AnalyticsTracker />
          {children}
          <WhatsAppFloating />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}