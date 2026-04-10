"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Propiedades", href: "/propiedades" },
  { label: "Sobre nosotros", href: "/sobre-nosotros" },
  { label: "Contacto", href: "/contacto" },
  { label: "Administración", href: "/administracion" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-[#f5f0e8]/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
          : "bg-[#f5f0e8]"
          }`}
      >
        {/* Top accent line */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#8B1A1A] via-[#c0392b] to-[#8B1A1A]" />

        <div className="w-full pl-8 pr-6 lg:pl-16 lg:pr-10">
          <div className="flex items-center justify-between h-[96px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              {/* Contenedor de la imagen más limpio y con el tamaño justo */}
              <div className="relative w-20 h-20 md:w-85 md:h-85 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="https://cvgnpyzgglrclzxxlbsp.supabase.co/storage/v1/object/sign/FotosPagina/logo-letra-negra.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xMzYyYTZhZi0zYTkwLTQ4MWYtYjZjMi1jMThjNzYwZjY5NzQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJGb3Rvc1BhZ2luYS9sb2dvLWxldHJhLW5lZ3JhLnBuZyIsImlhdCI6MTc3NTY2MDI3NCwiZXhwIjoxNzc2MjY1MDc0fQ.i_xbNGfLSxhw0fqSUZSN9GcCr2J4r9CnfuXxfc1x9tU"
                  alt="Minini Propiedades Logo"
                  fill
                  sizes="(max-width: 768px) 80px, 340px"
                  className="object-contain"
                  quality={100}
                  priority
                />
              </div>
              {/* <div className="flex flex-col leading-tight">
                <span className="text-[#8B1A1A] font-bold text-lg tracking-wide uppercase" style={{ fontFamily: "'Georgia', serif", letterSpacing: "0.08em" }}>
                  Minini
                </span>
                <span className="text-[#6b5a4e] text-[10px] tracking-[0.25em] uppercase font-medium">
                  Propiedades
                </span>
              </div> */}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm text-[#4a3728] tracking-wide font-medium group transition-colors duration-200 hover:text-[#8B1A1A]"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {link.label}
                  <span className="absolute bottom-1 left-4 right-4 h-[1.5px] bg-[#8B1A1A] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
                </Link>
              ))}

              {/* CTA Button */}
              {/* <Link
                href="/propiedades"
                className="ml-4 px-5 py-2 bg-[#8B1A1A] text-[#f5f0e8] text-sm font-semibold tracking-wider uppercase rounded-sm hover:bg-[#6e1414] active:scale-95 transition-all duration-200 shadow-sm"
                style={{ fontFamily: "'Georgia', serif", letterSpacing: "0.12em" }}
              >
                Ver Propiedades
              </Link> */}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex flex-col gap-[5px] p-2 group"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Abrir menú"
            >
              <span className={`block h-[2px] w-6 bg-[#8B1A1A] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
              <span className={`block h-[2px] w-6 bg-[#8B1A1A] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-[2px] w-6 bg-[#8B1A1A] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            } bg-[#f0ebe0] border-t border-[#8B1A1A]/15`}
        >
          <nav className="flex flex-col px-6 py-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-[#4a3728] text-sm font-medium border-b border-[#8B1A1A]/10 last:border-0 hover:text-[#8B1A1A] hover:pl-2 transition-all duration-200"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/propiedades"
              onClick={() => setMenuOpen(false)}
              className="mt-3 py-3 text-center bg-[#8B1A1A] text-[#f5f0e8] text-sm font-semibold tracking-widest uppercase rounded-sm"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Ver Propiedades
            </Link>
          </nav>
        </div>
      </header>

      {/* Spacer so content doesn't hide under fixed header */}
      <div className="h-[99px]" />
    </>
  );
}