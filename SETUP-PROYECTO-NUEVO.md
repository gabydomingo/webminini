# Volver a operar hoy — proyecto nuevo paso a paso

El objetivo de esta guía es simple: **que Román y Juan puedan volver a cargar propiedades hoy**, sin esperar el rescate de las fotos viejas. Cuando esas fotos aparezcan, se enchufan acá sin rehacer nada.

Tiempo estimado: 30–40 minutos.

---

## Antes que nada: por qué se llenó el giga

Tu código **sí** comprimía las fotos. El problema es que comprimía poco:

```
antes:  JPEG · 1920 px · calidad 0.8   →  1.07 MB promedio (medido sobre tus 2817 fotos)
ahora:  WebP · 1600 px · calidad 0.78  →  ~200 KB estimado, + una miniatura de ~25 KB
```

En las pruebas que corrí sobre imágenes de distinta dificultad, la reducción va del **91 % al 98 %**. Las fotos suaves (playa, cielo, paredes) bajan muchísimo; las muy texturadas bajan menos. Tus fotos de propiedades caen en el medio.

Con ~200 KB por foto, en el mismo giga gratis entran unas **5000 fotos nuevas** — más o menos **250 propiedades** al ritmo de 19 fotos cada una. Sobra para muchísimo tiempo.

Además ahora se genera una **miniatura** para el listado. Hoy la página de propiedades bajaba fotos de 1 MB para mostrarlas a 400 px de ancho; eso es lo que consumía el tráfico mensual. Con la miniatura de 25 KB, el listado pesa unas 40 veces menos.

---

## Paso 1 — Crear el proyecto

[supabase.com/dashboard](https://supabase.com/dashboard) → **New project**

- **Organization:** la misma de siempre (me confirmaste que solo tenés este proyecto, así que entrás cómodo en el límite de 2 del plan free).
- **Name:** `webminini` o `minini-prod`
- **Region:** **South America (São Paulo)** — es la más cercana; tu proyecto viejo estaba en `sa-east-1`.
- **Database Password:** generá una nueva y **guardala en un gestor de contraseñas**, no en un archivo suelto.

Tarda un par de minutos en aprovisionar.

## Paso 2 — Restaurar la base

SQL Editor → **New query** → pegar y ejecutar, **en este orden**:

| # | Archivo | Qué hace |
|---|---|---|
| 1 | `backup/restaurar-db.sql` | Crea las tablas y mete las 150 propiedades, 38 opciones y 3 ajustes |
| 2 | `backup/setup-proyecto-nuevo.sql` | Crea los buckets con tope de 3 MB y la vista de control de uso |
| 3 | `backup/seguridad-rls.sql` | Activa RLS y las políticas |

El último de cada archivo te devuelve una verificación. Al terminar el 2 tenés que ver:

```
 propiedades | opciones_formulario | ajustes_sitio | buckets
         150 |                  38 |             3 |       2
```

## Paso 3 — Crear el usuario administrador

Authentication → Users → **Add user** → *Create new user*

- Email y contraseña de siempre
- ✅ Marcá **Auto Confirm User** (si no, queda esperando un mail de confirmación)

Este usuario es el que entra por `/admin/login`. Las políticas de RLS le dan permiso total; sin él no podés administrar nada.

## Paso 4 — Las claves

Settings → API. Copiá con cuidado, **son dos claves distintas**:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<ref-nuevo>.supabase.co

# la que dice "anon public" — role: anon
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>

# la que dice "service_role secret" — SIN prefijo NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=<service_role>
```

Verificá antes de seguir:

```bash
node scripts/auditar-claves.mjs
```

Tiene que decir `✅ Sin claves privadas expuestas al navegador`. Si dice otra cosa, están cruzadas.

## Paso 5 — Activar el código nuevo

```bash
# el cliente con el guardián anti-service_role
mv app/lib/supabase.seguro.ts app/lib/supabase.ts

# dependencia del cliente de servidor
npm i server-only
```

Y en `next.config.ts`, cambiá el hostname por el del proyecto nuevo:

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '<ref-nuevo>.supabase.co',
      pathname: '/storage/v1/object/public/**' },
  ],
}
```

Probá local antes de deployar:

```bash
npm run dev
```

Entrá a `/admin/login`, cargá una propiedad de prueba con 3 o 4 fotos y fijate que abajo del selector aparezca el resumen tipo `4 fotos · 4.2 MB → 810 KB (81% menos)`. Ese cartel es la confirmación de que la compresión está funcionando.

## Paso 6 — Producción

Vercel → Settings → Environment Variables: actualizá las tres variables y **redeployá**.

El redeploy es importante por dos motivos: publica el código nuevo, y **reemplaza el bundle que hoy tiene la service_role del proyecto viejo expuesta**.

---

## Lo que vas a ver, y está bien

Las 150 propiedades restauradas **van a mostrar las fotos rotas**. Es esperable: sus URLs apuntan al proyecto pausado, que no responde. Los datos (precio, descripción, ubicación, mapa) están todos.

Tres formas de encararlo, en orden de esfuerzo:

1. **Dejarlas ocultas hasta rescatar las fotos** — un solo comando, y la web muestra únicamente lo que carguen de nuevo:

   ```sql
   -- ocultar las viejas (quedan en la base, no se borra nada)
   UPDATE properties SET status = 'oculto'
   WHERE images[1] LIKE '%cvgnpyzgglrclzxxlbsp%';

   -- para revertirlo cuando estén las fotos:
   -- UPDATE properties SET status = 'disponible' WHERE status = 'oculto';
   ```

   Como las políticas de RLS solo publican `disponible`, `reservado` y `vendido`, con `oculto` desaparecen de la web al instante.

2. **Poner una imagen de placeholder** con el logo de la inmobiliaria mientras tanto. Decime y lo agrego a `PropertyCard`.

3. **Dejarlas rotas** y priorizar que carguen las nuevas. Es lo más rápido pero queda feo de cara al cliente.

Yo iría por la 1: la web queda prolija desde el minuto cero, no perdés nada, y es un `UPDATE` para volver atrás.

---

## Cuando rescatemos las fotos viejas

Nada de esto se tira. La secuencia va a ser:

1. Bajar las fotos del proyecto viejo (`01-rescate-imagenes.mjs`)
2. Comprimirlas con el mismo criterio (`02-comprimir.mjs`) — 2.74 GB pasan a ~400 MB
3. Subirlas a donde estén las nuevas, o a R2 si para entonces preferís mudarte
4. Reescribir las URLs (`04-actualizar-urls.mjs`) y devolver las propiedades a `disponible`

Las propiedades que carguen de acá en adelante no se tocan.

---

## Checklist

- [ ] Proyecto creado en São Paulo
- [ ] `restaurar-db.sql` → 150 propiedades
- [ ] `setup-proyecto-nuevo.sql` → 2 buckets
- [ ] `seguridad-rls.sql` → RLS activo en 5 tablas
- [ ] Usuario admin con Auto Confirm
- [ ] `.env.local` actualizado y `auditar-claves.mjs` en verde
- [ ] `supabase.seguro.ts` renombrado + `npm i server-only`
- [ ] `next.config.ts` con el hostname nuevo
- [ ] Prueba local: cargar una propiedad y ver el cartel de ahorro
- [ ] Variables en Vercel + redeploy
- [ ] Decidir qué hacer con las 150 viejas (recomiendo ocultarlas)

Cuando lo tengas andando, corré esto cada tanto para dormir tranquilo:

```sql
SELECT * FROM public.uso_storage;
```

Si `usado_mb` empieza a acercarse a 1024, avisame y migramos a R2 antes de que vuelva a pausarse.
