# Plan: Migrar a Next.js + Payload CMS + Postgres (Neon)

_Reemplaza el plan anterior de Decap CMS (preservado en `PLAN-REVIEW-LOG.md` / historial de git). Escrito tras
research dirigido sobre Payload 3.x, adaptador Postgres, Vercel Marketplace + Neon, y migración de una SPA Vite a
Next.js App Router._

## Goal

Reemplazar el enfoque de Decap CMS (contenido en Markdown versionado en git) por un CMS con base de datos real:
Next.js + Payload CMS 3.x + Postgres (Neon, vía Vercel Marketplace). Jorge obtiene un panel `/admin` con login de
usuario/password real (no OAuth de GitHub), edición instantánea sin redeploy de build, y los datos viven en una
base de datos propia en vez de archivos de texto. Alcance de contenido editable: **`projects` y `posts`
únicamente** — `hero`, `about`, `experience`, `contact` siguen hardcodeados en código, igual que en el plan
anterior.

Los 12 archivos `content/*.md` ya migrados en esta sesión (con sus normalizaciones: `repoUrl` https, fechas ISO,
`order` espaciado) se usan como **seed data** para poblar las tablas de Postgres — no se pierde el trabajo hecho,
cambia dónde vive.

## Decisiones ya cerradas (no reabrir sin razón nueva)

- **Proveedor de DB**: Neon vía Vercel Marketplace (no Supabase — Supabase pausa proyectos tras 1 semana de
  inactividad en el free tier, inaceptable para un portfolio editado esporádicamente).
- **Alcance de contenido**: solo `projects`/`posts` van a Payload. El resto queda en `src/data.js` (o su
  equivalente post-migración).
- **Auth**: nativo de Payload (`auth: true` en la colección `Users`), no `next-auth`/`lucia` custom. No hay
  requisito de login social — usuario/password de Jorge alcanza.
- **Costo**: $0/mes mientras se mantenga Vercel Hobby + Neon free tier sin tarjeta de pago cargada (confirmado en
  sesión: cuenta sin payment method, plan Hobby activo).

## Approach

### 0. Prerrequisito — confirmar que Vercel Hobby + Neon free tier alcanzan antes de empezar

Ya verificado en esta sesión: cuenta Vercel sin tarjeta de pago, plan Hobby activo, 1 TB/mes bandwidth y 10M
edge requests/mes incluidos. Sin acción adicional. Se confirma el mismo chequeo para Neon (tier gratis: 0.5 GB
storage, 190h compute/mes) una vez provisionado en el paso 3 — para 12 entradas de contenido este límite no es
un riesgo real, pero se anota como último chequeo antes de dar el proyecto por completo.

### 1. Migrar el proyecto de Vite a Next.js (App Router)

Payload 3.x **no es un servicio headless decoupleable** — se instala dentro de un proyecto Next.js y corre como
parte de sus rutas (`app/(payload)/admin`, `app/(payload)/api`). Esto obliga a migrar el framework primero, antes
de tocar Payload.

- Scaffolding: se crea la estructura Next.js App Router (`app/`, `next.config.js`, etc.) sobre el proyecto
  existente. Dependencias nuevas: `next`, se retiran `vite`, `@vitejs/plugin-react` una vez completada la
  migración (no antes — se mantienen ambos build systems coexistiendo temporalmente solo si hace falta comparar
  visualmente, pero el objetivo es cortar Vite en un solo commit atómico, no un periodo largo con ambos).
- **Route groups**: dos grupos con layouts independientes (Next.js no comparte layout raíz automáticamente entre
  route groups, hay que declarar uno por grupo):
  - `app/(frontend)/` — el sitio público. `app/(frontend)/layout.tsx` + `app/(frontend)/page.tsx` que monta el
    árbol completo de la SPA actual como un único Client Component (`"use client"`), preservando el
    comportamiento de "escritorio con ventanas" y el enrutamiento por hash tal cual funciona hoy
    (`#/proyecto/<slug>`, `#/post/<slug>`). **No se descompone en rutas de archivo por vista** — Next.js no lo
    exige, y reescribir el enrutamiento sería trabajo no solicitado con alto riesgo de romper el look actual.
  - `app/(payload)/` — generado/gestionado por Payload (admin UI + REST/GraphQL API), con su propio
    `layout.tsx`. No se edita a mano salvo lo que la config de Payload requiera.
