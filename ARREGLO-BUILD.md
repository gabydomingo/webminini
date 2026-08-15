# Arreglar el build de Vercel

## Los dos problemas

### 1. Dos lockfiles peleando (el que te frenó ahora)

El repo tiene **los dos**: `package-lock.json` (npm) y `pnpm-lock.yaml` (pnpm), y ambos versionados en git.

Vos venís instalando con `npm`, así que cuando hiciste `npm i @aws-sdk/client-s3` se actualizó `package-lock.json` — pero `pnpm-lock.yaml` quedó como estaba, del 12 de agosto.

Vercel ve el `pnpm-lock.yaml`, decide usar pnpm, y pnpm en CI corre con `--frozen-lockfile`: si el lockfile no coincide con el `package.json`, aborta. De ahí el mensaje:

```
specifiers in the lockfile don't match specifiers in package.json:
* 1 dependencies were added: @aws-sdk/client-s3@^3.1110.0
```

### 2. Falta `server-only` (te iba a romper el deploy siguiente)

`app/lib/supabaseAdmin.ts` tiene `import 'server-only'`, pero ese paquete nunca se instaló. Aunque hoy ningún archivo use `supabaseAdmin`, **`next build` corre el chequeo de tipos sobre todos los archivos del `tsconfig`**, así que igual iba a fallar con `Cannot find module 'server-only'`.

Si arreglabas solo el lockfile, el próximo deploy se caía por esto. Mejor los dos de una.

---

## El arreglo

```bash
# 1· quedarse con un solo gestor de paquetes: npm
git rm --cached pnpm-lock.yaml pnpm-workspace.yaml
rm pnpm-lock.yaml pnpm-workspace.yaml

# 2· instalar con el package.json corregido (ya está en tu carpeta)
npm install

# 3· verificar que compila igual que en Vercel
npm run build

# 4· subir
git add -A
git commit -m "Unificar en npm y mover dependencias de scripts a devDependencies

- Elimina pnpm-lock.yaml y pnpm-workspace.yaml: el proyecto se instala
  con npm y tener los dos lockfiles hacía que Vercel usara pnpm con un
  lockfile desactualizado
- Agrega server-only, que importa app/lib/supabaseAdmin.ts
- @aws-sdk/client-s3, csv-parser y dotenv pasan a devDependencies:
  solo los usan los scripts de mantenimiento, no la app"

git push origin main
```

El paso 3 es el que te ahorra el viaje: `npm run build` corre exactamente lo mismo que Vercel. Si pasa local, pasa allá.

---

## Qué cambié en `package.json`

**A `devDependencies`** (los usan los scripts de `scripts/` y `migracion.js`, nunca la app — lo verifiqué buscando los imports en todo `app/`):

- `@aws-sdk/client-s3`
- `csv-parser`
- `dotenv`

**Agregado a `dependencies`:**

- `server-only` — lo importa `app/lib/supabaseAdmin.ts`

**Atajos nuevos**, para no acordarte de las rutas:

```bash
npm run auditar:claves     # revisar que no haya claves privadas expuestas
npm run rescate:test       # ¿revivió el storage del proyecto viejo?
npm run rescate:logos      # bajar los logos de FotosPagina
npm run fotos:comprimir    # comprimir las fotos rescatadas a WebP
npm run fotos:subir-r2     # subirlas a Cloudflare R2
npm run fotos:urls         # generar el SQL que reescribe las URLs
```

Lo probé resolviendo las dependencias contra el registro real de npm: **485 paquetes, 8 de producción y 12 de desarrollo**, todo resuelve sin conflictos.

---

## Por qué elegí npm y no pnpm

Podrías arreglarlo al revés — correr `pnpm install` para regenerar `pnpm-lock.yaml` y borrar `package-lock.json`. Funciona igual de bien.

Elegí npm porque es lo que venís usando en la práctica: tu `package-lock.json` está al día y el `pnpm-workspace.yaml` estaba a medio configurar, con los valores sin completar:

```yaml
allowBuilds:
  sharp: set this to true or false
  unrs-resolver: set this to true or false
```

Lo importante es **quedarte con uno solo**. Tener los dos versionados es lo que causó esto y va a volver a pasar cada vez que instales algo.

---

## Si aparece otro error

Pegámelo. Pero los dos candidatos que ya descarté:

- **Variables de entorno faltantes** → `app/lib/supabase.ts` corta el build a propósito si falta `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Asegurate de tenerlas cargadas en Vercel **antes** del deploy.
- **La clave equivocada** → si en `NEXT_PUBLIC_SUPABASE_ANON_KEY` va una `service_role`, el build también corta, con un mensaje que lo explica. Es a propósito: mejor que falle el deploy a que se publique la llave maestra.
