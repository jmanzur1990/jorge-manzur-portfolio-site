// Portfolio content — Jorge Manzur
import { projects, posts } from "virtual:portfolio-content";

export const PORTFOLIO_DATA = {
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

  projects,

  posts,

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
