# Seguridad — qué está mal y cómo se arregla

**Verificado el 13/08/2026 sobre el código y el `.env.local` reales.**

---

## El problema, en una línea

La clave que le entregás a cada visitante de la web es la **llave maestra de tu base de datos**.

Lo confirmé decodificando tus dos claves:

```
🚨 NEXT_PUBLIC_SUPABASE_ANON_KEY    → role: service_role
🔒 SUPABASE_SERVICE_ROLE_KEY        → role: service_role
🚨 Las dos son EXACTAMENTE la misma clave.
```

`NEXT_PUBLIC_*` significa "empaquetar esto dentro del JavaScript que descarga el navegador". Ese token se usa en `app/lib/supabase.ts`, y desde ahí lo importan el panel de admin, el formulario de contacto y el tracker de visitas. O sea: **está en el bundle de producción de `propiedadesminini.com` ahora mismo.**

`service_role` es el rol que **saltea todas las reglas de seguridad**. Con esa clave, cualquiera que abra las herramientas de desarrollador puede:

- borrar o modificar las 150 propiedades
- leer nombre, teléfono y mail de **todas las consultas** que te dejaron
- vaciar el bucket de fotos
- crearse un usuario administrador

No hay indicios de que haya pasado nada de esto. Pero la puerta está abierta.

**Lo bueno:** `.gitignore` ya excluye `.env*` y verifiqué con `git ls-files` que ningún archivo de entorno está versionado. La filtración es solo por el bundle del navegador, no por GitHub.

---

## Por qué la web igual funcionaba

Tus tablas **no tienen RLS activado**. Con la service_role eso daba lo mismo, porque esa clave lo saltea igual. Por eso nunca notaste nada raro.

Y acá está la trampa: **si cambiás sola la clave por la anon correcta, la web deja de funcionar.** Sin RLS y sin políticas, la anon key no puede leer nada. Los dos cambios van juntos, en este orden.

---

## Los pasos, en orden

### 1. Ejecutar las políticas de seguridad

Archivo: **`backup/seguridad-rls.sql`** → SQL Editor → Run.

Activa RLS en las 5 tablas y crea las políticas. Lo probé levantando un PostgreSQL 16 real, restaurando tus datos y ejecutándolo. Resultado de las pruebas por rol:

| Prueba | `anon` (visitante) | `authenticated` (vos logueado) |
|---|---|---|
| Ver propiedades | ✅ 150 | ✅ 150 |
| Ver opciones del buscador | ✅ 38 | ✅ 38 |
| Ver videos del home | ✅ 3 | ✅ 3 |
| **Leer consultas de clientes** | 🔒 **0 filas** | ✅ las ve todas |
| **Leer analytics** | 🔒 **0 filas** | ✅ 7526 |
| Dejar una consulta | ✅ se guarda | ✅ |
| Registrar una visita | ✅ se guarda | ✅ |
| Modificar propiedades | 🔒 **UPDATE 0** | ✅ UPDATE 150 |
| Borrar propiedades | 🔒 **DELETE 0** | ✅ |

La fila que más importa: un visitante **puede dejarte una consulta pero no puede leer las de nadie**. Hoy podía leerlas todas.

### 2. Rotar todas las credenciales

Hay que hacerlo sí o sí: las claves viejas circularon (bundle del navegador, y además me las compartiste a mí en este chat).

| Dónde | Qué hacer |
|---|---|
| Settings → API | **Rotate** de `service_role` y de `anon` |
| Settings → Database | Cambiar la contraseña de Postgres |
| Storage → S3 Access Keys | Revocar la actual y crear una nueva |

> Esto requiere que el proyecto esté despausado. Si terminás creando un proyecto nuevo, el problema se resuelve solo: arranca con claves limpias.

### 3. Dejar cada clave en su lugar

```bash
# .env.local

# 🌐 Pública — viaja al navegador. Tiene que decir role: "anon"
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<la anon de verdad>

# 🔒 Privadas — NUNCA con prefijo NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=<la service_role>
DATABASE_URL=postgresql://...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

Acordate de actualizarlas también en **Vercel → Settings → Environment Variables**, y de hacer un redeploy para que el bundle nuevo reemplace al que hoy tiene la clave vieja.

### 4. Reemplazar los archivos de cliente

Te dejé dos:

- **`app/lib/supabase.ts`** — el cliente del navegador, con un guardián que **decodifica la clave y revienta el build** si detecta una `service_role`. Este error no puede volver a llegar a producción sin que te enteres.
- **`app/lib/supabaseAdmin.ts`** — cliente de servidor para cuando necesites saltear RLS (por ejemplo, subir fotos desde una API route). Usa `import 'server-only'`, así que si alguien lo importa desde un componente `'use client'` el build falla solo.

```bash
npm i server-only    # requerido por supabaseAdmin.ts
```

Para el panel `/admin` **no necesitás el cliente admin**: ya usás `supabase.auth.signInWithPassword`, así que quedás con rol `authenticated` y las políticas del paso 1 te habilitan todo. Tu autenticación estaba bien planteada — el problema era solo la clave.

### 5. Verificar

```bash
node scripts/auditar-claves.mjs
```

Tiene que terminar en `✅ Sin claves privadas expuestas al navegador`. Hoy termina con 2 problemas críticos. Corrélo cada vez que toques el `.env.local`; devuelve código de salida 1 si algo está mal, así que también sirve en CI.

---

## Un detalle aparte: el tracker de visitas

`AnalyticsTracker.tsx` inserta en `page_views` desde el navegador. Es correcto y las políticas lo permiten, pero como es un endpoint de escritura abierto, cualquiera puede inflar la tabla. Hoy tenés 7525 filas y pesa nada, así que no es urgente. Dos mitigaciones cuando quieras:

- Borrar lo viejo cada tanto (hay una consulta lista al final de `seguridad-rls.sql`).
- O mover el insert a una API route con un rate limit simple.

---

## Resumen

| | Antes | Después |
|---|---|---|
| Clave en el navegador | `service_role` (llave maestra) | `anon` (pública por diseño) |
| RLS | apagado | activo en las 5 tablas |
| Consultas de clientes | las leía cualquiera | solo vos |
| Analytics | los leía cualquiera | solo vos |
| Escritura en propiedades | abierta | solo admin logueado |
| Si alguien repite el error | pasaba desapercibido | **falla el build** |
