# Pushear y configurar Vercel

---

## 1. Sí, hay que tocar Vercel — y es lo que más importa

Tu `.env.local` vive solo en tu PC y **nunca se sube a git** (bien así). Vercel no lo ve. Hoy en producción siguen las variables del proyecto viejo, que está pausado.

Eso significa que **aunque pushees el código, en producción no van a poder subir nada**: el panel va a seguir hablándole a una base apagada. El push arregla el código; las variables de Vercel arreglan a qué base apunta.

Vercel → tu proyecto → **Settings → Environment Variables**. Actualizá o creá estas cuatro, en los tres entornos (Production, Preview, Development):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://syqfekxxiztmlqydtgec.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la `anon public` del proyecto nuevo |
| `SUPABASE_SERVICE_ROLE_KEY` | la `service_role` — **sin** `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_MANTENIMIENTO` | `1` para mostrar el cartel, `0` para ocultarlo |

Copialas de tu `.env.local`, que ya está armado y verificado.

⚠️ **Borrá las variables viejas** que apunten a `cvgnpyzgglrclzxxlbsp`. Si quedan dando vueltas, algún deploy futuro puede tomarlas.

Después: Deployments → el último → **⋯ → Redeploy**. Sin redeploy las variables nuevas no entran en vigencia.

Ese redeploy hace además algo importante: **reemplaza el bundle que hoy tiene publicada la `service_role` vieja**. Hasta que no lo hagas, esa clave sigue expuesta en el JavaScript de producción.

---

## 2. El push, con una advertencia

`git status` te va a mostrar **más de 50 archivos modificados**, incluidos muchos que nunca tocamos: `eslint.config.mjs`, `tailwind.config.mjs`, `README.md`, componentes sueltos.

Lo verifiqué y **no son cambios reales, son finales de línea** (CRLF de Windows contra LF). El diff de `README.md`, por ejemplo, es esto:

```
-xx
+xx
```

El mismo contenido. Tu git tiene `core.autocrlf=false`, así que registra el cambio de formato como si fuera una modificación.

Los cambios de verdad son **14 archivos**. Si commiteás todo, el historial queda con 50 archivos tocados y el día que busques qué cambiaste no vas a encontrar nada.

### Descartar el ruido y quedarte con lo real

Desde Git Bash, en la carpeta del proyecto:

Desde Git Bash, en la carpeta del proyecto. **Corré primero el paso 1 y 2, que no tocan nada**, y recién después el 3.

```bash
# 1· ver qué cambió de verdad (ignorando espacios y finales de línea)
git diff --ignore-all-space --numstat | awk '{printf "  +%-5s -%-5s %s\n", $1, $2, $3}'

# 2· ver qué se va a descartar, SIN descartar nada todavía
comm -23 \
  <(git diff --name-only | sort) \
  <(git diff --ignore-all-space --numstat | cut -f3 | sort)

# 3· ahora sí: descartar los que solo cambiaron de formato
comm -23 \
  <(git diff --name-only | sort) \
  <(git diff --ignore-all-space --numstat | cut -f3 | sort) \
  | tr '\n' '\0' | xargs -0 git checkout --

# 4· confirmar que quedó limpio
git status --short
```

Lo probé contra tu repo: el paso 1 lista **14 archivos** y el paso 2 lista **40** de puro formato. Después del 3 te quedan esos 14 más los archivos nuevos.

> **Por qué `--numstat` y no `--name-only`:** con `--name-only`, git ignora el `--ignore-all-space` y te lista los 53 archivos igual. Con `--numstat` sí lo respeta y deja afuera los que no tienen cambios efectivos. Me pasó al escribir esto y por eso lo verifiqué contra tu repo antes de pasártelo.

### El commit

