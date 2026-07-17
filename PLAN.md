# Plan: Integrar Decap CMS para editar Proyectos y Posts
_Locked via grill — by Claude + Jorge Manzur · revised after Codex Rounds 1–2_

## Goal

Permitir que Jorge edite el contenido de `projects` y `posts` (hoy hardcoded en `src/data.js`) desde un
panel de administración (`/admin`) sin tocar código, usando Decap CMS con backend Git (GitHub). Cada
edición hace commit directo al repo y dispara un redeploy automático en Vercel, que es el host de
producción real de este sitio. `hero`, `about`, `experience` y `contact` quedan fuera de este alcance y
siguen viviendo en `data.js` como están.

## Approach

0. **Prerrequisito — publicar el repo en GitHub y limpiar el deploy path**
   - `git remote -v` está vacío hoy: el proyecto nunca se pusheó a GitHub. **Orden exacto de pasos**
     (importa el orden: el workflow de Pages se elimina y `base` se fija a `/` *antes* del primer push,
     para que ese primer push no dispare ni un solo run del workflow obsoleto):
     1. Eliminar `.github/workflows/deploy.yml` del working tree.
     2. Fijar `base: "/"` en `vite.config.js` (ya no se deriva de `GITHUB_REPOSITORY`).
     3. Commitear el estado actual completo (incluyendo `src/`, `package.json`, `index.html`,
        `vite.config.js` ya corregido — hoy todo esto está untracked).
     4. Jorge crea un repo **público** en GitHub (`gh repo create --public` o vía web) y se pushea a
        `main` — la visibilidad pública es una decisión fijada (ver sección 5, define el scope OAuth
        exacto `public_repo`, sin rama condicional).
   - Se conecta explícitamente el repo de GitHub recién creado como Git Source del proyecto Vercel
     existente (`jorge-manzur-portfolio-site`) desde el dashboard de Vercel — esto no ocurre solo por
     crear el repo, es un paso manual de Jorge. Se verifica con un push de prueba que dispara un deploy.

1. **Contenido como archivos**
   - Crear `content/projects/*.md` y `content/posts/*.md`, uno por entrada, con frontmatter YAML.
   - Migrar el contenido actual de `PORTFOLIO_DATA.projects` y `.posts`, normalizando en la migración
     (no después) los campos que hoy no cumplen el esquema nuevo:
     - `repoUrl`: los valores actuales son `github.com/...` sin esquema — se normalizan a
       `https://github.com/...` como parte de la migración de datos, no como excepción del validador.
     - `date` de posts: los valores actuales son strings ya formateados en español
       (`"12 · Abril · 2026"`) — se migran a `YYYY-MM-DD` real (ISO) en el frontmatter; el formato
       visual en español se genera en React a partir del ISO (una función `formatDateEs(iso)`), no se
       guarda como string pre-formateado. Para evitar el bug clásico de zona horaria (`new
       Date("2026-04-12")` se interpreta en UTC medianoche, que en Tegucigalpa —UTC-6— mostraría 11 de
       abril), `formatDateEs` parsea los componentes `YYYY-MM-DD` directamente y arma la fecha con
       `Date.UTC(...)`, formateando con `Intl.DateTimeFormat` fijado a `timeZone: "UTC"` — nunca deja
       que el motor de fechas aplique la zona horaria local del visitante. El widget real de Decap
       para fechas se llama `datetime` (no existe un widget `date` separado) — la config exacta del
       campo es `{ widget: "datetime", date_format: "YYYY-MM-DD", time_format: false, picker_utc: true }`,
       que deshabilita el input de hora y fuerza que el picker interprete/muestre en UTC, evitando el
       mismo desfase de zona horaria también dentro del panel de edición.
   - `projects` frontmatter: `slug (string, requerido, inmutable — ver más abajo), order (integer,
     requerido, NO único — ver empates en sección 2), title (string, requerido), year (string,
     requerido, 4 dígitos), tag (enum, requerido), blurb (string, requerido), stack (list de strings, no
     vacía), color (enum, requerido), liveUrl (string, requerido, URL https válida), repoUrl (string,
     requerido, URL https válida)`. El validador de la sección 2 exige `liveUrl` **siempre**
     (incondicional, sin "si presente") porque `console.jsx` lo renderiza directo en dos lugares
     (`url-bar` y el texto `ready` del boot del terminal) sin ningún chequeo de ausencia hoy — hacerlo
     opcional exigiría diseñar un estado "sin preview" en la UI del terminal, trabajo adicional no
     pedido; todos los proyectos actuales ya tienen `liveUrl`, así que exigirlo no pierde datos.
   - `posts` frontmatter: `slug (string, requerido, inmutable), title (string, requerido), date
     (date-only ISO, requerido), kicker (string, requerido), excerpt (string, requerido), readMin
     (integer, requerido, > 0)`. `body` es Markdown en el cuerpo del archivo.
   - **Slug: fuente única de verdad, inmutable tras creación — regla operativa, no un lock técnico.** El
     campo `slug` de frontmatter es canónico (de eso dependen las hash URLs `#/post/<slug>` y
     `#/proyecto/<slug>` ya compartidas). En Decap, la colección se configura con
     `identifier_field: slug` y `slug: "{{fields.slug}}"` para que el nombre de archivo generado
     coincida con el campo al crear una entrada. Decap no ofrece un widget nativo "editable solo en
     creación" — en vez de simular uno, el plugin de contenido (sección 2) valida en cada build que
     `basename(archivo) === frontmatter.slug` y que el slug matchea `^[a-z0-9-]+$` (seguro para URL);
     esto detecta si alguien edita el slug de una entrada existente (el archivo no se renombra solo, así
     que archivo y campo divergirían) y falla el build con un mensaje claro. La regla "no edites el
     slug de una entrada existente" queda documentada como convención operativa para Jorge, reforzada
     por esta validación de build, no por un candado de UI. Renombrar un slug existente rompe enlaces
     compartidos — está fuera de alcance manejar redirects.

