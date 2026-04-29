'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminDashboard() {
  const [activePropertiesCount, setActivePropertiesCount] = useState<number>(0);
  const [newInquiriesCount, setNewInquiriesCount] = useState<number>(0);

  // Estados para las analíticas reales
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0); // NUEVO ESTADO
  const [mobilePercentage, setMobilePercentage] = useState<number>(0);
  const [desktopPercentage, setDesktopPercentage] = useState<number>(0);
  const [conversionRate, setConversionRate] = useState<string>("0.0");
  const [chartData, setChartData] = useState<{ date: string; count: number, unique: number }[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      // 1. Contar propiedades activas
      const { count: propsCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disponible');

      // 2. Contar consultas pendientes (para tarjeta y para tasa de conversión)
      const { count: inquiriesCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendiente');

      if (propsCount !== null) setActivePropertiesCount(propsCount);
      if (inquiriesCount !== null) setNewInquiriesCount(inquiriesCount);

      // 3. Extraer Analíticas de los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: viewsData } = await supabase
        .from('page_views')
        .select('device, created_at, session_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (viewsData) {
        setTotalVisits(viewsData.length);

        // NUEVO: Calcular Visitantes Únicos (sesiones distintas)
        const uniqueSessions = new Set(viewsData.map(v => v.session_id).filter(Boolean));
        setUniqueVisitors(uniqueSessions.size);

        // Calcular porcentaje de dispositivos
        const mobileViews = viewsData.filter(v => v.device === 'mobile').length;
        const desktopViews = viewsData.length - mobileViews;

        if (viewsData.length > 0) {
          setMobilePercentage(Math.round((mobileViews / viewsData.length) * 100));
          setDesktopPercentage(Math.round((desktopViews / viewsData.length) * 100));

          // Tasa de conversión (Consultas / Visitantes Únicos * 100) -> Es más preciso usar únicos
          const rate = ((inquiriesCount || 0) / (uniqueSessions.size || 1)) * 100;
          setConversionRate(rate.toFixed(1));
        }

        // Armar datos para el gráfico (Últimos 7 días)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        });

        const groupedData = last7Days.map(dateStr => {
          // Visitas totales de este día
          const dayViews = viewsData.filter(v => v.created_at.startsWith(dateStr));
          // Visitantes únicos de este día
          const uniqueDayViews = new Set(dayViews.map(v => v.session_id).filter(Boolean)).size;

          // Solo para mostrar lindo la fecha (ej: "23 Abr")
          const displayDate = new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
          return { date: displayDate, count: dayViews.length, unique: uniqueDayViews };
        });

        setChartData(groupedData);
      }

      setLoading(false);
    };

    fetchDashboardMetrics();
  }, []);

  // Encontrar el valor máximo del gráfico para escalar las barras de HTML (basado en vistas totales)
  const maxChartValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.count)) : 1;

  return (
    <div className="font-sans">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">¡Hola! Bienvenido al panel</h1>
      <p className="text-gray-600 mb-8">Desde aquí podrás gestionar todo el contenido y analizar el rendimiento de Minini Propiedades.</p>

      {/* ── SECCIÓN 1: MÉTRICAS DE LA INMOBILIARIA ── */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4 font-serif border-b pb-2">Gestión de Catálogo</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-primary flex flex-col justify-between transition-transform hover:-translate-y-1">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Propiedades Activas</h3>
            <p className="text-4xl font-bold text-gray-900">
              {loading ? '...' : activePropertiesCount}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            Catálogo actualizado
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500 flex flex-col justify-between transition-transform hover:-translate-y-1">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Consultas Pendientes</h3>
            <p className="text-4xl font-bold text-gray-900">
              {loading ? '...' : newInquiriesCount}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            Requieren tu atención hoy
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-secondary flex flex-col justify-between transition-transform hover:-translate-y-1">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Última Sincronización</h3>
            <p className="text-xl font-bold text-gray-900 mt-2">Hoy, 10:00 AM</p>
          </div>
          <button className="mt-4 text-xs font-semibold text-secondary hover:text-secondary-hover text-left transition-colors">
            Forzar actualización manual →
          </button>
        </div>

      </div>

      {/* ── SECCIÓN 2: MÉTRICAS DE TRÁFICO WEB REALES ── */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4 font-serif border-b pb-2">Rendimiento Web (Últimos 30 días)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        {/* NUEVO: Visitantes Únicos */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-500">Personas Distintas</h3>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">Únicos</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : uniqueVisitors}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-500">Total de Clics</h3>
            <span className="p-1.5 bg-gray-50 text-gray-600 rounded text-xs font-bold">Vistas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : totalVisits}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-500">Tasa de Conversión</h3>
            <span className="p-1.5 bg-green-50 text-green-600 rounded text-xs font-bold">Consultas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : `${conversionRate}%`}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-500">Dispositivos</h3>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 flex overflow-hidden">
            <div className="bg-primary h-2.5 transition-all duration-1000" style={{ width: `${mobilePercentage}%` }}></div>
            <div className="bg-secondary h-2.5 transition-all duration-1000" style={{ width: `${desktopPercentage}%` }}></div>
          </div>
          <div className="text-sm font-medium text-gray-700 flex justify-between px-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Celular ({mobilePercentage}%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> PC ({desktopPercentage}%)</span>
          </div>
        </div>

      </div>

      {/* ── GRÁFICO REAL HTML/CSS ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col relative overflow-hidden">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Tráfico orgánico (Últimos 7 días)</h3>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary opacity-30"></span> Clics</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-secondary"></span> Personas</span>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Cargando gráfico...</div>
        ) : chartData.length === 0 || maxChartValue === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No hay visitas registradas aún.</div>
        ) : (
          <div className="w-full flex-1 flex items-end justify-between gap-2 md:gap-6 px-2 mt-auto">
            {chartData.map((d, i) => {
              const heightViews = Math.max((d.count / maxChartValue) * 100, 5);
              const heightUnique = Math.max((d.unique / maxChartValue) * 100, 2);

              return (
                <div key={i} className="flex flex-col items-center justify-end w-full group h-full relative">
                  {/* Tooltip Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-10 text-center whitespace-nowrap">
                    {d.unique} personas <br /> {d.count} clics
                  </div>

                  {/* Barra de Vistas (Gris/Rojita de fondo) */}
                  <div className="w-full bg-primary/20 rounded-t-md transition-all duration-500 relative flex items-end justify-center" style={{ height: `${heightViews}%` }}>
                    {/* Barra de Únicos (Dorada al frente) */}
                    <div className="w-[60%] bg-secondary rounded-t-sm transition-all duration-500" style={{ height: `${(d.unique / d.count) * 100}%` }}></div>
                  </div>

                  {/* Fecha */}
                  <span className="text-[10px] md:text-xs text-gray-400 mt-3 whitespace-nowrap">{d.date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}