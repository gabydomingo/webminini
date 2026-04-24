import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// 1. Tipografía Principal (Títulos - Aleo Black)
const aleo = localFont({
  src: "./fonts/Aleo-Black.ttf",
  variable: "--font-aleo",
  display: "swap",
});

// 2. Tipografía Secundaria (Textos/Bajadas - Jost Bold)
const jost = localFont({
  src: "./fonts/Jost-Bold.ttf",
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inmobiliaria Minini",
  description: "Encontrá tu propiedad ideal en La Costa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      // Inyectamos las variables de las fuentes
      className={`${aleo.variable} ${jost.variable} h-full antialiased`}
    >
      {/* El font-sans hace que TODO el texto normal use Jost por defecto */}
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}