2. **Carga en build time — Vite plugin, no código de browser**
   - Un **plugin de Vite** (`vite-plugin-content.js`) corre en el proceso de build de Node: lee
     `content/projects/*.md` y `content/posts/*.md` del filesystem, parsea con **`gray-matter`** (dependencia
     directa pineada en `package.json`, no transitiva/implícita — corre server-side en el plugin, nunca
     llega al bundle de cliente), y expone el resultado como un **virtual module**
     (`virtual:portfolio-content`) que `src/data.js` importa con `import { projects, posts } from
     'virtual:portfolio-content'`.
   - El plugin implementa `configureServer`/`handleHotUpdate` de Vite para vigilar ambos directorios de
     contenido y invalidar/recargar el virtual module cuando un archivo se crea, edita o borra — así el
     dev server refleja cambios sin reiniciar manualmente.
   - El plugin valida en build time con un esquema estricto (falla el build con error claro y el archivo
     ofensor señalado si no se cumple) cubriendo **todos** los campos listados en la sección 1: tipos,
     requeridos, enums (`color`, `tag`), listas no vacías (`stack`), fechas ISO válidas (`date`),
     enteros positivos (`readMin`), enteros para `order`, URLs `https:` válidas incondicionales
     (`liveUrl` y `repoUrl`, ambos siempre requeridos y validados — no "si presente"), slugs únicos
     dentro de cada colección.
   - **`order` es requerido pero explícitamente NO único** — se ordena por `order` ascendente y se
     desempata con `slug` en orden alfabético cuando dos proyectos comparten el mismo `order`,
     exactamente igual que el manejo de fechas iguales en posts. Esto es deliberado: si `order` fuera
     único-obligatorio, mover un proyecto entre dos existentes (ej. insertar entre `order: 2` y
     `order: 3`) requeriría editar y commitear varios archivos atómicamente, algo que Decap no ofrece de
     forma transaccional — un commit a la vez desde el panel dejaría el estado intermedio con un
     duplicado y el build fallando hasta el segundo commit.
   - **Reordenar de forma controlable**: dado que el desempate por `slug` es alfabético (no
     necesariamente el orden deseado), asignar a un proyecto el mismo `order` que su vecino no garantiza
     quedar exactamente antes o después de él si los slugs no cooperan. Para tener control real sobre la
     posición sin depender de coincidencias alfabéticas, se usan **valores de `order` espaciados desde
     el inicio** (10, 20, 30, 40...) como convención obligatoria (documentada en `config.yml` como ayuda
     del campo, no solo sugerida): mover o insertar un proyecto es asignarle un valor intermedio exacto
     (ej. `order: 25` para ubicarlo entre 20 y 30) — esto es siempre una edición de un solo archivo, sin
     empates, sin ambigüedad de desempate, y sin ventana de build roto. Los empates por slug quedan como
     first-fallback determinístico solo para el caso borde de que dos entradas terminen con el mismo
     valor por error, no como mecanismo primario de reordenamiento.
   - `num` de cada proyecto se computa como `String(index + 1).padStart(2, '0')` sobre el array ya
     ordenado (por `order`, con `slug` como tie-breaker).
   - Posts se ordenan por `date` descendente (post más reciente primero, igual que hoy) con `slug` como
     tie-breaker determinístico ante fechas iguales. `navPost`/Previous-Next en `App.jsx` siguen
     operando sobre el array ya ordenado — sin cambios en esa lógica, el array llega pre-ordenado.
   - `hero/about/experience/contact` quedan intactos, definidos directamente en `data.js` como hoy.
   - **Serialización segura del virtual module**: el plugin nunca arma el código del módulo por
     interpolación de strings (`` `export const projects = ${rawContent}` ``, vulnerable a que un valor
     de frontmatter con comillas/backticks rompa o inyecte JS generado). Se usa `JSON.stringify` sobre
     los objetos ya parseados, validados, y (para posts) con el Markdown ya convertido a HTML sanitizado
     — todo lo que llega al bundle de cliente es JSON-safe por construcción, sin bordes de interpolación
     de código fuente. El pipeline de Markdown completo (parseo + sanitización) corre **una sola vez,
     acá, en build time / Node** — ver sección 3 para el detalle; `PostWindow` nunca parsea Markdown en
     el cliente, solo consume el HTML ya sanitizado que este plugin produjo.

