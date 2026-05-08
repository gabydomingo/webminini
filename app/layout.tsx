import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";
import { ThemeProvider } from "./components/ThemeProvider";
import WhatsAppFloating from "./components/WhatsAppFloating";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://webminini.vercel.app"),
  title: {
    default: "Inmobiliaria Minini | Propiedades en San Bernardo y La Costa",
    template: "%s | Minini Propiedades",
  },
  description:
    "Comprá, vendé o alquilá propiedades en San Bernardo, Mar de Ajó y el Partido de la Costa. Más de 15 años de experiencia. Martilleros matriculados.",
  openGraph: {
    siteName: "Minini Propiedades",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Para evitar warnings de next-themes al cargar
    <html
      lang="es"
      className={`${aleo.variable} ${jost.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AnalyticsTracker />
          {children}
          <WhatsAppFloating />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}