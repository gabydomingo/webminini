# Minini Propiedades — mantenimiento

Todo lo que hay que saber para que esto siga andando gratis. Reemplaza los nueve documentos sueltos de la migración, que ya cumplieron su función.

---

## Lo que cambió en la última pasada

**Las fichas de propiedad ya no consultan Supabase en cada visita.** Eran el mayor consumo del proyecto: `/propiedades/[id]` no traía nada del servidor, montaba un componente de cliente que hacía `select('*')` en un `useEffect`. Dos consultas en vivo por visita, sin caché, y —peor— una página vacía para Google: las ~100 URLs del sitemap devolvían un spinner. Ahora los datos se leen en el servidor y las fichas se prerenderizan en el build. Lo mismo `/concretadas`.

**El `revalidate` pasó de 120 segundos a 24 horas.** El aviso del panel a `/api/revalidar` ya actualizaba todo en el acto, así que los 2 minutos solo servían para regenerar páginas ~700 veces por día y devolver el mismo HTML. Las 24 horas son la red de seguridad por si ese aviso alguna vez no llega.

**Las URLs de propiedad tienen slug.** `/propiedades/triplex-en-venta-mar-de-ajo-<uuid>`. El UUID va al final a propósito: no hubo que guardar nada nuevo en la base. Las URLs viejas con UUID pelado siguen funcionando y redirigen con un 308.

**`page_views` e `inquiries` ya no se escriben desde el navegador.** Iban con la clave anónima, que está a la vista en el bundle de cualquier visitante: con eso se podía llenar la tabla de basura. Ahora pasan por `/api/visita` y `/api/consulta`, que escriben con la service_role desde el servidor y filtran bots. Falta correr `backup/sql/04-blindaje-escrituras.sql` para cerrar el permiso viejo.

**El visor de fotos se rehizo.** Zonas táctiles grandes, deslizar para pasar, teclado, y miniaturas para saltar de una.

---

## ¿Está listo para no gastar recursos?

**Vercel: sí, verificado.** Revisé los `<Image>` del código uno por uno sobre el disco real:

| Archivo | Situación |
|---|---|
| 11 de ellos | usan `unoptimized` → **0 transformaciones** |
| `sobre-nosotros/page.tsx` | el `<Image>` está **dentro de un comentario JSX**, nunca se renderiza |
| `administrador/page.tsx` | está bajo `{edificio.imagen && …}` y los 45 edificios tienen `imagen: null` |

O sea: **cero transformaciones de imagen**. El límite del plan Hobby es 5.000 por mes. No lo vas a tocar.

Las imágenes se sirven directo desde Supabase, así que tampoco pasan por el ancho de banda de Vercel.

**Supabase: sí, pero con un número que conviene que tengas presente.**

| Recurso | Uso real | Límite free | |
|---|---|---|---|
| Storage | **438 MB** | 1 GB | 🟡 43 % |
| Base de datos | ~12 MB | 500 MB | 🟢 2 % |
| Tráfico de salida | ver abajo | 5 GB/mes | 🟡 depende del hero |

Sobre el storage: 43 % no es "sobra para siempre". Con fotos de ~150 KB más su miniatura, te entran unas **2.500 fotos más**, o sea unas **130 propiedades nuevas**. Suficiente para bastante tiempo, pero no infinito. Cuando pases de 800 MB, migramos a Cloudflare R2 (10 GB y tráfico ilimitado, gratis).

### El tráfico, desglosado

| Pantalla | Qué baja | Peso |
|---|---|---|
| Portada | hero 1.9 MB + 6 miniaturas | **~2 MB** ← el hero es el 95 % |
| Listado | 12 miniaturas de 25 KB | ~300 KB |
| Detalle | 1 grande + miniaturas al costado | ~800 KB |

Una visita típica (portada + listado + 2 detalles) son **~4 MB**, así que entrás en unas **1.250 visitas al mes** con los 5 GB gratis.

**El hero solo es la mitad de todo tu tráfico.** Por eso está el paso siguiente.

### Lo único que falta hacer

```bash
npm i sharp
npm run optimizar:hero -- --subir
```

Convierte `heroprueba.png` de 1.9 MB a WebP de ~150 KB y lo sube.

⚠️ **Esto va antes del próximo deploy.** `app/page.tsx` ya apunta a `heroprueba.webp` (la constante `HERO`, que se usa tanto para el hero como para la vista previa de WhatsApp). Si el archivo todavía no está en el bucket, la portada sale sin fondo.

