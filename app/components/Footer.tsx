"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const pathname = usePathname();

    // Si la ruta empieza con "/admin" o es una subruta de administración de backoffice, no renderizamos el Footer.
    // (Nota: si tu URL de admin es distinta, por ejemplo "/administracion/panel", podés ajustarlo acá)
    if (pathname?.startsWith("/admin") || pathname?.includes("/administracion/")) {
        return null;
    }

    const scrollToTop = (e: React.MouseEvent) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="bg-[#0a0a0a] text-white pt-16 pb-8 border-t border-white/5 font-sans">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* COLUMNA 1: LOGO Y REDES */}
                    <div className="flex flex-col items-start space-y-8">
                        <div className="relative w-72 h-24">
                            <Image
                                src="https://cvgnpyzgglrclzxxlbsp.supabase.co/storage/v1/object/public/FotosPagina/Copia%20de%201col%20neg%20compacto.png"
                                alt="Minini Propiedades"
                                fill
                                sizes="288px" // Definimos el ancho exacto para optimizar
                                className="object-contain filter brightness-0 invert"
                                priority
                            />
                        </div>

                        <div className="space-y-4 pl-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Síguenos en redes</h4>
                            <div className="flex items-center gap-6">
                                <a href="https://www.instagram.com/mininipropiedades/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849s-.011 3.585-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.849-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849s.012-3.584.07-4.849c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.28-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                </a>
                                <a href="https://www.tiktok.com/@minini_propiedades" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.38 6.38 0 0 1-1.35-1.01V15.5c0 1.53-.41 3.05-1.18 4.36a7.1 7.1 0 0 1-3.21 3.12c-1.82.83-3.92.93-5.81.27a7.12 7.12 0 0 1-3.79-3.26c-.72-1.32-1.12-2.82-1.12-4.34 0-1.42.36-2.83 1.05-4.08a7.07 7.07 0 0 1 3.12-3.13c1.07-.49 2.23-.74 3.4-.75v4.1c-.59.04-1.17.19-1.7.44a3.1 3.1 0 0 0-1.36 1.37c-.31.55-.46 1.17-.46 1.8 0 .68.18 1.34.52 1.9a3.11 3.11 0 0 0 1.66 1.41c.84.3 1.76.25 2.56-.13a3.1 3.1 0 0 0 1.41-1.36c.33-.56.5-1.21.5-1.87V0h.01z" /></svg>
                                </a>
                                <a href="https://www.facebook.com/MininiPropiedades" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 2: PROFESIONALES */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-primary border-b border-primary/20 pb-2 inline-block font-serif">
                            Profesionales
                        </h4>
                        <div className="space-y-4 text-white/70 text-xs">
                            <div>
                                <p className="font-bold text-white text-sm mb-1 font-serif">Román Minini</p>
                                <p>Martillero y Corredor Público</p>
                                <p>Tomo III - Folio 548 | Mat. N° 1134</p>
                            </div>
                            <div className="pt-2 border-t border-white/5">
                                <p className="font-bold text-white text-sm mb-1 font-serif">Juan Minini</p>
                                <p>Martillero y Corredor Público</p>
                                <p>Tomo III - Folio 521 | Mat. N° 1098</p>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 3: MENÚ */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-primary border-b border-primary/20 pb-2 inline-block font-serif">
                            Menú
                        </h4>
                        <nav className="flex flex-col gap-2 text-sm text-white/60">
                            <button onClick={scrollToTop} className="text-left hover:text-primary transition-colors cursor-pointer outline-none">Inicio</button>
                            <Link href="/propiedades" className="hover:text-primary transition-colors">Propiedades</Link>
                            <Link href="/sobre-nosotros" className="hover:text-primary transition-colors">Sobre Nosotros</Link>
                            <Link href="/contacto" className="hover:text-primary transition-colors">Contacto</Link>
                            <Link href="/administracion" className="hover:text-primary transition-colors">Administración</Link>
                        </nav>
                    </div>

                    {/* COLUMNA 4: INSTITUCIONAL */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-primary border-b border-primary/20 pb-2 inline-block font-serif">
                            Institucional
                        </h4>
                        <div className="flex flex-col gap-6">
                            <a
                                href="https://comado.com.ar/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative w-56 h-20 grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100"
                            >
                                <Image
                                    src="https://cvgnpyzgglrclzxxlbsp.supabase.co/storage/v1/object/public/FotosPagina/logo-blanco-colegio3-min.png"
                                    alt="Colegio de Martilleros"
                                    fill
                                    sizes="224px"
                                    className="object-contain"
                                />
                            </a>
                            <a
                                href="https://camaraadministrador.com.ar/new/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative w-56 h-20 grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100"
                            >
                                <Image
                                    src="https://cvgnpyzgglrclzxxlbsp.supabase.co/storage/v1/object/public/FotosPagina/Logo-Camara-con-sigla_BLANCO3.png"
                                    alt="Cámara de Administradores"
                                    fill
                                    sizes="224px"
                                    className="object-contain"
                                />
                            </a>
                        </div>
                    </div>

                </div>

                {/* BARRA INFERIOR */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                    <p>© {currentYear} Minini Propiedades. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-2">
                        <span>Powered by</span>
                        <span className="text-white/50 tracking-tighter text-xs uppercase">Minini Tech</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}