3. **Pipeline de Markdown — un solo lugar, en build time (Node), no en el cliente**
   - Se reemplaza el widget Markdown de Decap (deprecado) por el widget **`richtext`** de Decap, con
     configuración explícita y restrictiva (no los defaults, que habilitan modo raw HTML y componentes
     de imagen/código):
     - `sanitize_preview: true`.
     - `modes: ["rich_text"]` (deshabilita explícitamente el modo `raw` que permitiría pegar HTML crudo).
     - `buttons`: lista explícita reducida — `["bold", "italic", "link", "bulleted-list",
       "numbered-list", "quote"]` (sin headings más allá de lo que ya usa el diseño, sin tablas).
     - `editor_components: []` (sin componentes custom de imagen/código embebidos vía el editor
       richtext — las imágenes de posts, si las hay, se manejan como campo `image` aparte, no inline).
   - **Todo el procesamiento de Markdown ocurre dentro del mismo plugin de Vite de la sección 2, en
     Node, en build time — nunca en el browser.** El plugin parsea el Markdown fuente de cada post con
     `marked` configurado para **no permitir HTML crudo** (tokens `html` ignorados/escapados vía un
     `Renderer` custom, sin depender de opciones deprecadas como `mangle`/`headerIds` que no existen en
     Marked 8+), preservando qué bloques son párrafo vs. blockquote (no aplanando todo a texto plano).
     El HTML resultante se sanitiza con una versión Node-compatible de DOMPurify (`isomorphic-dompurify`,
     que trae su propia implementación DOM vía `jsdom` — DOMPurify puro requiere un DOM del browser que
     no existe en el proceso de build), con configuración explícita: `ALLOWED_TAGS` limitado a los tags
     que puede producir el pipeline (`p, blockquote, strong, em, a, ul, ol, li`), `ALLOWED_ATTR` sin
     `on*`/`style` (solo `href` en `a`), y `ALLOWED_URI_REGEXP` restringido a esquemas `https:`/`mailto:`
     (bloquea `javascript:`). Esto es defensa en profundidad de dos capas independientes (parser sin HTML
     crudo + sanitizador con allowlist), corriendo una sola vez en build, no repetida en el cliente.
   - El plugin emite, por post: `bodyHtml` (el HTML ya sanitizado, listo para
     `dangerouslySetInnerHTML` directo en `PostWindow` sin ningún procesamiento adicional en el
     cliente), y `bodyText` (texto plano concatenado de todos los bloques, para `countWords`/
     `countChars` — ver más abajo).
   - Al generar `bodyHtml`, el primer bloque de tipo párrafo se marca explícitamente con la clase
     `first` (`<p class="first">`) para preservar el efecto de letra capital que ya existe en
     `styles.css:1007` (`.notes-body p.first::first-letter`) — el HTML por defecto de `marked` no
     produce esta clase, así que el plugin post-procesa el primer `<p>` generado antes de emitirlo.
   - Los blockquotes se emiten como `<blockquote class="notes-quote">` (clase agregada por el plugin, no
     por `marked` por defecto) para heredar el estilo visual real ya existente en `styles.css:1017`.
   - `PostWindow` (en `windows.jsx`) consume directamente `post.bodyHtml` vía
     `dangerouslySetInnerHTML={{ __html: post.bodyHtml }}` — sin `marked` ni DOMPurify importados en el
     bundle de cliente, y sin parseo de Markdown en runtime del browser.
   - `countWords`/`countChars` operan sobre `post.bodyText` (ya precalculado por el plugin a partir del
     Markdown fuente, no del HTML) — se actualizan en este mismo cambio para leer el campo nuevo en vez
     de iterar el array de bloques `{type, text}` que desaparece.

