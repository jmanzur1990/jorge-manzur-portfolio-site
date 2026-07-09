// Portfolio content — Jorge Manzur
window.PORTFOLIO_DATA = {
  hero: {
    name: ["Jorge", "Manzur"],
    role: "Full-Stack Engineer",
    location: "Tegucigalpa, HN",
    established: "Est. MCMXCV",
    blurb:
      "Construyo el frente, el fondo, y los bits del medio. Diez años escribiendo software que prefiere ser legible antes que ingenioso.",
    tags: ["TypeScript", "Postgres", "Go", "React", "Linux"],
    status: "Disponible para proyectos · Q2 2026",
  },

  about: {
    paragraphs: [
      "Empecé a programar en una PC Pentium II que heredé de mi tío. Veintidós años después, sigo creyendo que la web es el medio más fascinante que se inventó en mi vida.",
      "Hoy trabajo en stacks completos: APIs en Go, interfaces en React, despliegues en cualquier nube que no me complique demasiado. Me gustan los problemas largos, las bases de datos relacionales, y los proyectos donde el código vive más de tres años.",
    ],
    nowPlaying: "Talking Heads — Remain in Light",
    nowReading: "‹Designing Data-Intensive Applications›",
    nowBuilding: "Un sintetizador modular en el navegador",
  },

  projects: [
    {
      num: "01",
      slug: "cassette-studio",
      title: "Cassette Studio",
      year: "2025",
      tag: "Producto",
      blurb:
        "Reproductor de audio para podcasters con interfaz que emula un walkman. Web Audio API, transcripción automática, suscripciones.",
      stack: ["Next.js", "Postgres", "Whisper", "Stripe"],
      color: "pink",
      liveUrl: "https://cassette.manzur.dev",
      repoUrl: "github.com/jmanzur/cassette-studio",
    },
    {
      num: "02",
      slug: "polaroid-cloud",
      title: "Polaroid Cloud",
      year: "2024",
      tag: "Side-project",
      blurb:
        "Plataforma de fotografía analógica con filtros que respetan el grano real de los negativos. 8.000 usuarios activos.",
      stack: ["React", "Node", "S3", "Sharp"],
      color: "cyan",
      liveUrl: "https://polaroid.cloud",
      repoUrl: "github.com/jmanzur/polaroid-cloud",
    },
    {
      num: "03",
      slug: "arcade-dev",
      title: "Arcade.dev",
      year: "2024",
      tag: "Open source",
      blurb:
        "Plataforma para subir y compartir juegos retro hechos en HTML5. Leaderboards globales, replays guardados.",
      stack: ["Vue", "Phaser", "Firebase"],
      color: "yellow",
      liveUrl: "https://arcade.dev",
      repoUrl: "github.com/jmanzur/arcade-dev",
    },
    {
      num: "04",
      slug: "tracklist-api",
      title: "Tracklist API",
      year: "2023",
      tag: "Infraestructura",
      blurb:
        "API GraphQL para gestión de colecciones musicales. Maneja 2M de discos catalogados con búsqueda en menos de 30ms.",
      stack: ["Go", "GraphQL", "Redis", "ElasticSearch"],
      color: "pink",
      liveUrl: "https://api.tracklist.dev",
      repoUrl: "github.com/jmanzur/tracklist-api",
    },
    {
      num: "05",
      slug: "synthwave-ui",
      title: "Synthwave UI Kit",
      year: "2023",
      tag: "Open source",
      blurb:
        "Biblioteca de componentes React con estética retro-futurista. 2.1k estrellas en GitHub, usada en 40+ proyectos.",
      stack: ["React", "TypeScript", "Storybook"],
      color: "cyan",
      liveUrl: "https://synthwave-ui.manzur.dev",
      repoUrl: "github.com/jmanzur/synthwave-ui",
    },
    {
      num: "06",
      slug: "vinyldb",
      title: "VinylDB",
      year: "2022",
      tag: "E-commerce",
      blurb:
        "Marketplace para coleccionistas de vinilos en Latinoamérica. Procesamiento de pagos, logística integrada con OCA.",
      stack: ["Rails", "Postgres", "Stripe"],
      color: "yellow",
      liveUrl: "https://vinyldb.com",
      repoUrl: "github.com/jmanzur/vinyldb",
    },
  ],

  posts: [
    {
      slug: "css-a-mano-2026",
      title: "Por qué sigo escribiendo CSS a mano en 2026",
      date: "12 · Abril · 2026",
      kicker: "Opinión",
      excerpt:
        "Tailwind es maravilloso pero a veces el cascade es exactamente lo que necesitás. Una defensa de las hojas de estilo escritas con paciencia.",
      readMin: 8,
      body: [
        { type: "p", text: "Hace seis meses un colega me preguntó por qué seguía escribiendo CSS a mano. Me había mandado una captura de pantalla de su proyecto nuevo: un botón con cuarenta y dos clases de utilidad. Le contesté con una sola línea de CSS y nunca volvimos a tocar el tema." },
        { type: "p", text: "No tengo nada en contra de Tailwind. Es la mejor pieza de software que pasó por mi terminal en los últimos cinco años. Pero hay algo que se pierde cuando uno deja de pensar en el documento como un documento, y empieza a pensar en él como una colección de chips de Lego pegados con scotch." },
        { type: "quote", text: "La utilidad gana cuando uno está empezando. La especificidad gana cuando uno tiene que mantener." },
        { type: "p", text: "Mi regla actual: el día que el CSS de un archivo .vue o .jsx ocupa más caracteres que el HTML que estiliza, algo se rompió. No el código —el modelo mental. Volvé a las hojas de estilo, ponéle nombre a las cosas, y dormí mejor." },
      ],
    },
    {
      slug: "sintetizador-200-lineas",
      title: "Construyendo un sintetizador en 200 líneas de JavaScript",
      date: "27 · Marzo · 2026",
      kicker: "Tutorial",
      excerpt:
        "Web Audio API explicada desde cero, con osciladores, filtros y un teclado MIDI que funciona en el navegador. Código incluido.",
      readMin: 14,
      body: [
        { type: "p", text: "El audio en el navegador me parece más mágico que cualquier otra parte de la web. Le pedís a un AudioContext que cree un oscilador, le decís que toque un La en 440 hertz, y la computadora hace exactamente eso, sin drivers, sin instalaciones, sin permisos raros." },
        { type: "p", text: "Empecé este proyecto un domingo a la tarde porque quería entender qué pasaba realmente cuando uno usa un sintetizador. No la metáfora visual de los plugins, sino los grafos de nodos: oscilador → filtro → ganancia → destino. Una vez que lo ves así, todo el resto es decoración." },
        { type: "quote", text: "El sonido no es una cosa: es una secuencia de presiones. La computadora solo necesita saber cuánta, cuándo." },
        { type: "p", text: "El código completo está en GitHub. Doscientas líneas, sin dependencias, MIT. Si lo agarrás y le agregás un secuenciador, mandame el link." },
      ],
    },
    {
      slug: "ssr-1999",
      title: "Server-side rendering, explicado como si fuera 1999",
      date: "04 · Marzo · 2026",
      kicker: "Arquitectura",
      excerpt:
        "Lo que llamamos SSR moderno es PHP con mejores herramientas. Por qué eso no es un insulto, sino el mejor cumplido.",
      readMin: 11,
      body: [
        { type: "p", text: "En 1999 nadie hablaba de «server-side rendering». Se llamaba «hacer una página web» y consistía en que un servidor armaba HTML, te lo mandaba, y el navegador lo mostraba. Punto. Era tan obvio que nadie se molestaba en darle un nombre." },
        { type: "p", text: "Después vino la era del cliente. Cuatro megabytes de JavaScript para mostrar un menú desplegable. Tiempos de carga de seis segundos sobre fibra óptica. Errores de hidratación que nadie sabe debuggear. Una generación entera de developers que cree que el HTML se inventó como output de React." },
        { type: "quote", text: "Cada paradigma nuevo en la web es el redescubrimiento de algo que PHP hacía bien en 2003." },
        { type: "p", text: "Hoy volvemos al servidor con nombres distintos: Next, Remix, Astro, Phoenix. Bienvenidos otra vez. El servidor nunca se fue. Lo único que cambió son nuestras herramientas para hablarle." },
      ],
    },
    {
      slug: "generadores-estaticos",
      title: "El placer silencioso de los generadores estáticos",
      date: "18 · Febrero · 2026",
      kicker: "Herramientas",
      excerpt:
        "Hugo, Eleventy, Astro. Tres formas distintas de no usar JavaScript en producción y dormir mejor por las noches.",
      readMin: 9,
      body: [
        { type: "p", text: "Mi sitio personal lleva ocho años corriendo sin caerse una sola vez. No tiene base de datos, ni servidor de aplicación, ni cache layer, ni autoescalado. Es una carpeta de archivos HTML servidos por nginx desde un VPS de cinco dólares." },
        { type: "p", text: "Lo más cerca que estuve de tener un problema fue el día que se cayó el datacenter entero. Doce horas más tarde nginx volvió a levantar y mi sitio volvió a estar online, intacto, sin ninguna intervención mía. Esa es la promesa de los archivos estáticos." },
        { type: "p", text: "Cada vez que un cliente me pide un blog, le ofrezco primero un generador estático. Cada vez que un cliente me pide una landing, le ofrezco primero un generador estático. La respuesta correcta a casi cualquier pregunta web es «¿podemos hacerlo con archivos planos?». Probá empezar por ahí." },
      ],
    },
    {
      slug: "cassette-a-la-nube",
      title: "De cassette a la nube: una saga de backups",
      date: "30 · Enero · 2026",
      kicker: "Personal",
      excerpt:
        "Veinte años de fotos familiares, cassettes, VHS y código fuente. Cómo digitalicé el archivo de mi vieja y aprendí sobre durabilidad de medios.",
      readMin: 16,
      body: [
        { type: "p", text: "Mi vieja guardó todo. Cassettes de cumpleaños, VHS de viajes, rollos de fotos sin revelar, disquetes de tres y media con la tesis de mi viejo en WordPerfect. En 2024, cuando se mudó a un departamento más chico, llegó el momento de decidir qué hacer con la caja." },
        { type: "p", text: "Pasé seis meses digitalizando, dos meses ordenando, y aprendí más sobre formatos de archivo en ese año que en los diez anteriores. Que los CD-R se descomponen. Que los VHS pierden saturación cada vez que los reproducís. Que un disquete de 1996 puede leer mejor que un DVD del 2010." },
        { type: "quote", text: "Los medios duran lo que dura el dispositivo que los lee. Después, es arqueología." },
        { type: "p", text: "Todo está hoy en tres lugares: un disco duro local, un servidor en Hetzner, y una caja en Glacier. Si los tres se caen el mismo día, mi vieja entenderá. Pero quería contar el proceso porque alguien, en algún lado, está mirando una caja parecida y no sabe por dónde empezar." },
      ],
    },
    {
      slug: "tipos-fin-de-semana",
      title: "Cómo los sistemas de tipos me salvaron el fin de semana",
      date: "11 · Enero · 2026",
      kicker: "TypeScript",
      excerpt:
        "Un caso real de migración de JavaScript a TypeScript en producción. Lo bueno, lo malo y los tres bugs que encontró el compilador.",
      readMin: 7,
      body: [
        { type: "p", text: "Un viernes a las ocho de la noche, un cliente me escribió que el formulario de checkout no estaba sumando bien los impuestos. Lo peor que te puede pasar un viernes. Cargué el repo, abrí el archivo culpable, y vi exactamente el tipo de código que escribiría yo mismo hace cinco años." },
        { type: "p", text: "Tres horas después, en vez de parchar el bug, había migrado el módulo entero a TypeScript estricto. El compilador encontró otros tres errores que nadie había detectado, dos de ellos potencialmente caros. El bug original se solucionó en una línea." },
        { type: "p", text: "El sistema de tipos no escribe el código por vos, pero te avisa cuando estás mintiendo. Es la diferencia entre tener un amigo honesto y trabajar solo." },
      ],
    },
  ],

  experience: [
    {
      role: "Senior Full-Stack Engineer",
      org: "Modem Labs",
      period: "2023 — Presente",
      city: "Buenos Aires (remoto)",
      blurb:
        "Lidero el desarrollo del producto principal. Stack: TypeScript, Postgres, Go. Equipo de seis ingenieros distribuidos.",
    },
    {
      role: "Full-Stack Developer",
      org: "Hifi Studios",
      period: "2020 — 2023",
      city: "Berlín / Buenos Aires",
      blurb:
        "Desarrollé tres productos completos de cero a producción. Plataforma de streaming musical para sellos independientes.",
    },
    {
      role: "Front-end Developer",
      org: "Pixel Forge",
      period: "2018 — 2020",
      city: "Buenos Aires",
      blurb:
        "Sitios y aplicaciones para agencias creativas. Aprendí a tomarme en serio la accesibilidad y el rendimiento.",
    },
    {
      role: "Licenciatura en Ciencias de la Computación",
      org: "Universidad de Buenos Aires",
      period: "2014 — 2018",
      city: "UBA · FCEN",
      blurb:
        "Tesis sobre compresión de audio sin pérdida. Premio al mejor trabajo final de la promoción.",
    },
  ],

  contact: {
    email: "jorge@manzur.dev",
    phone: "+54 9 11 4123 5678",
    socials: [
      { label: "GitHub", handle: "@jmanzur" },
      { label: "LinkedIn", handle: "in/jorgemanzur" },
      { label: "Mastodon", handle: "@jorge@hachyderm.io" },
      { label: "Bandcamp", handle: "jmanzur" },
    ],
  },
};
