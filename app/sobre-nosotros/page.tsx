import type { Metadata } from "next";
import Image from "next/image";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escribinos por WhatsApp, visitá nuestras oficinas en Chiozza 1796 o dejanos tu consulta online. Atendemos de lunes a viernes de 10:30 a 13:00 y de 16:30 a 20:00hs.",
  openGraph: { url: "/contacto" },
};

const socios = [
  {
    nombre: "Román Minini",
    rol: " Martillero, Corredor Público y administrador de consorcios",
    descripcion:
      "Fundador de Minini Administración de Propiedades e Inmobiliaria. Con más de 25 años de trayectoria, Román construyó desde cero una marca basada en la confianza, la seriedad y el trato cercano. Su experiencia en el mercado inmobiliario y en la administración de consorcios es el pilar sobre el que hoy se desarrolla todo el equipo de trabajo.",
    imagen: "https://syqfekxxiztmlqydtgec.supabase.co/storage/v1/object/public/FotosPagina/romanminini.jpeg",
  },
  {
    nombre: "Juan Minini",
    rol: "Martillero, Corredor Público y administrador de Consorcios",
    descripcion:
      "Continuador del proyecto familiar y actual responsable del área de administración, Juan lidera la gestión de más de 40 consorcios en la zona. Formado desde joven dentro de la empresa, combina la experiencia adquirida junto a Román con una visión moderna, organizada y cercana. Como Martillero y Corredor Público, aporta además una mirada integral del mercado inmobiliario, enfocada en la transparencia, la resolución y el acompañamiento permanente a propietarios e inversores.",
    imagen: null,
  },
  {
    nombre: "Franco Mauri",
    rol: "Ventas Inmobiliarias",
    descripcion:
      "Amigo y socio de la familia Minini desde hace 4 años, Franco es la cara dinámica e innovadora del sector de ventas. Próximo a obtener su matrícula de Martillero y Corredor Público, combina la energía y el enfoque moderno de la nueva generación con la solidez y los valores que aprendió junto a Román. En ventas, es quien convierte oportunidades en resultados.",
    imagen: "https://syqfekxxiztmlqydtgec.supabase.co/storage/v1/object/public/FotosPagina/fanco.jpg",
  },
];

const valores = [
  {
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    titulo: "Transparencia",
    texto:
      "Garantía absoluta de que su patrimonio y dinero de nustros clientes se encuentran a buen resguardo, con una gestión clara en cada etapa.",
  },
  {
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
        />
      </svg>
    ),
    titulo: "Resolución",
    texto:
      "Capacidad de respuesta y agilidad para solucionar las necesidades edilicias y comerciales de nuestros clientes.",
  },
  {
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    titulo: "Cercanía",
    texto:
      "Construimos relaciones de confianza a largo plazo, acompañando a las familias en el crecimiento de sus inversiones.",
  },
];