4. **Panel de administración**
   - `public/admin/index.html`: carga el bundle de Decap CMS anclado a una **versión exacta pineada**
     desde el CDN, con atributos `integrity` (SRI, hash de esa versión exacta) **y**
     `crossorigin="anonymous"` en el `<script>` tag — sin `crossorigin`, el navegador no envía la
     verificación SRI en modo CORS y el script no carga; se confirma en implementación que el CDN
     elegido responde con headers CORS compatibles antes de depender de esto en producción.
   - `/admin/*` sirve con los mismos headers de defensa que las funciones OAuth (sección 5):
     `Content-Security-Policy` con `frame-ancestors 'none'` (evita que `/admin` se enmarque en un
     `<iframe>` de otro sitio — clickjacking), `X-Content-Type-Options: nosniff`,
     `Referrer-Policy: no-referrer`. Estos headers se configuran a nivel de Vercel (`vercel.json`,
     sección `headers` con `source: "/admin/(.*)"`), no solo en las funciones serverless.
   - `public/admin/config.yml`:
     - `backend: { name: github, repo: <owner>/<repo>, branch: main, base_url:
       "https://jorge-manzur-portfolio-site.vercel.app", auth_endpoint: "api/auth" }` — se fija
       explícitamente `auth_endpoint` porque el default de Decap es `/auth` en la raíz del `base_url`, y
       las funciones OAuth de este plan viven en `/api/auth`/`/api/callback` (ver sección 5). Sin este
       campo, Decap llamaría al endpoint equivocado.
     - `media_folder: "public/uploads"`, `public_folder: "/uploads"`.
     - Colección `projects`: `folder: "content/projects"`, `create: true`, `identifier_field: slug`,
       `slug: "{{fields.slug}}"`, campo `order` (número, `value_type: int`, requerido) editable
       manualmente, `sortable_fields: ["order", "title", "year"]` para ordenar la vista del panel (no
       persiste automáticamente al reordenar — limitación conocida, ver Riesgos).
     - Colección `posts`: `folder: "content/posts"`, `create: true`, `identifier_field: slug`,
       `slug: "{{fields.slug}}"`, campo `body` como widget `richtext` (sección 3), campo `readMin` con
       `value_type: int`.
     - Sin `publish_mode: editorial_workflow` — publicación directa a `main`.
   - Verificación local con **un solo comando** (`npm run cms:local`, vía `concurrently` o `npm-run-all`)
     que levanta Vite con `--strictPort` y `decap-server` (devDependency pineada, no `npx` sin pin) bindeado
     a `localhost` con `ORIGIN` restringido al origin exacto de Vite local. `config.yml` incluye
     `local_backend: true` a nivel raíz (sin esto el proxy local no apunta al filesystem real del repo).

