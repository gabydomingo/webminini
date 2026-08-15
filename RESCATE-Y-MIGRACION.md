# Minini Propiedades — Rescate y migración a costo cero

**Fecha:** 13 de agosto de 2026
**Web actual:** `propiedadesminini.com` (Next.js) — online, pero muestra *"No hay propiedades destacadas en este momento"*
**Web vieja:** `administracionminini.com` (WordPress) — ⚠️ el dominio ya no existe, no resuelve por DNS
**Base de datos:** proyecto Supabase `cvgnpyzgglrclzxxlbsp`, pausado

---

## 1. Qué pasó, en números

Analicé el backup `db_cluster13082026082759.backup.gz`. El diagnóstico es claro y no es la base de datos:

| Recurso | Tu uso real | Límite plan Free | Estado |
|---|---|---|---|
| **Storage (fotos)** | **3.18 GB** | 1 GB | 🔴 **318 % — esto te rompió todo** |
| Base de datos | ~12 MB | 500 MB | 🟢 2 % |
| Proyectos activos | 1 | 2 | 🟢 OK |

Desglose del storage:

- **3142 archivos** en total (bucket `propiedades` 3113 + `FotosPagina` 29)
- **2817 fotos** referenciadas por las 150 propiedades publicadas → **2.74 GB**
- **296 fotos huérfanas** (de propiedades borradas, nadie las usa) → **449 MB**
- **Peso promedio por foto: 1.07 MB.** Hay 870 fotos de más de 500 KB y una de 12 MB.

**La causa raíz:** el panel de administración sube las fotos tal cual salen del celular, sin comprimir ni redimensionar. Con ~19 fotos por propiedad y 1 MB cada una, cada propiedad nueva te come 20 MB. A las 50 propiedades ya te habías comido el gigabyte gratis.

Y hay un segundo problema, silencioso: el plan Free da **5 GB de tráfico de salida por mes**. Como el listado muestra las fotos originales de 1 MB para dibujarlas a 400 px de ancho, cada visitante que recorre unas pocas propiedades descarga decenas de megas. Aunque el storage entrara en 1 GB, el tráfico te iba a pausar el proyecto igual.

> **En criollo:** no tenés un problema de plan, tenés un problema de peso de imágenes. Se arregla de raíz y te va a sobrar espacio para años.

---

## 2. 🚨 Antes que nada: tenés las llaves maestras publicadas

Esto es más urgente que la web caída. En tu `.env.local`:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  ← el rol adentro de este token dice "service_role"
```

**Esa no es la clave anónima: es la `service_role`, la llave que saltea todas las reglas de seguridad.** Y al llamarse `NEXT_PUBLIC_*`, Next.js la mete dentro del JavaScript que se descarga en el navegador de cualquier visitante. Hoy, quien abra las herramientas de desarrollador en tu web puede sacarla y **leer, modificar o borrar toda tu base de datos y todos tus archivos**.

Se usa igual en `migracion.js` y en `app/lib/supabase.ts`.

Sumado a esto: la contraseña de Postgres y las claves S3 también quedaron expuestas al compartir el archivo. Hay que rotar todo.

**Qué hacer cuando el proyecto vuelva a estar activo (o en el proyecto nuevo, si armás uno):**

1. Settings → API → **Rotate** de la `service_role` y la `anon`.
2. Settings → Database → cambiar la contraseña de Postgres.
3. Storage → S3 Access Keys → revocar y crear de nuevo.
4. En `.env.local`, dejar cada una en su lugar:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<la anon de verdad, la que dice "role":"anon">
   SUPABASE_SERVICE_ROLE_KEY=<la service_role — SIN el prefijo NEXT_PUBLIC_, nunca>
   ```
5. Activar **RLS (Row Level Security)** en `properties`, `inquiries`, `site_settings` y `form_options`: lectura pública, escritura solo autenticado. Sin RLS, con la anon key sola cualquiera puede escribir en tus tablas.

Lo bueno: `.gitignore` ya excluye `.env*` y confirmé que ningún archivo de entorno está versionado en GitHub. La filtración es solo por el bundle del navegador.