- **`next.config.js`** se envuelve con `withPayload()` de `@payloadcms/next/withPayload` (obligatorio para que
  Payload registre sus rutas y config de build).
- **Gotchas de SSR a resolver en la migración de `App.jsx`/`console.jsx`/`windows.jsx`**:
  - Todo el árbol de la SPA (que usa `useState`, `useEffect`, hash routing, `window`) requiere `"use client"`
    en el archivo raíz que lo monta — sin esto, Next.js intenta renderizarlo en servidor y falla al acceder a
    `window`/`location.hash` en el render inicial.
    - Alternativa evaluada y descartada: guardas `typeof window !== 'undefined'` dispersas por todo el árbol —
      más invasivo que un único `"use client"` en el punto de montaje, dado que toda la SPA ya es
      inherentemente client-side (no hay nada que valga la pena server-renderizar en esta vista tipo escritorio).
  - El plugin de contenido de Vite (`vite-plugin-content.js`, creado en la sesión anterior) **no tiene
    equivalente directo en Next.js/webpack** — deja de usarse. Su lógica de parseo/validación/sanitización de
    Markdown (gray-matter + marked + isomorphic-dompurify) se reutiliza pero migra a Payload hooks/build-time
    seed (ver sección 4), no a un plugin de bundler.

### 2. Provisionar Neon Postgres vía Vercel Marketplace

- Desde el dashboard de Vercel: proyecto → **Storage** → Marketplace → **Neon**. Se usa la variante
  **Vercel-Managed Integration** (Vercel provisiona y es dueño del proyecto Neon) — más simple que conectar una
  cuenta Neon externa, y suficiente para un solo proyecto.
- Esto inyecta automáticamente en el proyecto Vercel: `DATABASE_URL` (pooled, vía pgbouncer — se usa para el
  runtime de la app) y `DATABASE_URL_UNPOOLED` (conexión directa — se usa solo para migraciones de schema que no
  toleran el pooler). **Usar la variable equivocada en el lugar equivocado es el error más común en este setup**:
  runtime de Payload → `DATABASE_URL`; comandos de migración de Drizzle (si se corren aparte del arranque normal)
  → `DATABASE_URL_UNPOOLED`.
- `vercel env pull` sincroniza estas variables a `.env.local` para desarrollo local — nunca se commitean al
  repo (`.env.local` ya en `.gitignore`).

### 3. Instalar y configurar Payload