5. **OAuth proxy en Vercel — implementación concreta**
   - Dos funciones serverless de Vercel: `api/auth.js` (inicia el flujo, redirige a GitHub) y
     `api/callback.js` (recibe el código, intercambia por token, lo devuelve a Decap vía `postMessage`).
   - Manejo de estado en un entorno stateless (Vercel functions no comparten memoria entre invocaciones):
     el `state` (CSRF) y el `code_verifier` de PKCE se sellan dentro de una cookie
     `Secure; HttpOnly; SameSite=Lax; Path=/api/` de vida corta (5 minutos) generada en `api/auth.js` y
     leída de vuelta en `api/callback.js` — no se depende de un store externo (KV/Redis) para esta escala
     de uso de un solo editor. La cookie se borra explícitamente (`Max-Age=0`) en cada resultado del
     callback, sea éxito, error, o mismatch — así una cookie ya usada no queda reutilizable
     (el caso de "un solo login a la vez" se acepta como limitación conocida: Jorge no necesita loguear
     dos sesiones simultáneas al panel de administración de su propio portfolio).
   - PKCE con `S256` en el intercambio del código.
   - El `redirect_uri` es idéntico y hardcodeado en ambos pasos del flujo (la request de autorización a
     GitHub y el intercambio de código por token):
     `https://jorge-manzur-portfolio-site.vercel.app/api/callback` — GitHub exige que coincida
     exactamente en ambos, y es el mismo valor registrado en la GitHub OAuth App.
   - **El handshake de `postMessage` implementa el protocolo exacto de Decap, en el orden correcto**
     (Decap ignora cualquier mensaje que no matchee este formato y esta secuencia — un JSON propio no
     sirve):
     1. La ventana principal (donde vive `/admin`, ejecutando el código de Decap) abre el popup hacia
        `api/auth.js` y **registra su listener de `message` antes de abrir el popup**, esperando primero
        recibir el eco `"authorizing:github"` del popup — Decap no envía nada hasta que el popup se lo
        confirma primero.
     2. El popup (servido por `api/callback.js` tras completar el intercambio OAuth) es el que **inicia**
        la secuencia: apenas carga, envía `"authorizing:github"` vía `postMessage` al `window.opener`.
     3. La ventana principal, al recibir ese eco, valida `event.origin` (debe ser el origin exacto del
        sitio) — coincide con el comportamiento real de Decap, que solo valida `origin` en este punto,
        no `event.source` (ese chequeo adicional se hace del lado del popup, ver el punto siguiente).
     4. Solo entonces el popup envía el resultado real:
        `` `authorization:github:success:${JSON.stringify({ token, provider: "github" })}` `` en éxito,
        o `` `authorization:github:error:${JSON.stringify({ message: "..." })}` `` en error (state
        inválido, usuario no allowlisted, fallo del intercambio) — siempre con ese prefijo exacto
        seguido del JSON, nunca un objeto plano.
     5. Todo `postMessage`, en ambas direcciones, usa el origin exacto del sitio
        (`https://jorge-manzur-portfolio-site.vercel.app`) como target, nunca `"*"`.
     - **Validación de origen en el popup**: antes de que el popup envíe cualquier mensaje real (paso 4),
       confirma que `window.opener` existe y es la misma ventana que lo abrió
       (`window.opener !== null && window.opener.location.origin === "https://jorge-manzur-portfolio-
       site.vercel.app"`, verificado del lado del popup) — esto es defensa adicional más allá de lo que
       Decap valida por defecto, para que el popup no envíe el token a una ventana `opener` que no sea
       la esperada si el flujo se abrió de forma inusual.
   - Tras recibir el token de GitHub, `api/callback.js` valida que el usuario autenticado (vía
     `GET /user` de la API de GitHub con ese token) tiene el **ID numérico inmutable de Jorge**
     (hardcodeado como variable de entorno `ALLOWED_GITHUB_USER_ID`, no el username que puede cambiar) —
     si no matchea, se rechaza el login antes de devolver el token a Decap.
   - **Decisión fijada: el repo de GitHub es público.** El scope OAuth es exactamente `public_repo`
     (no una rama condicional `public_repo`/`repo` — se elimina la ambigüedad). Este valor:
     - Se hardcodea en la URL de autorización que construye `api/auth.js` (GitHub requiere el scope en
       la request de autorización, no se configura a nivel de OAuth App).
     - Se configura también en `public/admin/config.yml` como `backend.auth_scope: public_repo`
       (Decap por defecto pide `repo` si `auth_scope` no está seteado explícitamente — sin este campo,
       Decap pediría un scope más amplio del que `api/auth.js` otorga, y el login fallaría).
     - `api/callback.js` verifica que el scope efectivamente otorgado tras el intercambio sea exactamente
       `public_repo` (via el header `X-OAuth-Scopes` de la respuesta de GitHub) antes de devolver el
       token a Decap — rechaza silenciosamente cualquier intento de solicitar un scope distinto.
     - Se acepta explícitamente que `public_repo` da acceso de escritura a **todos** los repos públicos
       del usuario, no solo a este sitio — usar un GitHub App con permisos acotados a un solo repo sería
       más seguro pero es una integración más compleja; para un solo editor con esta cuenta personal, el
       blast radius ampliado se acepta como riesgo conocido en vez de construir esa integración
       adicional.
   - Respuestas de ambas funciones incluyen `Cache-Control: no-store`.
   - Logs nunca imprimen el `code` de OAuth, el `code_verifier`, ni el `access_token` — se redactan
     antes de cualquier log.
   - `Client ID`/`Client Secret` como variables de entorno en Vercel, nunca committeadas.
   - Respuestas de ambas funciones incluyen headers de defensa: `X-Content-Type-Options: nosniff`,
     `X-Frame-Options: DENY` (o `Content-Security-Policy: frame-ancestors 'none'`), y
     `Referrer-Policy: no-referrer` — mitiga clickjacking sobre las páginas de auth y evita filtrar la
     URL con el `code`/`state` vía el header `Referer` a un tercero.
   - Casos a probar manualmente antes de considerar esto terminado: replay de un `state` ya usado,
     `state` no coincidente, usuario deniega el acceso en GitHub, y confirmación de que el token nunca
     aparece en logs ni en la URL final (solo en el body del `postMessage`).