```bash
git add -A
git commit -m "Migrar a proyecto Supabase nuevo, arreglar compresión de imágenes y seguridad

- Apunta al proyecto syqfekxxiztmlqydtgec (el anterior quedó pausado por
  exceder el límite de storage del plan free)
- imageCompress: WebP 1600px + miniatura de 640px. Las fotos pasan de
  ~1.07 MB a ~200 KB, y el listado ahora usa la miniatura
- Nuevo app/lib/storage.ts: toda la subida en un solo lugar
- supabase.ts: valida que la clave pública no sea una service_role y
  corta el build si lo es
- supabaseAdmin.ts: cliente de servidor para lo que necesite saltear RLS
- Cartel de mantenimiento, se prende con NEXT_PUBLIC_MANTENIMIENTO
- scripts/: rescate del proyecto viejo, auditoría de claves y migración"

git push origin main
```

`backup/` está en el `.gitignore`, así que los SQL con los datos de las propiedades **no se van a subir a GitHub**. Está bien que sea así: son datos de clientes.

### Si querés que no vuelva a pasar (opcional)

```bash
echo "* text=auto eol=lf" > .gitattributes
git add --renormalize .
```

Unifica los finales de línea de todo el repo. Genera un commit grande de una sola vez, pero después el problema desaparece. Yo lo haría **en un commit aparte**, después del de arriba, para no mezclar.

---

## 3. El cartel de mantenimiento

Se prende y se apaga con una variable, sin tocar código:

```
NEXT_PUBLIC_MANTENIMIENTO=1   → se muestra
NEXT_PUBLIC_MANTENIMIENTO=0   → se oculta
```

Para probarlo local, agregá la línea a tu `.env.local` y corré `npm run dev`.

Cómo quedó:

- Barra fija arriba de todo, en el dorado de la paleta (`#BE9B5F`) con texto negro.
- **No aparece en `/admin`** — ahí ya sabés que estás trabajando.
- El teléfono es tocable: en celular abre el discador. Al lado hay un botón de WhatsApp con el mensaje ya escrito.
- En celular el texto se acorta a *"Sitio en actualización"* para que el número nunca quede cortado.
- El header del sitio es `fixed`, así que agregué reglas en `globals.css` que lo bajan exactamente lo que mide el cartel. Nada queda tapado.

El texto está en `app/components/BannerMantenimiento.tsx`, arriba de todo, en tres constantes:

```ts
const TELEFONO_LINDO = "+54 9 2257 65-3292";
const TELEFONO_TEL   = "+5492257653292";
const TELEFONO_WA    = "5492257653292";
```

> Ojo: el WhatsApp flotante del sitio usa **otro** número (`5492257309051`) y en el JSON-LD del `layout.tsx` figura un tercero (`+5492257307064`). Si el de mantenimiento tiene que ser el mismo que alguno de esos, decime y los unifico.

---

## 4. Orden sugerido

1. Probar local: `npm run dev`, entrar a `/admin`, cargar una propiedad con fotos y ver el cartel de ahorro.
2. Limpiar el ruido de git y commitear.
3. `git push origin main`.
4. Actualizar las 4 variables en Vercel y borrar las viejas.
5. Redeploy.
6. Abrir `propiedadesminini.com` y verificar: se ve el cartel, el logo carga, y desde `/admin` en producción se puede subir una foto.

El paso 6 es el que confirma que quedó todo bien. Si el logo no aparece, es que faltan los archivos de `FotosPagina` en el bucket nuevo — ahí corré `node scripts/rescate-fotospagina.mjs`.

---

## 5. Lo que queda pendiente

- [ ] Rotar el JWT secret y la `service_role` del proyecto nuevo (las compartiste en el chat)
- [ ] Ticket a Supabase por las 2817 fotos del proyecto viejo — `TICKET-SUPABASE.md`
- [ ] Decidir si van las 150 propiedades viejas ocultas hasta que estén las fotos
- [ ] Cuando aparezcan: comprimir y migrar a R2 — `RESCATE-Y-MIGRACION.md`
