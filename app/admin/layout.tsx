'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Chequeo inicial
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        if (pathname !== '/admin/login') {
          router.push('/admin/login')
        }
      } else {
        setLoading(false)
      }
    }
    
    checkAuth()

    // 2. Escuchador de estado (¡Esto previene el error del Refresh Token!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          // Si el token es inválido o el usuario se deslogueó, lo mandamos al login
          if (pathname !== '/admin/login') {
             router.push('/admin/login')
          }
        }
      }
    )

    // Limpiamos el escuchador cuando el componente se desmonta
    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // Pantalla de carga mientras verifica
  if (loading && pathname !== '/admin/login') {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-sans">
              Verificando credenciales...
          </div>
      )
  }

  // Si estamos en la página de login, no mostramos el Sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold tracking-tight font-serif">Admin<span className="text-primary">Minini</span></h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Backoffice</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 mt-4 px-4">Panel</div>
          <Link
            href="/admin"
            className={`block px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${pathname === '/admin' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            📊 Dashboard
          </Link>
          <Link
            href="/admin/consultas"
            className={`block px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${pathname === '/admin/consultas' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            💬 Consultas Web
          </Link>

          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 mt-6 px-4">Inmobiliaria</div>
          <Link
            href="/admin/propiedades"
            className={`block px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${pathname === '/admin/propiedades' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            🏠 Mis Propiedades
          </Link>
          <Link
            href="/admin/propiedades/nueva"
            className={`block px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${pathname === '/admin/propiedades/nueva' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            ➕ Cargar Nueva
          </Link>

          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 mt-6 px-4">Configuración</div>
          <Link
            href="/admin/opciones"
            className={`block px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${pathname === '/admin/opciones' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            📋 Listas y Categorías
          </Link>
          <Link
            href="/admin/redes"
            className={`block px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${pathname === '/admin/redes' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            📱 Videos Home
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white hover:bg-red-900/50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}