---

## 3. Lo que ya recuperé (está en la carpeta `backup/`)

Del backup saqué toda la base y la dejé lista para restaurar en cualquier Postgres. **Probé el archivo levantando un PostgreSQL 16 real y restaurando: entra limpio.**

| Archivo | Qué es |
|---|---|
| `backup/restaurar-db.sql` | Esquema + datos completos. 150 propiedades, 38 opciones de formulario, 3 ajustes del sitio, 7525 visitas. Se pega en el SQL Editor y listo. |
| `backup/properties.json` | Las 150 propiedades en JSON (con sus 2817 URLs de fotos). |
| `backup/bucket_usage.json` | Índice de los 3142 archivos: nombre, peso, y si está en uso o es huérfano. |
| `backup/form_options.json`, `site_settings.json`, `inquiries.json` | El resto de las tablas. |

**Tu base de datos ya está a salvo.** Lo único que sigue atrapado en Supabase son los archivos de imagen: el backup guarda el *listado* de fotos, no las fotos.

---

## 4. Rescatar las 2817 fotos

El error que te tira Supabase —`Failed to create storage archive: The project storage size of 3.4 GB exceeds the limit`— es porque al pausar el proyecto intenta archivar el storage y no puede con ese tamaño. Hay tres caminos, en este orden:

### Camino A — Probar si el storage sigue vivo (gratis, 30 segundos)

Cuando Supabase pausa un proyecto apaga la base, pero el bucket vive en otro host (`*.storage.supabase.co`) que a veces sigue sirviendo archivos. Si es tu caso, bajás todo gratis y hoy.

```bash
node scripts/00-test-storage.mjs          # corre sin instalar nada
npm i @aws-sdk/client-s3                  # y volvé a correrlo: agrega la prueba clave
node scripts/00-test-storage.mjs
```

Da verde → seguí con `node scripts/01-rescate-imagenes.mjs` y en un rato tenés las 2817 fotos en tu disco.

**Cómo leer el resultado.** El script ahora te explica cada error:

| Lo que dice | Qué significa |
|---|---|
| `DNS — el host no existe` | Supabase le sacó el registro DNS. Ese host está apagado de verdad. |
| `HTTP 403 / Unauthorized` | El host **existe y contesta**. Es tema de credenciales o permisos, no de pausa. Vale insistir. |
| menciona `allowlist`, proxy o firewall | Te está bloqueando tu propia red, no Supabase. Probá desde otra conexión. |

Dato alentador: `cvgnpyzgglrclzxxlbsp.supabase.co` (la base) **ya no resuelve**, pero `cvgnpyzgglrclzxxlbsp.storage.supabase.co` (el bucket) **sí sigue existiendo en el DNS**. Son hosts distintos con suertes distintas, y es justo la hipótesis de este camino. Por eso vale la pena correr la prueba con `@aws-sdk/client-s3` instalado.

### Camino B — Ticket a Supabase (gratis, unos días)

