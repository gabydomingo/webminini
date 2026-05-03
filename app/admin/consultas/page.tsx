"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

interface Inquiry {
    id: string;
    created_at: string;
    name: string;
    phone: string;
    email: string;
    message: string;
    status: string;
    property_id: string | null; // Puede ser null ahora
    properties?: {
        title: string;
        operation_type: string;
    };
}

export default function ConsultasPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("inquiries")
            .select(`
                *,
                properties (
                    title,
                    operation_type
                )
            `)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setInquiries(data as Inquiry[]);
        }
        setLoading(false);
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pendiente' ? 'contactado' : 'pendiente';
        const { error } = await supabase
            .from('inquiries')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setInquiries(inquiries.map(inq =>
                inq.id === id ? { ...inq, status: newStatus } : inq
            ));
        }
    };

    const deleteInquiry = async (id: string) => {
        if (!confirm("¿Estás seguro de que querés borrar este mensaje?")) return;
        const { error } = await supabase
            .from('inquiries')
            .delete()
            .eq('id', id);

        if (!error) {
            setInquiries(inquiries.filter(inq => inq.id !== id));
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-gray-500 font-sans">Cargando mensajes...</div>;
    }

    return (
        <div className="font-sans">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">Consultas Web</h1>
                    <p className="text-gray-600">Mensajes recibidos desde el formulario de contacto y propiedades.</p>
                </div>
            </div>

            {inquiries.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
                    No hay consultas registradas todavía.
                </div>
            ) : (
                <div className="space-y-4">
                    {inquiries.map((inq) => (
                        <div
                            key={inq.id}
                            className={`bg-white p-6 rounded-xl shadow-sm border-l-4 transition-all ${inq.status === 'pendiente' ? 'border-l-primary border-gray-200' : 'border-l-green-500 border-gray-100 opacity-75'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-lg text-gray-900">{inq.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${inq.status === 'pendiente' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {inq.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                                        <a href={`mailto:${inq.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                                            📧 {inq.email}
                                        </a>
                                        <a href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-600 transition-colors">
                                            📱 {inq.phone}
                                        </a>
                                        <span className="text-xs text-gray-400">• Recibido el {new Date(inq.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    {/* SECCIÓN CORREGIDA: Lógica de Propiedad vs Consulta General */}
                                    <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded border border-gray-200 text-sm">
                                        <span className="text-gray-500">Consulta por:</span>
                                        {!inq.property_id ? (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                                Contacto Directo / General
                                            </span>
                                        ) : inq.properties ? (
                                            <Link href={`/propiedades/${inq.property_id}`} target="_blank" className="font-bold text-primary hover:underline">
                                                {inq.properties.title} <span className="font-normal opacity-70">({inq.properties.operation_type})</span>
                                            </Link>
                                        ) : (
                                            <span className="text-red-500 font-bold italic text-xs">Propiedad borrada</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => toggleStatus(inq.id, inq.status)}
                                        className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${inq.status === 'pendiente'
                                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                            : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                                            }`}
                                    >
                                        {inq.status === 'pendiente' ? '✅ Marcar contactado' : '↩️ Pendiente'}
                                    </button>
                                    <button
                                        onClick={() => deleteInquiry(inq.id)}
                                        className="px-3 py-1.5 rounded text-sm font-semibold bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-700 border border-gray-200 transition-colors"
                                    >
                                        🗑️ Borrar
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 text-sm whitespace-pre-wrap italic">
                                "{inq.message}"
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}