// ============================================================
//  Cliente Supabase para el SERVIDOR — saltea RLS
// ============================================================
//  Usa la service_role. Solo puede importarse desde código que corre en el
//  servidor: route handlers (app/api/.../route.ts), server actions o server
//  components. Si lo importás desde un componente 'use client', el import
//  de 'server-only' hace fallar el build a propósito.
//
//  Cuándo lo vas a necesitar de verdad:
//    · subir/borrar imágenes desde una API route (así el token de escritura
//      no viaja al navegador)
//    · tareas de mantenimiento o migraciones
//
//  Para el panel /admin NO hace falta: ahí el usuario se loguea con
//  supabase.auth y queda con rol `authenticated`, que las políticas de
//  seguridad-rls.sql ya habilitan para todo.
// ============================================================

import 'server-only'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. ' +
      'La service_role va SIN el prefijo NEXT_PUBLIC_.'
  )
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
