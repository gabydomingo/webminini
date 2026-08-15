// ============================================================
//  Cliente Supabase para el NAVEGADOR
// ============================================================
//  Este archivo se empaqueta dentro del JavaScript que descarga cualquier
//  visitante de la web. Por lo tanto, la única clave que puede aparecer acá
//  es la ANÓNIMA (anon / publishable). Es pública por diseño: no da permisos
//  por sí sola, quien manda es RLS.
//
//  ⚠️  NUNCA pongas acá la service_role. Esa clave saltea RLS y equivale a
//     entregarle a cada visitante la contraseña de la base. Para eso está
//     supabaseAdmin.ts, que solo corre del lado del servidor.
//
//  El guardián de abajo revienta el build si alguien vuelve a confundirlas.
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Revisá .env.local (y las variables de entorno en Vercel).'
  )
}

/**
 * Devuelve el "role" que declara una clave de Supabase, o null si no se puede
 * determinar. Soporta las claves JWT viejas y el formato nuevo sb_*.
 */
function rolDeLaClave(key: string): string | null {
  if (key.startsWith('sb_secret_')) return 'service_role'
  if (key.startsWith('sb_publishable_')) return 'anon'

  const partes = key.split('.')
  if (partes.length !== 3) return null
  try {
    const json = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const texto =
      typeof atob === 'function'
        ? atob(json)
        : Buffer.from(json, 'base64').toString('utf-8')
    return (JSON.parse(texto)?.role as string) ?? null
  } catch {
    return null
  }
}

const rol = rolDeLaClave(supabaseKey)

if (rol === 'service_role') {
  const mensaje =
    '🚨 SEGURIDAD: NEXT_PUBLIC_SUPABASE_ANON_KEY contiene una clave service_role.\n' +
    '   Esa clave saltea todas las reglas de seguridad y, al llevar el prefijo\n' +
    '   NEXT_PUBLIC_, queda expuesta en el navegador de cada visitante.\n' +
    '   Poné la clave anon (role: "anon") y dejá la service_role únicamente en\n' +
    '   SUPABASE_SERVICE_ROLE_KEY, sin prefijo NEXT_PUBLIC_.'

  if (typeof window === 'undefined') {
    // En servidor y durante `next build`: cortamos acá para que una clave
    // mal puesta no llegue nunca a producción.
    throw new Error(mensaje)
  } else {
    console.error(mensaje)
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