- Dependencias: `payload`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`,
  `sharp` (requerido por Payload para procesamiento de imágenes, aun si el manejo final de uploads vive en Vercel
  Blob — ver sección 6).
- `payload.config.ts` en la raíz del proyecto:
  ```ts
  import { postgresAdapter } from '@payloadcms/db-postgres'
  import { lexicalEditor } from '@payloadcms/richtext-lexical'

  export default buildConfig({
    db: postgresAdapter({
      pool: { connectionString: process.env.DATABASE_URL },
    }),
    editor: lexicalEditor({}),
    collections: [Users, Projects, Posts],
    secret: process.env.PAYLOAD_SECRET, // generado una vez, guardado como env var en Vercel, nunca committeado
  })
  ```
- **`PAYLOAD_SECRET`**: se genera con un valor aleatorio largo (`openssl rand -base64 32` o equivalente) y se
  guarda como variable de entorno en Vercel (Production + Preview + Development) — nunca hardcodeado ni
  committeado. Payload lo usa para firmar tokens/cookies de sesión.

### 4. Definir las colecciones `Projects` y `Posts`

Esquema derivado directamente del que ya se validaba en `vite-plugin-content.js` (sesión anterior), traducido a
field types de Payload — no hay tipo nativo "URL" ni "slug" en Payload, se manejan como `text` con validación
custom:

- **`Projects`**:
  - `title` (`text`, requerido)
  - `slug` (`text`, `unique: true`, `admin.position: 'sidebar'`, con hook `beforeChange` que lo deriva de
    `title` si no se especifica manualmente — mismo espíritu de "slug inmutable tras creación" del plan anterior,
    reforzado con una validación custom que rechaza cambios de `slug` en una entrada ya existente, no solo en
    build time como antes sino en el propio `beforeChange` hook de Payload, que corre en cada save real)
  - `order` (`number`, requerido) — se mantiene la convención de valores espaciados (10, 20, 30...) para permitir
    reordenar sin colisiones, documentada como texto de ayuda del campo (`admin.description`)
  - `year` (`text`, requerido, validado con regex de 4 dígitos vía `validate` custom)
  - `tag` (`text`, requerido)
  - `blurb` (`textarea`, requerido)
  - `stack` (`array` de `{ value: text }`, no vacío — validado con `validate` custom que rechaza arrays vacíos,
    Payload no tiene un "minRows" nativo universal para todos los tipos de array pero sí soporta `validate`)
  - `color` (`select` con opciones fijas `pink`/`cyan`/`yellow`, requerido)
  - `liveUrl` / `repoUrl` (`text`, requeridos, con `validate` custom que exige esquema `https://`)
  - `coverImage` (`upload`, relación a la colección `Media` — opcional, ver sección 6)
- **`Posts`**:
  - `title` (`text`, requerido)
  - `slug` (`text`, `unique: true`, mismo tratamiento que en `Projects`)
  - `date` (`date`, requerido, `admin.date.pickerAppearance: 'dayOnly'` — equivalente al `datetime` con
    `time_format: false` que se había definido para Decap)
  - `kicker` (`text`, requerido)
  - `excerpt` (`textarea`, requerido)
  - `readMin` (`number`, requerido, `validate` custom > 0)
  - `body` (`richText`, editor Lexical) — **reemplaza tanto el widget `richtext` de Decap como el pipeline manual
    de `marked`+`isomorphic-dompurify` construido en la sesión anterior**: Lexical ya serializa a una estructura
    de nodos que Payload sabe convertir a HTML de forma segura en el momento de servir el contenido (vía
    `serializeLexical` / el serializer oficial de `@payloadcms/richtext-lexical`), sin necesidad de un sanitizador
    aparte escrito a mano. Se documenta como riesgo a verificar en implementación: confirmar que el HTML
    serializado por Lexical no permite inyección vía el editor (Payload lo trata como confiable porque solo
    usuarios autenticados con acceso al admin pueden escribirlo — el modelo de amenaza cambia respecto a Decap,
    donde el contenido también era editado únicamente por Jorge, así que el nivel de confianza en el input es
    equivalente).

El admin UI de Payload **genera el formulario de CRUD automáticamente** a partir de esta config de campos — no
se escribe UI de administración a mano, a diferencia de lo que se había estimado como riesgo en la conversación
inicial.

### 5. Seed inicial desde el contenido ya migrado a Markdown

- Script de seed (`scripts/seed.ts` o vía `onInit` hook en `payload.config.ts`, condicionado a que las
  colecciones estén vacías — `payload.find({ collection: 'projects', limit: 1 })` antes de insertar, para que
  correr el seed dos veces no duplique datos): lee los 12 archivos `content/projects/*.md` y
  `content/posts/*.md` ya existentes (con `gray-matter`, reutilizando la lógica de parseo de
  `vite-plugin-content.js` sin el resto del plugin), y los inserta vía la **Local API de Payload**
  (`payload.create({ collection: '...', data: {...} })`) — no HTTP, corre directo contra la DB en el mismo
  proceso Node, más simple y sin necesitar auth de por medio para el seed inicial.
