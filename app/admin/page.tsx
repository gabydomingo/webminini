'use client'

// ============================================================
//  Panel — inicio
// ============================================================
//  POR QUÉ SE REHIZO LA PARTE DE MÉTRICAS
//
//  Antes el panel se traía las visitas crudas y hacía las cuentas acá:
//
//      supabase.from('page_views')
//              .select('device, created_at, session_id')
//              .gte('created_at', hace30dias)      // sin limit, sin order
//
//  Supabase corta toda consulta sin límite en 1.000 filas y responde
//  «éxito», sin error. Por eso la tarjeta de clics mostraba exactamente
//  1000: era el tope, no el dato. Y sin ORDER BY las 1.000 que llegaban
//  eran las MÁS VIEJAS de la ventana, así que el gráfico de los últimos
//  7 días se dibujaba vacío mientras las tarjetas decían mil visitas.
//
//  Ahora las cuentas las hace Postgres y devuelve UNA fila de ~1 KB en
//  lugar de 1.000 filas de ~80 KB. Es exacto, es más rápido y gasta
//  menos egress del plan free. La función está en
//  backup/sql/06-metricas-panel.sql.
// ============================================================

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { avisarCambio } from '../lib/revalidar'
import { rutaPropiedad } from '../lib/slug'

// ─── Lo que devuelve metricas_panel() ───────────────────────

type DiaSerie = { dia: string; visitas: number; personas: number }

type TopPropiedad = {
  id: string
  title: string
  property_type: string | null
  operation_type: string | null
  localidad: string | null
  status: string
  vistas: number
  personas: number
  consultas: number
}

type Metricas = {
  visitas_30d: number
  personas_30d: number
  celular_30d: number
  pc_30d: number
  consultas_30d: number
  consultas_pendientes: number
  propiedades_activas: number
  propiedades_totales: number
  ultima_carga: string | null
  serie_7d: DiaSerie[]
  top_propiedades: TopPropiedad[]
}

// ─── Helpers de presentación ────────────────────────────────

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/**
 * "2026-10-07" → "7 oct".
 *
 * A mano y no con `new Date(cadena)`: esa forma interpreta la cadena como
 * medianoche UTC y después la muestra en hora local, así que en Argentina
 * (−3) devolvía el día ANTERIOR. Ese era el otro bug del gráfico: las
 * etiquetas iban corridas un día respecto de las barras.
 */
function etiquetaDia(iso: string): string {
  const [, mes, dia] = iso.split('-')
  return `${Number(dia)} ${MESES[Number(mes) - 1] ?? ''}`
}