6. **Uploads — con un consumidor real, validación activa con límites ejecutables**
   - **Consumidor concreto**: se agrega `coverImage` como campo **opcional** más al esquema de
     `projects` enumerado en la sección 1 (no queda fuera de ese esquema canónico), validado en el plugin
     como `string | null`, y con la restricción adicional de que si está presente debe ser una ruta que
     empiece con `/uploads/` (nunca una URL externa arbitraria ni un `data:` URI) y debe corresponder a
     un archivo que efectivamente pasó el escaneo de la sección 6 — el build falla si `coverImage`
     apunta a un archivo inexistente o no escaneado. En Decap, el widget `image` del campo se configura
     con `choose_url: false` (deshabilita el botón de "insertar por URL" que el widget ofrece por
     defecto, forzando siempre una subida real a `media_folder`). Si está presente, se muestra en
     `ProjectsWindow` como miniatura junto al proyecto (ajuste menor de UI, mismo patrón visual que ya
     existe para mostrar `color`/`tag`). Es opcional porque los proyectos actuales no tienen imágenes —
     no rompe la migración; sin este campo poblado, el comportamiento visual es idéntico al actual.
   - El plugin de contenido (corriendo en el mismo paso de build que valida el esquema de contenido,
     sección 2) **escanea `public/uploads`** activamente con límites concretos, no aspiracionales:
     - Extensión declarada, tipo detectado por **magic bytes reales del archivo** (no el MIME reportado
       por el sistema de archivos, que no es una fuente confiable), y decodificación exitosa de la
       imagen deben coincidir — cualquier discrepancia falla el build.
     - Formatos aceptados: **PNG, JPEG, WebP únicamente**. SVG explícitamente rechazado (riesgo de
       contenido activo tipo `<script>`).
     - Límite de tamaño por archivo: **5 MB exactos**.
     - Límite agregado del directorio `public/uploads`: **200 MB exactos**.
     - Límite de cantidad de archivos: **500 archivos** (evita crecimiento descontrolado del repo).
     - Límite de dimensiones decodificadas: **4000×4000 píxeles máximo** por imagen (evita bombas de
       descompresión — un archivo pequeño que decodifica a una imagen gigantesca y agota memoria en
       build/runtime). Para WebP animado (que puede tener cientos de frames, cada uno contando contra
       el presupuesto de memoria real aunque el archivo comprimido sea chico), se rechaza directamente
       cualquier WebP animado (`ANIM` chunk presente) — solo WebP estático se acepta.
   - Esta validación corre como parte del mismo build que valida el esquema de contenido — no es un
     paso opcional aparte, y sus límites son valores fijos comprobables, no un "ej." orientativo.

7. **Ajustes puntuales al código de UI existente que la migración pasaba por alto**
   - `windows.jsx:67` tiene hoy el string literal hardcodeado `"Selección · 2022 — 2025"` en
     `ProjectsWindow`, no derivado de ningún dato. Se reemplaza por un rango calculado a partir de
     `PORTFOLIO_DATA.projects`: `Math.min(...years)` – `Math.max(...years)` sobre el campo `year` de cada
     proyecto ya cargado — así el rango mostrado siempre refleja el contenido real editado desde Decap,
     sin quedar desactualizado como el string fijo actual.
   - `repoUrl` (campo del frontmatter de `projects`, sección 1) **no tiene ningún consumidor en el
     código actual** — `console.jsx:92` arma la URL del repo interpolando `p.slug` en un string fijo
     (`"github.com:jmanzur/" + p.slug`), no lee `repoUrl` en ningún lado. Para que el campo
     `repoUrl` que Jorge edita desde el CMS tenga efecto real (si no, es un campo fantasma que se puede
     editar sin que cambie nada visible), `console.jsx:92` se actualiza para usar `p.repoUrl`
     directamente en vez de reconstruir la URL desde el slug.
   - `console.jsx:26,44` (`bootText` y `previewSrcDoc`, ambos memoizados con `useMemo`) dependen solo de
     `[project.slug]`, no de `[project]` ni de los campos específicos que realmente usan
     (`title`/`stack`/`liveUrl` para `bootText`; `liveUrl`/`stack` para `previewSrcDoc`). Si Jorge edita
     un proyecto existente (mismo slug, campos distintos) y el dev server aplica HMR sobre el virtual
     module de contenido (sección 2), estos memos no se invalidan y siguen mostrando datos viejos hasta
     un refresh manual. Se corrige cambiando la dependencia a `[project]` (el objeto completo, no solo
     el slug) — dado que el virtual module reconstruye el array de proyectos completo en cada
     invalidación, un proyecto editado llega como una referencia de objeto nueva y el memo se recalcula
     correctamente. Costo aceptado: recalcula en cualquier cambio de referencia del objeto `project`, no
     solo en los campos que estos memos realmente usan — trade-off simple y correcto sobre optimizar la
     lista exacta de dependencias por campo, que agregaría complejidad no justificada para este caso.