- El campo `body` de posts (hoy Markdown plano en los `.md`) se convierte a la estructura de nodos Lexical en el
  seed — Payload/Lexical provee utilidades de conversión Markdown→Lexical (`@payloadcms/richtext-lexical`
  expone helpers de conversión); si la utilidad exacta no cubre 100% la sintaxis usada (párrafos + blockquotes,
  que es todo lo que hay en el contenido real), se falla el seed con un error claro en vez de perder contenido
  silenciosamente.
- Tras correr el seed exitosamente una vez en producción, `content/*.md` deja de ser la fuente de verdad — se
  elimina del repo en el mismo commit que remueve `vite-plugin-content.js` y las dependencias
  `gray-matter`/`marked`/`isomorphic-dompurify` del `package.json` (ya no se usan en runtime, solo se usaron
  puntualmente en el script de seed, que también se puede eliminar tras correrlo o dejarse documentado como
  herramienta de un solo uso).

### 6. Primer usuario admin (Jorge)

- **No requiere script de seed dedicado**: al navegar a `/admin` por primera vez contra una base de datos sin
  usuarios, Payload redirige automáticamente a `/admin/create-first-user`, un formulario de creación de usuario
  inicial. Jorge lo completa una sola vez en producción tras el primer deploy — no hay credenciales
  hardcodeadas ni de bootstrap en el repo.
- Colección `Users` con `auth: true` — Payload gestiona hash de password, cookies de sesión HTTP-only (modo
  `useSessions`, default en 3.x) internamente, sin configuración adicional para el caso de un solo usuario.

### 7. Uploads (coverImage de projects) — Vercel Blob, no disco local

- El disco local **no es persistente en funciones serverless de Vercel** — cualquier archivo subido se perdería
  en el siguiente cold start/deploy. Se usa el adaptador oficial `@payloadcms/storage-vercel-blob`.
- Se provisiona Vercel Blob desde el dashboard (Storage tab) — inyecta `BLOB_READ_WRITE_TOKEN` automáticamente.
- El adaptador setea `disableLocalStorage: true` en las colecciones configuradas — obligatorio, no opcional, en
  este entorno.
- **Límite a tener en cuenta**: subidas server-side a través de una función de Vercel están capadas a 4.5 MB por
  el límite de tamaño de body de las funciones. Si en el futuro se necesitan imágenes más pesadas, se habilita
  `clientUploads: true` en el adaptador para que la subida vaya directo del navegador a Blob, sin pasar por la
  función serverless — no se implementa este modo desde el inicio porque el campo `coverImage` es opcional y de
  bajo uso esperado (portfolio con 6 proyectos), se documenta como ajuste disponible si hace falta.
- Formatos/límites de validación de la sección 6 del plan anterior (PNG/JPEG/WebP, 5MB, sin SVG, sin WebP
  animado) se re-implementan como `validate` custom en el campo `upload` de Payload — la lógica de detección por
  magic bytes puede reutilizarse tal cual (es JS puro, no depende de Vite).

### 8. Deploy en Vercel — límites y ajustes

- El admin panel de Payload corre como rutas Next.js normales sobre funciones serverless — no requiere un
  servidor persistente, confirmado viable en Vercel (usado en el template oficial `payload-website-starter`).
- **Timeouts de función**: Hobby cappea a 10s, Pro a 60s (configurable hasta 300s en Pro). Ninguna operación
  planeada en este alcance (CRUD simple de `projects`/`posts`, sin bulk imports ni hooks pesados) se acerca a
  ese límite — se documenta como restricción a vigilar si en el futuro se agregan hooks `afterChange` costosos
  o procesamiento de imágenes pesado.