/** "hoy 14:32", "ayer 09:10" o "4 oct" según cuánto hace. */
function cuandoFue(iso: string | null): string {
  if (!iso) return 'sin datos'
  const f = new Date(iso)
  if (Number.isNaN(f.getTime())) return 'sin datos'

  const hoy = new Date()
  const soloDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dias = Math.round((soloDia(hoy) - soloDia(f)) / 86_400_000)
  const hora = f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  if (dias === 0) return `Hoy, ${hora}`
  if (dias === 1) return `Ayer, ${hora}`
  return f.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function porcentaje(parte: number, total: number): number {
  if (!total) return 0
  return Math.round((parte / total) * 100)
}

// ─── Componente ─────────────────────────────────────────────

export default function AdminDashboard() {
  const [m, setM] = useState<Metricas | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [faltaSql, setFaltaSql] = useState(false)

  const [refrescando, setRefrescando] = useState(false)
  const [avisoRefresco, setAvisoRefresco] = useState<string | null>(null)

  // El cargador vive DENTRO del efecto a propósito. Definido afuera con
  // useCallback, la regla react-hooks/set-state-in-effect lo marca como
  // "setState directo dentro de un efecto", porque no puede ver que los
  // setState ocurren después de un await.
  useEffect(() => {
    let vigente = true

    const cargar = async () => {
      const { data, error } = await supabase.rpc('metricas_panel')
      if (!vigente) return

      if (error) {
        console.error('[panel] metricas_panel falló:', error)
        // PGRST202 = la función todavía no existe en este proyecto.
        if (error.code === 'PGRST202' || /function|schema cache/i.test(error.message)) {
          setFaltaSql(true)
        } else {
          setErrorMsg(error.message)
        }
        setLoading(false)
        return
      }

      setM(data as Metricas)
      setLoading(false)
    }

    cargar()

    // Si el admin se va de la página antes de que vuelva la consulta, no
    // intentamos tocar el estado de un componente ya desmontado.
    return () => {
      vigente = false
    }
  }, [])

  const refrescarWeb = async () => {
    setRefrescando(true)
    setAvisoRefresco(null)
    const ok = await avisarCambio()
    setRefrescando(false)
    setAvisoRefresco(
      ok
        ? 'Listo: la web pública se está regenerando.'
        : 'No se pudo avisar. Probá cerrar sesión y volver a entrar.'
    )
    setTimeout(() => setAvisoRefresco(null), 6000)
  }

  const dato = (v: number | undefined) => (loading ? '...' : String(v ?? 0))

  const serie = m?.serie_7d ?? []
  const maxSerie = serie.length ? Math.max(...serie.map((d) => d.visitas)) : 0
  const hayTrafico = maxSerie > 0

  const celular = porcentaje(m?.celular_30d ?? 0, m?.visitas_30d ?? 0)
  const pc = m?.visitas_30d ? 100 - celular : 0
  const conversion = m?.personas_30d
    ? ((m.consultas_30d / m.personas_30d) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="font-sans">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">¡Hola! Bienvenido al panel</h1>
      <p className="text-gray-600 mb-8">Desde aquí podrás gestionar todo el contenido y analizar el rendimiento de Minini Propiedades.</p>

      {faltaSql && (
        <div role="alert" className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">Falta un paso en la base de datos</p>
          <p>
            Las métricas de tráfico las calcula una función que todavía no está creada en Supabase.
            Corré <code className="font-mono bg-amber-100 px-1 rounded">backup/sql/06-metricas-panel.sql</code> en
            el SQL Editor y recargá esta página.
          </p>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="mb-8 rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">
          No se pudieron leer las métricas: {errorMsg}
        </div>
      )}

      {/* ── SECCIÓN 1: CATÁLOGO ── */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4 font-serif border-b pb-2">Gestión de Catálogo</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-primary flex flex-col justify-between transition-transform hover:-translate-y-1">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Propiedades Activas</h3>
            <p className="text-4xl font-bold text-gray-900">{dato(m?.propiedades_activas)}</p>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {loading ? ' ' : `${m?.propiedades_totales ?? 0} publicadas en total`}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500 flex flex-col justify-between transition-transform hover:-translate-y-1">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Consultas Pendientes</h3>
            <p className="text-4xl font-bold text-gray-900">{dato(m?.consultas_pendientes)}</p>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {loading ? ' '
              : (m?.consultas_pendientes ?? 0) > 0
                ? 'Requieren tu atención'
                : 'Todo al día'}
          </div>
        </div>

        {/* Antes esta tarjeta decía "Hoy, 10:00 AM" escrito a mano en el
            código, y el botón no tenía onClick. Ahora muestra la fecha real
            de la última propiedad cargada y el botón regenera la web. */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-secondary flex flex-col justify-between transition-transform hover:-translate-y-1">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Última carga</h3>
            <p className="text-xl font-bold text-gray-900 mt-2">
              {loading ? '...' : cuandoFue(m?.ultima_carga ?? null)}
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={refrescarWeb}
              disabled={refrescando}
              className="text-xs font-semibold text-secondary hover:text-secondary-hover disabled:opacity-50 text-left transition-colors"
            >
              {refrescando ? 'Actualizando…' : 'Forzar actualización de la web →'}
            </button>
            {avisoRefresco && <p className="text-[11px] text-gray-500 mt-1.5">{avisoRefresco}</p>}
          </div>
        </div>

      </div>

      {/* ── SECCIÓN 2: TRÁFICO ── */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4 font-serif border-b pb-2">Rendimiento Web (Últimos 30 días)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-500">Personas Distintas</h3>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">Únicos</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{dato(m?.personas_30d)}</p>
        </div>

        {/* Antes decía "Total de Clics". No eran clics: se guardaba una sola
            fila por sesión, así que medía casi lo mismo que la tarjeta de
            al lado. Ahora sí se registra cada página distinta que se mira. */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-500">Páginas Vistas</h3>
            <span className="p-1.5 bg-gray-50 text-gray-600 rounded text-xs font-bold">Vistas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{dato(m?.visitas_30d)}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {loading || !m?.personas_30d
              ? ' '
              : `${(m.visitas_30d / m.personas_30d).toFixed(1)} páginas por persona`}
          </p>
        </div>

        {/* Antes dividía por las consultas con estado 'pendiente', así que
            la conversión BAJABA a medida que se iban atendiendo. Ahora son
            las consultas recibidas en la ventana sobre las personas de la
            misma ventana. */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-gray-500">Tasa de Conversión</h3>
            <span className="p-1.5 bg-green-50 text-green-600 rounded text-xs font-bold">Consultas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : `${conversion}%`}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {loading ? ' ' : `${m?.consultas_30d ?? 0} consultas en 30 días`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-500">Dispositivos</h3>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 flex overflow-hidden">
            <div className="bg-primary h-2.5 transition-all duration-1000" style={{ width: `${celular}%` }}></div>
            <div className="bg-secondary h-2.5 transition-all duration-1000" style={{ width: `${pc}%` }}></div>
          </div>
          <div className="text-sm font-medium text-gray-700 flex justify-between px-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Celular ({celular}%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> PC ({pc}%)</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── GRÁFICO ── */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col relative overflow-hidden">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Tráfico (Últimos 7 días)</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary opacity-30"></span> Vistas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-secondary"></span> Personas</span>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Cargando gráfico...</div>
          ) : !hayTrafico ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm text-center px-6">
              Todavía no hay visitas registradas en los últimos 7 días.
            </div>
          ) : (
            <div className="w-full flex-1 flex items-end justify-between gap-2 md:gap-5 px-2 mt-auto">
              {serie.map((d) => {
                const altoVistas = d.visitas > 0 ? Math.max((d.visitas / maxSerie) * 100, 4) : 2
                // Proporción de personas DENTRO de la barra de vistas.
                // Antes esto era (unique / count) sin proteger el cero y
                // devolvía NaN%, que el navegador ignora en silencio.
                const propPersonas = d.visitas > 0 ? (d.personas / d.visitas) * 100 : 0

                return (
                  <div key={d.dia} className="flex flex-col items-center justify-end w-full group h-full relative">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-10 text-center whitespace-nowrap">
                      {d.personas} personas <br /> {d.visitas} vistas
                    </div>

                    <div
                      className="w-full bg-primary/20 rounded-t-md transition-all duration-500 relative flex items-end justify-center"
                      style={{ height: `${altoVistas}%` }}
                    >
                      <div
                        className="w-[60%] bg-secondary rounded-t-sm transition-all duration-500"
                        style={{ height: `${propPersonas}%` }}
                      ></div>
                    </div>

                    <span className="text-[10px] md:text-xs text-gray-400 mt-3 whitespace-nowrap">
                      {etiquetaDia(d.dia)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── PROPIEDADES MÁS VISTAS ── */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col overflow-hidden">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">Más vistas (30 días)</h3>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Cargando...</div>
          ) : !m?.top_propiedades?.length ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm text-center px-4">
              Todavía no hay fichas con visitas registradas.
            </div>
          ) : (
            <ol className="flex-1 overflow-y-auto -mx-2">
              {m.top_propiedades.map((p, i) => (
                <li key={p.id} className="px-2">
                  <Link
                    href={rutaPropiedad(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-xs font-bold text-gray-300 w-4 shrink-0 pt-0.5">{i + 1}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-800 truncate group-hover:text-primary transition-colors">
                        {p.property_type} en {p.operation_type}
                      </span>
                      <span className="block text-xs text-gray-400 truncate">
                        {p.localidad ?? p.title}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block text-sm font-bold text-gray-900">{p.vistas}</span>
                      <span className="block text-[10px] text-gray-400">
                        {p.consultas > 0 ? `${p.consultas} consulta${p.consultas > 1 ? 's' : ''}` : 'vistas'}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>

      </div>
    </div>
  )
}