export default function SobreNosotros() {
  return (
    <div className="bg-background min-h-screen transition-colors duration-300">
      <Header />

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* ── HERO ── */}
        <section className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-sans uppercase tracking-widest text-primary mb-4 font-bold">
            Quienes somos
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground">
            Sobre nosotros
          </h1>
          <p className="font-sans text-base md:text-lg text-foreground/70 leading-relaxed">
            Porque conocemos, vivimos y disfrutamos nuestra ciudad, trabajamos
            todos los días para verla crecer y mejorar.
          </p>
        </section>

        {/* ── DIVISOR ── */}
        <div className="max-w-xs mx-auto mb-16 flex items-center gap-4 px-6 opacity-60">
          <div className="h-px flex-1 bg-primary/40" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="h-px flex-1 bg-primary/40" />
        </div>

        {/* ── SOCIOS FUNDADORES ── */}
        <section className="mb-20 max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-black text-center mb-12 text-foreground">
            Nuestro equipo directivo
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {socios.map((socio) => (
              <div
                key={socio.nombre}
                className="rounded-xl overflow-hidden border border-border-card bg-card shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                {/* Foto */}
                <div className="aspect-[4/3] bg-input flex items-center justify-center relative overflow-hidden border-b border-border-card">
                  {socio.imagen ? (
                    <Image
                      src={socio.imagen}
                      alt={`Foto de ${socio.nombre}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-foreground/20">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="w-16 h-16"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                      <span className="font-sans text-xs font-bold uppercase tracking-wider">
                        Foto pendiente
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="font-serif text-xl font-black text-foreground">
                    {socio.nombre}
                  </h3>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-primary mb-3 mt-1">
                    {socio.rol}
                  </p>
                  <p className="font-sans text-sm text-foreground/70 leading-relaxed">
                    {socio.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECCIÓN: NUESTRA HISTORIA Y EQUIPO (Diseño Unificado) ── */}
        <section className="bg-card border border-border-card rounded-3xl p-8 md:p-12 mb-20 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Columna de Texto: Contenido Profesional Actualizado */}
            <div className="space-y-6 font-sans text-sm md:text-base text-foreground/80 leading-relaxed">
              <h2 className="font-serif text-3xl md:text-4xl font-black mb-6 text-foreground">
                Nuestra historia
              </h2>

              <p>
                Hace más de una década acompañamos a nuestros clientes en cada
                etapa de sus proyectos inmobiliarios, administrando, asesorando
                y brindando soluciones reales tanto en el ámbito de la
                administración de consorcios como en el sector inmobiliario.
              </p>

              <p>
                Estuvimos presentes cuando muchas familias adquirieron su
                primera propiedad y seguimos acompañándolas en el cuidado,
                mantenimiento y desarrollo de sus inversiones, tanto durante sus
                vacaciones como en el día a día de cada edificio.
              </p>

              <p>
                <span className="text-foreground font-bold">
                  Minini Administración de Propiedades
                </span>{" "}
                nació de la mano de Román Minini, continuando el legado de León
                Estrugo, reconocido administrador histórico del Partido de La
                Costa. Con esfuerzo, transparencia y trabajo constante, la marca
                evolucionó hasta convertirse en un equipo sólido comprometido
                con la mejora continua.
              </p>

              <div className="pt-4 space-y-4 border-t border-border-card">
                <p>
                  Actualmente, el funcionamiento es liderado por{" "}
                  <span className="text-foreground font-bold">Juan Minini</span>{" "}
                  (Martillero y Corredor Público) junto a{" "}
                  <span className="text-foreground font-bold">
                    Belén Sansone
                  </span>
                  , responsable fundamental en la organización interna. El
                  equipo se completa con{" "}
                  <span className="text-foreground font-bold">
                    Marcela Giménez
                  </span>
                  , jefa de ventas, y{" "}
                  <span className="text-foreground font-bold">
                    Franco Mauri
                  </span>
                  , quien aporta una mirada moderna al sector.
                </p>

                <p className="text-primary font-bold">
                  Contamos con el respaldo de especialistas en ingeniería,
                  arquitectura, agrimensura y técnicos de oficios, junto al
                  asesoramiento continuo de estudios legales e impositivos.
                </p>

                <p className="font-bold text-foreground">
                  Porque conocemos, vivimos y disfrutamos nuestra ciudad,
                  trabajamos todos los días para verla crecer y mejorar.
                </p>
              </div>
            </div>

            {/* Columna de Imagen: Foto de Equipo / Placeholder */}
            <div className="rounded-2xl overflow-hidden shadow-sm aspect-[4/5] lg:aspect-square bg-input border border-border-card flex items-center justify-center relative group">
              {/* Cuando tengas la foto, descomenta la línea de abajo y borra el div del SVG.
                <Image src="/ruta-a-tu-foto-grupal.jpg" alt="Equipo Minini" fill className="object-cover group-hover:scale-105 transition-transform duration-700" /> 
            */}
              <div className="flex flex-col items-center gap-4 text-foreground/20 group-hover:text-primary/30 transition-colors duration-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.2}
                  className="w-24 h-24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
                <span className="font-sans text-xs font-bold uppercase tracking-[0.2em]">
                  Foto grupal próximamente
                </span>
              </div>

              {/* Overlay sutil decorativo */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </section>

        {/* ── MISIÓN Y VISIÓN ── */}
        <section className="mb-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative border border-border-card rounded-2xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow">
              <span className="absolute -top-4 left-8 bg-primary text-white font-sans text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                Misión
              </span>
              <p className="font-sans text-sm md:text-base text-foreground/80 leading-relaxed mt-2">
                Brindar servicios de administración e inmobiliarios transparentes, ágiles y profesionales, acompañando a nuestros clientes en el cuidado, desarrollo y crecimiento de sus propiedades e inversiones en el Partido de La Costa.
              </p>
            </div>

            <div className="relative border border-border-card rounded-2xl p-8 bg-card shadow-sm hover:shadow-md transition-shadow">
              <span className="absolute -top-4 left-8 bg-foreground text-background font-sans text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                Visión
              </span>
              <p className="font-sans text-sm md:text-base text-foreground/80 leading-relaxed mt-2">
                Ser una empresa referente en el Partido de La Costa por nuestra transparencia, cercanía, capacidad de resolución y mejora constante, construyendo relaciones de confianza a largo plazo con cada cliente.
              </p>
            </div>
          </div>
        </section>

        {/* ── VALORES ── */}
        <section className="bg-card border border-border-card rounded-3xl py-16 px-6 mb-20 shadow-sm">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-black text-center mb-12 text-foreground">
              Nuestros pilares
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {valores.map((v) => (
                <div
                  key={v.titulo}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    {v.icono}
                  </div>
                  <h3 className="font-serif text-xl font-black text-foreground">
                    {v.titulo}
                  </h3>
                  <p className="font-sans text-sm text-foreground/70 leading-relaxed max-w-xs">
                    {v.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="text-center max-w-2xl mx-auto bg-primary text-white p-10 md:p-12 rounded-3xl shadow-xl shadow-primary/20">
          <h2 className="font-serif text-3xl md:text-4xl font-black mb-4">
            ¿Hablamos sobre tu próxima inversión?
          </h2>
          <p className="font-sans text-base text-white/90 mb-8 leading-relaxed">
            Nuestro equipo de especialistas está listo para asesorarte. <br className="hidden md:block" />
                        Nuestra meta es que año a año tus ladrillos valgan cada vez más.
          </p>
          <a
            href="/contacto"
            className="inline-flex items-center gap-3 bg-white text-primary hover:bg-gray-100 font-sans font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-md"
          >
            Contactar al equipo
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
              />
            </svg>
          </a>
        </section>
      </main>
    </div>
  );
}
