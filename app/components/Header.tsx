"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Propiedades", href: "/propiedades" },
  { label: "Sobre nosotros", href: "/sobre-nosotros" },
  { label: "Contacto", href: "/contacto" },
  { label: "Administración", href: "/administrador" },
  { label: "Operaciones Concretadas", href: "/concretadas" }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Guardamos la ruta actual en una variable
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // URLs Limpias y Públicas
  const logoClaro = "https://cvgnpyzgglrclzxxlbsp.supabase.co/storage/v1/object/public/FotosPagina/logo-letra-negra.png";
  const logoOscuro = "https://cvgnpyzgglrclzxxlbsp.supabase.co/storage/v1/object/public/FotosPagina/1.png";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-background/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
          : "bg-background"
          }`}
      >
        <div className="h-[3px] w-full bg-gradient-to-r from-primary via-[#c0392b] to-primary" />

        <div className="w-full pl-6 pr-4 lg:pl-16 lg:pr-10">
          <div className="flex items-center justify-between h-[96px]">

            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-20 h-20 md:w-85 md:h-85 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                {mounted && (
                  <Image
                    src={theme === 'dark' ? logoOscuro : logoClaro}
                    alt="Minini Propiedades Logo"
                    fill
                    sizes="(max-width: 768px) 80px, 340px"
                    className="object-contain"
                    priority
                    unoptimized
                  />
                )}
              </div>
            </Link>

            <div className="flex items-center gap-1 md:gap-6">

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      // Si está activo, le forzamos el color primario al texto
                      className={`relative px-4 py-2 text-sm tracking-wide font-serif font-medium group transition-colors duration-200 hover:text-primary ${isActive ? "text-primary" : "text-foreground/80"
                        }`}
                    >
                      {link.label}
                      {/* La barrita de abajo: Si está activo, scale-x-100 para que se vea fija. Si no, solo en hover */}
                      <span
                        className={`absolute bottom-1 left-4 right-4 h-[1.5px] bg-primary origin-left rounded-full transition-transform duration-300 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                          }`}
                      />
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-1 sm:gap-2">
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-2 text-foreground/60 hover:text-primary transition-colors rounded-full focus:outline-none flex-shrink-0"
                    aria-label="Cambiar tema"
                  >
                    {theme === "dark" ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                )}

                <button
                  className="md:hidden flex flex-col gap-[5px] p-2 group flex-shrink-0"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Abrir menú"
                >
                  <span className={`block h-[2px] w-6 bg-primary transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                  <span className={`block h-[2px] w-6 bg-primary transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                  <span className={`block h-[2px] w-6 bg-primary transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            } bg-background border-t border-primary/15`}
        >
          <nav className="flex flex-col px-6 py-4 gap-1">
            {navLinks.map((link) => {
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-3 font-serif text-sm font-medium border-b border-primary/10 dark:border-primary/20 last:border-0 hover:text-primary hover:pl-2 transition-all duration-200 ${isActive ? "text-primary pl-2" : "text-foreground/90"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/propiedades"
              onClick={() => setMenuOpen(false)}
              className="mt-3 py-3 text-center bg-primary text-white text-sm font-semibold tracking-widest uppercase rounded-sm font-serif"
            >
              Ver Propiedades
            </Link>
          </nav>
        </div>
      </header>

      <div className="h-[99px]" />
    </>
  );
}