8. **Verificación y rollback**
   - Chequeo de paridad de contenido: se implementa como comando **único y separado**
     (`npm run migration:verify`), corrido una sola vez durante la migración inicial. Compara
     `content/*.md` contra un fixture congelado del `data.js` pre-migración, aplicando explícitamente las
     transformaciones esperadas antes de comparar (no una comparación byte-a-byte, que fallaría
     incorrectamente sobre cambios intencionales):
     - `num` (proyectos, string `"01"`) se compara contra `order` ya convertido a la misma posición
       relativa (mismo orden relativo, no el mismo valor literal — `num` desaparece como campo
       persistido, se recalcula).
     - `body` de posts (array de bloques `{type, text}`) se compara contra el Markdown nuevo mediante
       una función de normalización simple: concatenar el `text` de cada bloque del array original y
       comparar contra el texto plano extraído del Markdown nuevo (ignorando sintaxis) — confirma que
       no se perdió contenido en la conversión a Markdown, sin exigir que el formato sea idéntico.
     - `repoUrl` y `date` se comparan ya normalizados (`https://github.com/...` y `YYYY-MM-DD`
       respectivamente) contra el valor semánticamente equivalente original, documentado como diff
       esperado, no como discrepancia.
     - Todos los demás campos (`slug`, `title`, `blurb`, `stack`, `tag`, `color`, `liveUrl`, `year`,
       `kicker`, `excerpt`, `readMin`) se comparan literalmente.
   - **No** se deja como parte de `npm run build` — el build normal solo corre la validación de
     esquema/invariantes de la sección 2, que sí debe pasar en cada edición legítima desde Decap sin
     comparar contra un snapshot congelado (si no, cualquier edición real desde el CMS rompería el
     deploy).
   - Probar `/admin` en local con `npm run cms:local` antes de conectar el backend real.
   - **Antes de habilitar el login OAuth en producción** (gate explícito, no opcional): correr
     `npm ci && npm run build` limpio desde cero (no reusar `node_modules` de desarrollo — confirma que
     el build es reproducible con las dependencias exactas del lockfile), y ejercitar manualmente la
     matriz completa de casos adversos del flujo OAuth listada en la sección 5 (handshake completo
     éxito/error, `state` repetido, `state` no coincidente, usuario deniega el acceso, usuario no
     allowlisted, cookie corrupta/expirada, origin del `postMessage` incorrecto) más al menos un intento
     de subir un archivo que viole cada límite de la sección 6 (formato no permitido, tamaño excedido,
     dimensiones excedidas, WebP animado) — confirmando que cada caso falla de la forma esperada, no
     silenciosamente.
   - Confirmar en producción: login vía GitHub OAuth funciona, crear/editar una entrada produce un
     commit real en el repo, y Vercel redespliega automáticamente reflejando el cambio.
   - Confirmar que un post con blockquote en Markdown renderiza visualmente igual al estilo
     `.notes-quote` actual (incluyendo el efecto de letra capital en el primer párrafo), y que
     `countWords`/`countChars` no rompen con el nuevo formato de `body`.
   - **Deploy y rollback — semántica exacta de Vercel, no solo "un deploy pasó":**
     - Se verifica explícitamente en el dashboard de Vercel que **Production Branch** está seteado a
       `main` (Settings → Git) — confirma que el push a `main` es lo que efectivamente despliega a
       producción, no solo "algún deploy se disparó".
     - Se confirma que el dominio canónico (`jorge-manzur-portfolio-site.vercel.app`) apunta al SHA de
       commit esperado tras cada deploy de prueba (visible en el dashboard de deployments).
     - **Rollback primario**: Vercel permite revertir instantáneamente a un deployment anterior ya
       construido desde el dashboard (Deployments → "..." → Promote to Production) — más rápido que
       esperar un nuevo build de `git revert`, y es el mecanismo a usar primero ante un problema en
       producción.
     - **Reconciliación**: después de un rollback instantáneo en Vercel, se hace `git revert` del commit
       problemático en el repo para que el historial de `main` quede consistente con lo que está
       realmente en producción — evita que el próximo push (de Decap o de Jorge) vuelva a desplegar el
       commit roto por accidente.
     - El build fallando ruidosamente ante datos inválidos (sección 2) sigue siendo la red de seguridad
       primaria para prevenir que contenido roto llegue a producción en primer lugar.

## Key decisions & tradeoffs

- **Vercel es el único host de producción**: se elimina el workflow de GitHub Pages en vez de dejarlo
  inerte — dispara en cada push igual, así que "inerte" no era una opción real.
- **Slug inmutable, fuente única en frontmatter, `identifier_field`/`slug` template en Decap**: evita que
  el nombre de archivo generado por Decap diverja del campo que usan las hash URLs compartidas.