- **Payload Jobs Queue** (su sistema de tareas en background) **no encaja bien en el modelo serverless de
  Vercel** (issues reportados de 504 en la comunidad) — no se usa en este plan, no hay ningún requisito de tareas
  programadas/background en el alcance actual (a diferencia del plan de Decap, que no las necesitaba tampoco).
- Cold starts: el panel de admin puede sentirse lento en la primera visita tras inactividad — aceptado como
  trade-off conocido para un panel de un solo editor de bajo tráfico, no se optimiza activamente en este plan.

### 9. Qué se elimina del plan anterior (Decap)

- `public/admin/*` (nunca se llegó a crear en la sesión anterior, no aplica).
- Las funciones OAuth `api/auth.js`/`api/callback.js` planeadas para el proxy de GitHub OAuth de Decap — ya no
  aplican, Payload usa su propio auth nativo, no hay flujo OAuth de terceros que implementar.
- `vite-plugin-content.js`, `content/*.md`, y las dependencias `gray-matter`/`marked`/`isomorphic-dompurify` del
  `package.json` raíz (ver sección 5 — se retiran tras el seed inicial exitoso).
- La sección de "Uploads" del plan de Decap (escaneo de `public/uploads` en build time) se reemplaza por el
  enfoque de Vercel Blob de la sección 7 de este plan — mismo objetivo (validar formato/tamaño/dimensiones),
  mecanismo distinto porque ya no hay una carpeta `public/uploads` versionada en git.

### 10. Verificación y checklist antes de dar por completa la migración

- `npm run build` (o el script equivalente de Next.js) limpio desde `npm ci`, sin reusar `node_modules` de
  desarrollo.
- Confirmar en producción: `/admin` carga, `/admin/create-first-user` permite crear el usuario de Jorge, login
  posterior funciona con cookie de sesión (no requiere recrear usuario en cada visita).
- Crear/editar una entrada de `projects` o `posts` desde el admin y confirmar que el sitio público
  (`app/(frontend)`) refleja el cambio sin necesidad de un nuevo deploy — a diferencia de Decap, esto debe ser
  instantáneo (lee directo de Postgres en cada request, no de un build estático).
- Confirmar que el seed migró los 12 registros correctamente: comparación 1:1 de campos contra los `content/*.md`
  originales antes de eliminarlos del repo (mismo espíritu que `npm run migration:verify` del plan anterior, pero
  esta vez como chequeo manual único ya que no hay comparación recurrente que automatizar — el contenido deja de
  vivir en archivos versionados).
- Confirmar que el rango de años dinámico (`ProjectsWindow`), el uso de `repoUrl` real (`console.jsx`), y
  `formatDateEs` (implementados en la sesión anterior sobre datos de `virtual:portfolio-content`) siguen
  funcionando igual sobre datos que ahora vienen de Payload's Local API/REST en vez del virtual module de Vite —
  la forma de los objetos (`slug`, `title`, `year`, `stack`, etc.) se mantiene igual a propósito para minimizar
  cambios en `windows.jsx`/`console.jsx`.
- Confirmar que Neon sigue dentro de su tier gratis tras el seed (0.5 GB storage, 190h compute/mes) — para 12
  registros de texto esto no debería ser un riesgo real, pero se verifica una vez en el dashboard de Neon como
  cierre del plan.

## Riesgos conocidos y aceptados

- **Cambio de framework completo** (Vite→Next.js) es la pieza de mayor riesgo del plan — cualquier comportamiento
  sutil de la SPA actual (animaciones, timing del boot de la terminal, hash routing) puede romperse en la
  migración y requiere verificación visual manual exhaustiva, no solo build limpio.
- **Vendor lock-in de arquitectura**: a diferencia de Decap (que podía revertirse a "solo archivos" en cualquier
  momento), una vez migrado a Postgres, volver a un modelo estático requeriría un export explícito de datos — se
  acepta este costo porque es exactamente el trade-off que Jorge pidió (login real, edición instantánea).
- **Cold starts / DX del admin** en tráfico bajo — aceptado, no se optimiza en este plan.