Con eso una visita típica pasa de 4 MB a **~2.2 MB**, y el cupo mensual salta de ~1.250 a **~2.300 visitas**. El PNG original queda en el bucket por si querés volver atrás.

---

## Cómo quedó armado

**Las fotos.** Al subir una propiedad, el navegador comprime a WebP 1600 px y genera además una miniatura de 640 px. Se guardan así:

```
propiedades/abc123.webp          ← grande, para el detalle
propiedades/thumb/abc123.webp    ← miniatura, para el listado
```

En la base solo se guarda la URL grande; la miniatura se deduce con `urlMiniatura()` en `app/lib/imagenes.ts`. Si una miniatura no existiera, `FotoPropiedad.tsx` vuelve sola a la grande y el visitante no ve un hueco.

Números reales de la migración: **2804 MB → 438 MB, 84 % menos**. El promedio por foto pasó de 1070 KB a ~150 KB.

**Las claves.** `app/lib/supabase.ts` decodifica la clave pública al arrancar y **hace fallar el build** si detecta una `service_role`. El error que te dejó la base abierta no puede volver a llegar a producción sin que te enteres.

**RLS.** Las 5 tablas tienen Row Level Security. Un visitante ve las propiedades publicadas pero no puede leer las consultas de otros clientes ni las métricas.

---

## Chequeos periódicos

```bash
npm run estado            # cuánto storage usás y cómo viene todo
npm run auditar:claves    # que ninguna clave privada esté expuesta
```

Y cada tanto, en el SQL Editor:

```sql
SELECT * FROM public.uso_storage;

-- La tabla de visitas crece sola y nunca se limpia.
-- Cuando pase de ~50.000 filas:
DELETE FROM public.page_views WHERE created_at < now() - interval '180 days';
```

---

## Los scripts que quedan

| Comando | Para qué |
|---|---|
| `npm run estado` | radiografía: propiedades, fotos, espacio usado |
| `npm run auditar:claves` | revisa que no haya claves privadas en el bundle |
| `npm run optimizar:hero` | convierte el hero a WebP |
| `npm run subir:logos` | resubir los logos de `FotosPagina` si hiciera falta |
| `npm run fotos:comprimir` | comprimir un lote de fotos a mano |
| `npm run fotos:subir-r2` | migrar las fotos a Cloudflare R2 |
| `npm run fotos:urls` | reescribir las URLs después de migrar a R2 |
| `npm run bucket:usage` / `bucket:clean` | encontrar y borrar fotos huérfanas |
| `npm run backup:db` | backup de la base |

---

## Pendientes menores

1. **Correr `backup/sql/04-blindaje-escrituras.sql`** en el SQL Editor, *después* de desplegar. Cierra el permiso de escritura anónima sobre `page_views` e `inquiries`, que ya no usa nadie. Al revés —SQL primero, deploy después— los formularios quedan rotos unos minutos.

2. **Borrar `app/propiedades/[id]/PropertyDetailClient.tsx`.** Quedó vacío: su contenido se repartió entre `page.tsx`, `Galeria.tsx`, `FormularioConsulta.tsx` y `UbicacionMapa.tsx`.

3. **Tres teléfonos distintos** conviven en el sitio: el del cartel de mantenimiento (`2257 65-3292`), el del WhatsApp flotante (`2257 30-9051`) y el del JSON-LD para Google (`2257 30-7064`). Si alguno está mal, hay que unificarlo.

4. **Rotar las claves del proyecto nuevo.** La `service_role` y el JWT secret circularon por el chat. Settings → API → Rotate. La `anon` puede quedar, es pública por diseño.

5. **El proyecto viejo (`cvgnpyzgglrclzxxlbsp`).** Ya no lo usa nadie. Cuando estés seguro de que no falta nada: borrale el bucket, verificá que la organización esté en plan Free y que no quede ninguna suscripción activa.

6. **El cartel de mantenimiento** sigue prendido. Se apaga con `NEXT_PUBLIC_MANTENIMIENTO=0` en Vercel + redeploy.

---

## Tu copia de las fotos

En `backup/` tenés **2.8 GB de fotos originales** más 438 MB de comprimidas. Esa carpeta está en el `.gitignore`, así que no se sube a GitHub — pero **es tu único respaldo completo**.

No la borres. Si necesitás espacio en el disco, mové `backup/originales/` a un disco externo. Las comprimidas de `backup/webp/` son las que ya están en el bucket, esas sí son prescindibles.
