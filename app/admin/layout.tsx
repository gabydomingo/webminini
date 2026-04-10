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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Verificando credenciales...</div>

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-100">

      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold tracking-tight">Admin<span className="text-red-500">Minini</span></h2>
          <p className="text-xs text-gray-400 mt-1">Backoffice de Gestión</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 px-4">Principal</div>
          <Link
            href="/admin"
            className={`block px-4 py-2.5 rounded-lg transition ${pathname === '/admin' ? 'bg-red-900 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            📊 Dashboard
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-4">Inmobiliaria</div>
          <Link
            href="/admin/propiedades"
            className={`block px-4 py-2.5 rounded-lg transition ${pathname === '/admin/propiedades' ? 'bg-red-900 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            🏠 Mis Propiedades
          </Link>
          <Link
            href="/admin/propiedades/nueva"
            className={`block px-4 py-2.5 rounded-lg transition ${pathname === '/admin/propiedades/nueva' ? 'bg-red-900 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            ➕ Cargar Nueva
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-4">Configuración</div>
          <Link
            href="/admin/opciones"
            className={`block px-4 py-2.5 rounded-lg transition ${pathname === '/admin/opciones' ? 'bg-red-900 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            📋 Listas y Categorías
          </Link>
          <Link
            href="/admin/redes"
            className={`block px-4 py-2.5 rounded-lg transition ${pathname === '/admin/redes' ? 'bg-red-900 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            📱 Videos Home
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}