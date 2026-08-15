# Crear el proyecto nuevo — paso a paso

Todo lo que está acá salió de leer tu código y tu backup, no de suponer. Los nombres son **exactos y sensibles a mayúsculas**.

---

## Antes de arrancar: qué te voy a pedir al final

Cuando termines necesito **una sola cosa**:

```
La URL del proyecto:  https://XXXXXXXXXXXXXXXXXXXX.supabase.co
```

**Las claves ponelas vos directamente en tu `.env.local`.** No me las pases: la `service_role` es la llave maestra de la base y ya tuviste una filtrada, no tiene sentido volver a hacerla circular. Con la URL me alcanza para dejarte todo configurado, y el script `auditar-claves.mjs` verifica que las hayas puesto bien sin que yo las vea.

---

## Paso 1 — Cuenta y proyecto

[supabase.com/dashboard](https://supabase.com/dashboard) → registrarte con el mail nuevo → **New project**

| Campo | Qué poner |
|---|---|
| **Name** | `webminini` |
| **Region** | **South America (São Paulo)** — tu proyecto viejo estaba en `sa-east-1`, es la más cercana a la costa |
| **Database Password** | Generá una nueva y guardala en un gestor de contraseñas |

Tarda 2–3 minutos en aprovisionar.

> La cuenta nueva arranca con su propia organización en plan free, así que entrás sin problema en el límite de 2 proyectos activos. Cuando destrabemos el proyecto viejo y migremos todo, lo ideal es volver a dejar una sola cuenta.

## Paso 2 — Los tres SQL, en este orden

SQL Editor → **New query** → pegar el contenido → **Run**. Uno por vez.

| # | Archivo | Qué deja |
|---|---|---|
| 1 | `backup/restaurar-db.sql` | Las 5 tablas + 150 propiedades + 38 opciones + 3 ajustes |
| 2 | `backup/setup-proyecto-nuevo.sql` | Los 2 buckets y la vista de control de uso |
| 3 | `backup/seguridad-rls.sql` | RLS y las políticas |

Al terminar el 2 tenés que ver exactamente esto:

```
 propiedades | opciones_formulario | ajustes_sitio | buckets
         150 |                  38 |             3 |       2
```

Y al terminar el 3, las 5 tablas en `true`.

## Paso 3 — Verificar los buckets

Storage → tienen que aparecer **dos**, con estos nombres exactos:

| Bucket | Ojo con | Para qué |
|---|---|---|
| `propiedades` | todo en minúscula | las fotos de cada propiedad |
| `FotosPagina` | **F y P mayúsculas** | logos, hero, fotos de Román y Juan |

⚠️ Si el nombre no coincide letra por letra, las imágenes dan 404 y el error es dificilísimo de ver. El SQL del paso 2 ya los crea bien; esto es solo para confirmar que están y figuran como **Public**.

## Paso 4 — Usuario administrador

Authentication → Users → **Add user** → *Create new user*

- Email y contraseña con los que van a entrar a `/admin/login`
- ✅ Marcá **Auto Confirm User**, si no queda esperando un mail de confirmación

Sin este usuario no podés administrar nada: las políticas de RLS le dan permiso total al rol `authenticated`, y este es el único que lo tiene.

## Paso 5 — Las claves en tu `.env.local`

Settings → API. Estos son los nombres **exactos** que lee tu código:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref-nuevo>.supabase.co

# "anon public" — al decodificarla dice role: anon
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>

# "service_role secret" — SIN prefijo NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=<service_role>
```

Y si vas a usar los scripts de descarga masiva, Storage → S3 Access Keys:

```bash
S3_REGION=sa-east-1
S3_ACCES_KEY=<access key>        # sí, va con el typo: así lo lee tu código
S3_SECRET_KEY=<secret>
S3_ENDPOINT=https://<ref-nuevo>.storage.supabase.co/storage/v1/s3
```

Verificá antes de seguir:

```bash
node scripts/auditar-claves.mjs
```

Tiene que decir `✅ Sin claves privadas expuestas al navegador`.

## Paso 6 — Apuntar el código al proyecto nuevo

El ref viejo está escrito a mano en **13 lugares de 7 archivos** (los logos del header y el footer, el hero, las fotos de Sobre Nosotros, los metadatos del layout y el `next.config.ts`). Este script los cambia todos de una:

```bash
node scripts/cambiar-proyecto.mjs <ref-nuevo>            # muestra qué cambiaría
node scripts/cambiar-proyecto.mjs <ref-nuevo> --aplicar  # lo hace
```

Hacé `git commit` de lo que tengas antes, así podés volver con `git checkout .`. Lo probé: cambia los 13, es idempotente y no se rompe si lo corrés dos veces.

Y activá el cliente seguro:

```bash
mv app/lib/supabase.seguro.ts app/lib/supabase.ts
npm i server-only
```

## Paso 7 — Rescatar los logos ⭐

**Esto es más urgente de lo que parece.** Los 29 archivos de `FotosPagina` (6.8 MB) son toda la identidad visual del sitio, y están en el proyecto pausado: el logo del header, el hero de la portada, las fotos de Román y Juan, los sellos del Colegio y de la Cámara.

Pero hay una chance concreta de recuperarlos gratis: esas imágenes pasan por el optimizador de Next.js, y **Vercel guarda en caché las versiones optimizadas**. Puede que sigan disponibles aunque Supabase esté caído.

```bash
node scripts/rescate-fotospagina.mjs --listar   # ver el plan
node scripts/rescate-fotospagina.mjs            # intentar bajarlas
```

Lo que rescate queda en `backup/fotospagina/`. Subilo al bucket `FotosPagina` del proyecto nuevo **con los mismos nombres de archivo** (Storage → FotosPagina → Upload). Si respetás los nombres, el código los encuentra solo.

De los 29, estos 9 son los críticos:

```
⭐ logo-letra-negra.png              logo del header (tema claro)
⭐ 1.png                             logo del header (tema oscuro)
⭐ 2.png                             logo del detalle de propiedad
⭐ heroprueba.png                    imagen grande de la portada
⭐ romanminini.jpeg                  foto de Román
⭐ fanco.jpg                         foto de Juan
⭐ logo-blanco-colegio3-min.png      sello Colegio de Martilleros
⭐ Logo-Camara-con-sigla_BLANCO3.png sello Cámara
⭐ Copia de 1col neg compacto.png    logo del footer
```

Si alguno no aparece, lo más rápido es sacarlo del Instagram de la inmobiliaria o pedirle los originales al diseñador. Son pocos y livianos.

## Paso 8 — Las 150 propiedades viejas

Sus fotos apuntan al proyecto pausado, así que van a salir rotas. Ocultalas hasta el rescate:

```sql
UPDATE properties SET status = 'oculto'
WHERE images[1] LIKE '%cvgnpyzgglrclzxxlbsp%';
```

Quedan guardadas en la base, solo dejan de publicarse (RLS únicamente muestra `disponible`, `reservado` y `vendido`). Cuando tengamos las fotos:

```sql
UPDATE properties SET status = 'disponible' WHERE status = 'oculto';
```

## Paso 9 — Probar y publicar

```bash
npm run dev
```

Andá a `/admin/login`, entrá con el usuario del paso 4 y cargá una propiedad de prueba con 3 o 4 fotos. Tiene que aparecer el cartel tipo:

```
4 fotos · 4.2 MB → 810 KB (81% menos)
```

Ese cartel es la confirmación de que la compresión nueva está andando. Si no aparece, avisame antes de seguir.

Después: Vercel → Settings → Environment Variables → actualizar las tres → **Redeploy**. El redeploy además reemplaza el bundle que hoy tiene la `service_role` vieja expuesta.

---

## Datos de referencia (sacados de tu backup)

**Tablas y contenido restaurado**

| Tabla | Filas |
|---|---|
| `properties` | 150 |
| `form_options` | 38 |
| `site_settings` | 3 |
| `page_views` | 7525 |
| `inquiries` | 0 |

**Opciones de los formularios** (las listas del buscador y del alta)

| Categoría | Cantidad | Ejemplos |
|---|---|---|
| `tipo_operacion` | 2 | Venta, Alquiler Anual |
| `provincia` | 1 | Buenos Aires |
| `localidad` | 18 | San Bernardo, Mar de Ajó, Mar del Tuyú, La Lucila del Mar, Costa Azul… |
| `tipo_propiedad` | 17 | PH, DUPLEX, TRIPLEX, GALPÓN, EDIFICIO, HOTEL… |

**Estados válidos de una propiedad:** `disponible`, `reservado`, `vendido` (y `oculto`, que agregamos ahora para despublicar sin borrar).

---

## Checklist

- [ ] Cuenta nueva + proyecto en São Paulo
- [ ] `restaurar-db.sql` → 150 propiedades
- [ ] `setup-proyecto-nuevo.sql` → 2 buckets
- [ ] `seguridad-rls.sql` → 5 tablas con RLS
- [ ] Buckets `propiedades` y `FotosPagina` visibles y públicos
- [ ] Usuario admin con Auto Confirm
- [ ] `.env.local` completo + `auditar-claves.mjs` en verde
- [ ] `cambiar-proyecto.mjs <ref> --aplicar`
- [ ] `supabase.seguro.ts` renombrado + `npm i server-only`
- [ ] `rescate-fotospagina.mjs` → logos subidos a `FotosPagina`
- [ ] Propiedades viejas ocultadas
- [ ] Prueba local con el cartel de ahorro
- [ ] Vercel actualizado + redeploy

Cuando tengas la URL del proyecto, pasámela y seguimos.