- **`gray-matter` como dependencia directa server-side en un plugin de Vite** (vs. parseo en cliente):
  corre en Node durante el build, nunca en el browser — evita el error real de APIs de Node no
  disponibles en el bundle de cliente.
- **`order` explícito y requerido para proyectos, `date` ISO real para posts**: ambos son fuentes de
  verdad editables y deterministas para el ordenamiento, reemplazando cualquier dependencia de
  enumeración de archivos o de un string de fecha pre-formateado.
- **Parity check es un comando único de migración, separado del build recurrente**: evita que ediciones
  legítimas desde el CMS rompan el deploy por no matchear un snapshot congelado.
- **Widget `richtext` en vez de Markdown deprecado, con `marked` configurado sin HTML crudo + DOMPurify
  como segunda capa**: dos controles independientes, ninguno es el único punto de falla.
- **OAuth state/PKCE verifier en cookie sellada de vida corta** (vs. store externo tipo Redis): evita
  agregar infraestructura nueva para la escala de un solo editor, a costa de que el estado vive en el
  navegador del usuario en vez de un store centralizado — aceptable dado que es de un solo uso y expira
  rápido.
- **Allowlist del ID numérico de GitHub de Jorge en el callback OAuth**: capa de autorización adicional
  más allá de "cualquiera con acceso de escritura al repo", que además es inmune a cambios de username.
- **Uploads restringidos a PNG/JPEG/WebP con validación de magic bytes activa en build**: SVG queda
  fuera de esta iteración por ser vector de contenido activo.
- **`console.jsx` pasa a leer `repoUrl`/dependencias de objeto completo en vez de reconstruir desde
  `slug`**: corrige dos gaps reales detectados tarde en la revisión — un campo editable (`repoUrl`) sin
  ningún efecto visible, y memos que no se invalidan en HMR al editar un proyecto existente. Cambio
  acotado a las líneas exactas que ya tenían el problema, no una refactorización más amplia.
- **Rango de años en `ProjectsWindow` calculado desde los datos, no hardcodeado**: el string
  `"2022 — 2025"` que existe hoy quedaría desactualizado apenas se agregue o edite un proyecto desde el
  CMS — se reemplaza por un cálculo trivial sobre `year` de los proyectos ya cargados.

## Risks / open questions

- Decap no soporta reordenar una colección por drag-and-drop que persista automáticamente al valor de
  `order` en el archivo — se edita el número manualmente. Si esto resulta molesto en la práctica, se
  puede evaluar un widget custom más adelante.
- El paquete de OAuth proxy para Vercel Functions no es oficial de Decap (el oficial apunta a Netlify) —
  se implementa a mano siguiendo el contrato documentado; los casos adversos listados en la sección 5
  deben probarse manualmente antes de dar esto por terminado.
- Migrar `body` de bloques a Markdown/richtext es un cambio de formato de datos; revertirlo requeriría
  re-migrar.
- Conectar el repo de GitHub nuevo al proyecto Vercel existente es un paso manual en el dashboard — si
  Jorge prefiere, se puede documentar como paso explícito con capturas/instrucciones en el momento de
  la implementación.
- SVG no se admite en uploads en esta iteración — si hace falta más adelante, requiere sanitización
  explícita (fuera de alcance).
- El scope OAuth (`public_repo`/`repo`) otorga acceso de escritura más amplio que solo este repo —
  aceptado deliberadamente en vez de integrar un GitHub App con permisos acotados (ver sección 5),
  proporcional a que es la cuenta personal de Jorge autenticándose a su propio panel.
- Verificación de OAuth y de la validación de uploads es **manual, no una suite de tests automatizada**
  (mocks de OAuth, fixtures de contenido hostil) — se acepta como suficiente para un flujo que Jorge
  ejercita él mismo antes de dar la feature por terminada; si en el futuro se agregan más editores o el
  flujo cambia con frecuencia, vale la pena revisar esto.
- No hay logging estructurado con request IDs ni notificaciones de fallo de deploy más allá de lo que
  Vercel ya provee out-of-the-box (email/dashboard en deploy fallido) — un runbook de observability
  dedicado es desproporcionado para un sitio personal de un solo editor; si Vercel notifica un deploy
  roto, Jorge lo revierte con `git revert` como ya está descripto.

## Out of scope

- Edición de `hero`, `about`, `experience`, `contact` desde el CMS.
- Editorial workflow / roles múltiples de edición.
- Servicio de storage de imágenes externo (Cloudinary u otro).
- Traducción/internacionalización del contenido.
- Ambiente de staging o suite de integración automatizada para el flujo OAuth.
- Sanitización de SVG para permitir su subida como media.
- Redirects automáticos para slugs renombrados (dado que el slug es inmutable por diseño, no debería
  ser necesario en operación normal).
