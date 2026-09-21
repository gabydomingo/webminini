"use client";

// ============================================================
//  Formulario de consulta de la ficha
// ============================================================
//  Antes insertaba directo en la tabla `inquiries` con la clave anónima,
//  que viaja en el bundle de cualquier visitante. Con esa clave a la vista,
//  llenar la tabla de basura es cuestión de un rato y medio kilobyte de
//  script. Ahora pasa por /api/consulta, que valida del lado del servidor.
//
//  Contra los bots, dos filtros que no molestan a nadie:
//   · un campo oculto que un humano nunca completa
//   · el tiempo que tardó en llenarse el formulario
// ============================================================

import { useEffect, useRef, useState } from "react";

type Props = {
    propiedadId: string;
    mensajeInicial: string;
};

export default function FormularioConsulta({ propiedadId, mensajeInicial }: Props) {
    const [datos, setDatos] = useState({
        name: "",
        phone: "",
        email: "",
        message: mensajeInicial,
    });
    const [enviando, setEnviando] = useState(false);
    const [estado, setEstado] = useState<"idle" | "success" | "error">("idle");
    // El reloj se lee en un efecto, no durante el render: Date.now() devuelve
    // algo distinto cada vez que se lo llama y React exige que el render sea
    // reproducible. Además en el servidor daría una marca que no sirve.
    const montadoEn = useRef(0);
    const trampaRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        montadoEn.current = Date.now();
    }, []);

    const cambiar = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setDatos({ ...datos, [e.target.name]: e.target.value });

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        setEstado("idle");
        try {
            const res = await fetch("/api/consulta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...datos,
                    property_id: propiedadId,
                    empresa: trampaRef.current?.value ?? "",
                    // Si por lo que sea no se registró el momento de montaje,
                    // mandamos un valor holgado: preferimos dejar pasar una
                    // consulta de más antes que perder una real.
                    demora: montadoEn.current ? Date.now() - montadoEn.current : 60_000,
                }),
            });
            if (!res.ok) throw new Error(`respuesta ${res.status}`);
            setEstado("success");
            setDatos((prev) => ({ ...prev, name: "", phone: "", email: "" }));
            setTimeout(() => setEstado("idle"), 5000);
        } catch (err) {
            console.error("Error al enviar consulta:", err);
            setEstado("error");
        } finally {
            setEnviando(false);
        }
    };

    const clasesCampo =
        "w-full px-4 py-3 bg-input border border-border-input rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

    return (
        <>
            {/* aria-live para que un lector de pantalla anuncie el resultado:
                antes el mensaje aparecía y quien no lo veía no se enteraba. */}
            <div aria-live="polite">
                {estado === "success" && (
                    <div className="mb-4 bg-green-500/10 border-l-4 border-green-600 p-4 rounded text-sm text-green-800 dark:text-green-400">
                        ¡Consulta enviada! Nos pondremos en contacto a la brevedad.
                    </div>
                )}
                {estado === "error" && (
                    <div className="mb-4 bg-red-500/10 border-l-4 border-red-600 p-4 rounded text-sm text-red-800 dark:text-red-400">
                        Hubo un error al enviar el mensaje. Por favor, intentá nuevamente.
                    </div>
                )}
            </div>

            <form onSubmit={enviar} className="space-y-4">
                {/* Trampa para bots. Oculta para el ojo y para los lectores de
                    pantalla, pero un script que completa todo la llena igual. */}
                <input
                    ref={trampaRef}
                    type="text"
                    name="empresa"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute w-px h-px -left-[9999px] overflow-hidden"
                />

                <div>
                    <label htmlFor="consulta-nombre" className="sr-only">Nombre completo</label>
                    <input
                        id="consulta-nombre"
                        type="text"
                        name="name"
                        required
                        autoComplete="name"
                        value={datos.name}
                        onChange={cambiar}
                        placeholder="Nombre completo *"
                        className={clasesCampo}
                    />
                </div>

                <div>
                    <label htmlFor="consulta-telefono" className="sr-only">Teléfono</label>
                    <input
                        id="consulta-telefono"
                        type="tel"
                        name="phone"
                        required
                        autoComplete="tel"
                        value={datos.phone}
                        onChange={cambiar}
                        placeholder="Teléfono *"
                        className={clasesCampo}
                    />
                </div>

                <div>
                    <label htmlFor="consulta-email" className="sr-only">Email</label>
                    <input
                        id="consulta-email"
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        value={datos.email}
                        onChange={cambiar}
                        placeholder="Email *"
                        className={clasesCampo}
                    />
                </div>

                <div>
                    <label htmlFor="consulta-mensaje" className="sr-only">Mensaje</label>
                    <textarea
                        id="consulta-mensaje"
                        name="message"
                        required
                        value={datos.message}
                        onChange={cambiar}
                        rows={4}
                        className={`${clasesCampo} resize-none`}
                    />
                </div>

                <button
                    type="submit"
                    disabled={enviando}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {enviando ? "Enviando..." : "Enviar consulta"}
                </button>
            </form>
        </>
    );
}
