"use client";

import { useState } from "react";
import Header from "../components/Header";
import { supabase } from "../lib/supabase";
import dynamic from "next/dynamic";


const ContactMap = dynamic(() => import("../components/ContactMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-input animate-pulse flex items-center justify-center text-foreground/40 font-medium font-sans">Cargando mapa...</div>
});

const sedesData = [
    {
        id: 1,
        nombre: "Administración",
        direccion: "Chiozza 1851 Local 1, San Bernardo",
        horario: "Lunes a Viernes: 10:30-13:00 / 16:30-20:00",
        telefonos: [
            { label: "WhatsApp / Oficina", num: "+54 9 11 5713-4054", link: "5491157134054" },
            { label: "WhatsApp / Consultas", num: "2257 63-8709", link: "5492257638709" }
        ]
    },
    {
        id: 2,
        nombre: "Inmobiliaria Minini",
        direccion: "Chiozza 1796, San Bernardo",
        horario: "Lunes a Viernes: 10:30-13:00 / 16:30-20:00",
        telefonos: [
            { label: "WhatsApp Ventas", num: "2257 30-9051", link: "5492257309051" },
            { label: "WhatsApp Ventas", num: "2257 30-7064", link: "5492257307064" }
        ]
    }
];

export default function ContactoClient() {
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from("inquiries").insert([{
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                message: formData.message,
                property_id: null
            }]);
            if (error) throw error;
            setStatus("success");
            setFormData({ name: "", email: "", phone: "", message: "" });
            setTimeout(() => setStatus("idle"), 5000);
        } catch (err) {
            console.error(err);
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background min-h-screen transition-colors duration-300">
            <Header />

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">

                    <div className="text-center mb-11">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground font-serif mb-4">Ponte en contacto</h1>
                        <p className="text-foreground/60 max-w-2xl mx-auto font-sans text-sm md:text-base">
                            Comunícate directamente con nuestras oficinas o envíanos tu consulta para un asesoramiento personalizado.
                        </p>
                    </div>

                    {/* GRILLA DE SEDES Y CONTACTOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 font-sans">
                        {sedesData.map((sede) => (
                            <div key={sede.id} className="bg-card border border-border-card rounded-2xl overflow-hidden shadow-sm flex flex-col">
                                <div className="p-6 border-b border-border-card bg-input/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                        </div>
                                        <h3 className="text-xl font-bold font-serif">{sede.nombre}</h3>
                                    </div>
                                    <p className="text-foreground/60 text-xs italic">{sede.direccion}</p>
                                    <p className="text-foreground/50 text-[11px] mt-1 font-bold uppercase tracking-wider">{sede.horario}</p>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                    {sede.telefonos.map((tel, idx) => (
                                        <div key={idx} className="bg-background border border-border-card p-4 rounded-xl flex flex-col justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">{tel.label}</span>
                                                <a href={`tel:${tel.link}`} className="text-base font-bold text-foreground hover:text-primary transition-colors">
                                                    {tel.num}
                                                </a>
                                            </div>
                                            <a
                                                href={`https://wa.me/${tel.link}`}
                                                target="_blank"
                                                className="mt-4 flex items-center justify-center gap-2 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                                            >
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.87-2.053-.97-.297-.099-.511-.149-.722.149-.209.298-.769.969-.942 1.169-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.405-.881-.733-1.476-1.638-1.649-1.937-.173-.298-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.721-1.747-.988-2.392-.264-.625-.533-.541-.722-.553-.178-.011-.383-.013-.594-.013s-.549.074-.833.372c-.284.298-1.089 1.066-1.089 2.597 0 1.531 1.115 3.013 1.272 3.211.149.198 2.191 3.348 5.309 4.698 2.059.89 3.125.962 4.195.801 1.233-.186 3.791-1.546 4.321-3.037.53-1.49.53-2.766.372-3.036z" /></svg>
                                                WhatsApp
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SECCIÓN MAPA Y FORMULARIO */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

                        <div className="h-[550px] rounded-2xl overflow-hidden border border-border-card sticky top-32 shadow-inner">
                            <ContactMap />
                        </div>

                        <div className="bg-card border border-border-card p-8 md:p-10 rounded-2xl shadow-sm">
                            <h3 className="text-2xl font-bold text-foreground font-serif mb-8">Envíanos una consulta</h3>

                            {status === "success" && (
                                <div className="mb-6 p-4 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-sm font-sans">
                                    ¡Mensaje enviado con éxito! Nos comunicaremos pronto.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5 font-sans">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2 block ml-1">Nombre Completo</label>
                                    <input
                                        type="text" required
                                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-input border border-border-input rounded-xl px-4 py-4 text-foreground focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2 block ml-1">Teléfono</label>
                                        <input
                                            type="tel" required
                                            value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-input border border-border-input rounded-xl px-4 py-4 text-foreground focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2 block ml-1">Email</label>
                                        <input
                                            type="email" required
                                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-input border border-border-input rounded-xl px-4 py-4 text-foreground focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2 block ml-1">Mensaje</label>
                                    <textarea
                                        rows={5} required
                                        value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full bg-input border border-border-input rounded-xl px-4 py-4 text-foreground focus:border-primary outline-none transition-all resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full py-5 bg-primary text-white font-bold rounded-xl uppercase text-xs tracking-[0.2em] shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 font-serif"
                                >
                                    {loading ? "ENVIANDO..." : "ENVIAR MENSAJE"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}