Si el Camino A da rojo, entrá a [supabase.com/dashboard/support/new](https://supabase.com/dashboard/support/new) y mandá algo así:

> Project ref: `cvgnpyzgglrclzxxlbsp`. My project is paused and I cannot restore it — the dashboard returns *"Failed to create storage archive: The project storage size of 3.4 GB exceeds the limit for the storage archive."* I only need temporary read access to Storage to download my files, after which I will delete them and stay well under the 1 GB free limit. Could you please either raise the archive limit once, or provide a way to export the bucket?

Es un pedido razonable y habitual; suelen destrabarlo.

### Camino C — Un mes de Pro (~USD 25, seguro e inmediato)

Reactivás Pro, el proyecto vuelve, bajás todo, comprimís, migrás a R2, borrás el bucket de Supabase y volvés a Free. Un solo cobro, nunca más.

**Mi recomendación:** corré el Camino A ahora mismo. Si da rojo, mandá el ticket del Camino B **hoy**, para que empiece a correr el reloj. Si en 4–5 días no hay respuesta, pagá el mes de Pro sin dudarlo — y acá está el por qué:

### ❌ Camino D — El WordPress viejo: descartado

Esta era la red de seguridad gratis, pero **se cayó**. El `prod-nini.csv` tiene 740 URLs de fotos de 54 propiedades alojadas en `administracionminini.com`, y verifiqué que:

- El dominio **no resuelve por DNS**, ni `administracionminini.com` ni `www.`, ni en HTTPS ni en HTTP. Está dado de baja o venció. (Google todavía muestra páginas viejas en los resultados, pero son restos del índice: los links no abren.)
- En el **Archivo de Internet** hay una copia de la portada del 10/06/2026, así que el sitio vivía hace dos meses. De las fotos, la que pude consultar no tiene copia archivada. No llegué a verificar las 740 (archive.org me limitó las consultas), así que esto queda **sin confirmar**: corré `node scripts/rescate-wordpress.mjs --listar` desde tu máquina, que hace el sondeo bien. El Wayback suele guardar páginas y no los `wp-content/uploads`, así que no te ilusiones, pero probarlo es gratis.

El script `rescate-wordpress.mjs` quedó igual y hace los dos chequeos automáticamente por si el dominio revive (`--listar` para diagnosticar, `--wayback` para intentar por el archivo). Pero hoy no hay nada para sacar de ahí.

> **Lo que esto significa:** las 2817 fotos existen en **un solo lugar del mundo**, que es el Storage de Supabase pausado. No hay copia de respaldo en ningún otro lado. Eso cambia el cálculo de los USD 25: dejaron de ser el último recurso para ser un seguro barato.

⏳ **Ojo con el reloj:** Supabase conserva los proyectos pausados un tiempo largo, pero no para siempre. No lo dejes descansar dos meses más.

### Si todo lo anterior falla

Minini publica en **Zonaprop** (~120 avisos) y **Argenprop** (~44 avisos). Las fotos de las propiedades activas están ahí, en resolución reducida y con marca de agua. No es lindo, pero para las propiedades más importantes es una forma de no quedarte sin nada mientras se sacan fotos nuevas. Es trabajo manual: no lo automaticé a propósito.

---

## 5. La arquitectura nueva

```
        HOY (roto)                        DESPUÉS
   ┌──────────────────┐          ┌──────────────────────────┐
   │ Supabase Free    │          │ Supabase Free            │
   │  · base 12 MB ✅ │          │  · base 12 MB      ✅    │
   │  · fotos 3.2 GB ❌│   ──►    │  (sin fotos)             │
   └──────────────────┘          ├──────────────────────────┤
                                 │ Cloudflare R2            │
     1 GB de límite              │  · fotos ~400 MB de 10 GB│
     5 GB de tráfico             │  · tráfico ILIMITADO ✅  │
                                 └──────────────────────────┘
```

**Por qué R2 y no otro:** 10 GB gratis para siempre y **cero costo de tráfico de salida**, que es exactamente lo que te fundió. Pide tarjeta para activarlo pero no cobra nada por debajo del límite. Con las fotos comprimidas vas a usar ~4 % de ese espacio.

Cuentas finales:

| | Antes | Después |
|---|---|---|
| Peso de las fotos | 2.74 GB | **~400 MB** |
| Foto promedio | 1070 KB | **~140 KB** (y 40 KB la miniatura del listado) |
| Dónde viven | Supabase (1 GB) | R2 (10 GB) |
| Tope de tráfico | 5 GB/mes | **sin tope** |
| Costo mensual | USD 25 | **USD 0** |

En la prueba que corrí, una foto de celular pasa de 343 KB a 40 KB + 11 KB de miniatura: **85 % menos**. Tus fotos son más pesadas todavía, así que el ahorro real va a ser mayor.

---

## 6. Los pasos, en orden

```bash
# 0· ¿el storage responde?
node scripts/00-test-storage.mjs

# 1· bajar todo a tu disco (reanudable: si se corta, volvés a correrlo)
node scripts/01-rescate-imagenes.mjs

# 2· comprimir a WebP + generar miniaturas
npm i sharp
node scripts/02-comprimir.mjs

# 3· subir a Cloudflare R2
npm i @aws-sdk/client-s3
node scripts/03-subir-r2.mjs           # prueba en seco
node scripts/03-subir-r2.mjs --subir   # de verdad

# 4· generar el SQL que reescribe las URLs
node scripts/04-actualizar-urls.mjs
#    → pegá backup/actualizar-urls.sql en el SQL Editor
#      (deja una tabla properties_images_backup para volver atrás)
```

**Crear el bucket en R2** (entre el paso 2 y el 3): dashboard de Cloudflare → R2 → *Create bucket* → nombre `webminini` → Settings → *Public access*. Si tenés `administracionminini.com` en Cloudflare, conectale un subdominio `img.administracionminini.com`; es más prolijo y más rápido que el `pub-xxxx.r2.dev`. Después agregá a `.env.local`:

```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=webminini
R2_PUBLIC_URL=https://img.administracionminini.com
```

---

## 7. Cambios en el código (para que no vuelva a pasar)

### a) `next.config.ts` — permitir el dominio de R2

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'img.administracionminini.com' },
    // dejá el de Supabase hasta terminar de migrar, después borralo
  ],
}
```

### b) Comprimir **antes** de subir, en el navegador

Ya tenés `app/lib/imageCompress.ts`. Hay que asegurarse de que el alta y la edición de propiedades lo usen sí o sí, con tope de **1600 px y WebP**. Es el cambio que evita que el problema vuelva: sin esto, en seis meses estás igual pero en R2.

### c) Usar la miniatura en el listado

`PropertyCard.tsx` debería pedir la versión `/thumb/` (40 KB) en vez de la `/full/`. Es la diferencia entre que una visita al listado baje 20 MB o 800 KB.

### d) Separar las claves

`app/lib/supabase.ts` tiene que usar la anon **de verdad**. La `service_role` solo del lado del servidor (route handlers), nunca con prefijo `NEXT_PUBLIC_`.

### e) Limpieza de huérfanas

Tu `scripts/clean-orphans.mjs` ya hace esto y funciona bien — corrélo cada tanto. Además conviene borrar del bucket las fotos de una propiedad cuando se borra la propiedad, cosa que hoy no pasa (por eso hay 449 MB de fotos de propiedades que ya no existen).

---

## 8. Costo total

| Concepto | Costo |
|---|---|
| Cloudflare R2 (10 GB, tráfico ilimitado) | **USD 0** |
| Supabase Free (base de 12 MB sobre 500 MB) | **USD 0** |
| Vercel Hobby | **USD 0** |
| Rescate de las fotos, si hay que ir al Camino C | USD ~25 **por única vez** |

Sobre esos 25 dólares: ahora que el WordPress viejo no está, son la única red que queda si Supabase no destraba el proyecto por soporte. Comparalo con sacar de nuevo las fotos de 150 propiedades — es la decisión fácil.

Con el escenario bueno (Camino A o B) esto te sale **cero pesos** y queda con margen para años. Y lo mismo aplica a tus otros proyectos del rubro: si les hacés el mismo tratamiento de imágenes, ninguno vuelve a acercarse al límite.

---

## 9. Qué hacer hoy mismo

1. **`node scripts/00-test-storage.mjs`** — 30 segundos, define todo lo demás.
2. Si da rojo: **mandar el ticket del Camino B hoy** (el texto está arriba, copiá y pegá). Cuanto antes entre, antes contestan.
3. Ponerte un recordatorio: si el viernes no hubo respuesta, pagar el mes de Pro y bajar todo.
4. Anotar que hay que rotar las claves apenas el proyecto vuelva.

No hace falta que decidas hoy lo de R2 ni toques el código: eso es la parte fácil y no se vence. Lo único que corre contra reloj son las fotos.

---

*Sources: [Supabase Pricing](https://supabase.com/pricing) · [Project Pausing — Supabase Docs](https://supabase.com/docs/guides/platform/free-project-pausing) · [Cloudflare R2](https://www.cloudflare.com/products/r2/) · [R2 free tier](https://r2drop.com/blog/cloudflare-r2-free-tier-guide)*
