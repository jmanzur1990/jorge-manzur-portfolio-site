// windows.jsx — content of each window
import { useMemo } from "react";
import { usePortfolioData } from "./portfolio-data.jsx";

// Parses a YYYY-MM-DD date-only ISO string and formats it in Spanish,
// pinned to UTC throughout so no local timezone offset (e.g. UTC-6 in
// Tegucigalpa) can shift the displayed day.
function formatDateEs(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const formatted = new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return formatted.replace(/ de /g, " · ").replace(/^(\w)/, (c) => c.toUpperCase());
}

export function HeroWindow() {
  const data = usePortfolioData();
  const d = data.hero;
  const photo = data.about.photo;
  return (
    <div>
      <div className="kicker accent" style={{ marginBottom: 14 }}>
        Portfolio · {d.established}
      </div>
      <div className="hero-grid">
        <div>
          <h1 className="display huge hero-name">
            <span className="line">{d.name[0]}</span>
            <span className="line shift"><span className="amp"></span> {d.name[1]}</span>
          </h1>
        </div>
        <div className={`hero-portrait${photo ? " has-photo" : ""}`}>
          {photo && <img src={photo.url} alt={photo.alt || "Foto de perfil"} />}
          <div className="corner" />
        </div>
      </div>
      <div className="hero-meta">
        <span>{d.role}</span>
        <span className="dot" />
        <span>{d.location}</span>
        <span className="dot" />
        <span>{d.status}</span>
      </div>
      <hr className="rule double" style={{ margin: "18px 0" }} />
      <p className="hero-blurb">{d.blurb}</p>
      <div className="hero-tags">
        {d.tags.map((t, i) =>
        <span key={t} className={`tag ${i === 0 ? "pink" : i === 2 ? "cyan" : ""}`}>{t}</span>
        )}
      </div>
    </div>);

}

export function AboutWindow() {
  const d = usePortfolioData().about;
  return (
    <div>
      <div className="kicker" style={{ marginBottom: 10 }}>Capítulo I</div>
      <h2 className="display med" style={{ marginBottom: 14 }}>Sobre mí.</h2>
      {d.paragraphs.map((p, i) =>
      <p key={i} style={{ marginBottom: 10, fontSize: 15, lineHeight: 1.5 }}>{p}</p>
      )}
      <hr className="rule" style={{ margin: "16px 0" }} />
      <div className="kicker accent">En este momento</div>
      <dl className="about-now">
        <dt>Escucho</dt><dd>{d.nowPlaying}</dd>
        <dt>Leo</dt><dd>{d.nowReading}</dd>
        <dt>Construyo</dt><dd>{d.nowBuilding}</dd>
      </dl>
    </div>);

}

export function ProjectsWindow({ onSelect }) {
  const d = usePortfolioData().projects;
  const years = d.map((p) => Number(p.year));
  const yearRange = years.length
    ? `${Math.min(...years)} — ${Math.max(...years)}`
    : "";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div>
          <div className="kicker accent">Selección · {yearRange}</div>
          <h2 className="display med">Proyectos.</h2>
        </div>
        <span className="mono muted">{d.length.toString().padStart(2, "0")} casos · click para conectar →</span>
      </div>
      <div className="projects-grid">
        {d.map((p) =>
        <button key={p.num} className="project" type="button"
          onClick={() => onSelect && onSelect(p.slug)}
          style={{ textAlign: "left", font: "inherit", color: "inherit", cursor: "default", background: "transparent" }}>
            <div className="project-head">
              <span className={`project-num ${p.color}`}>Nº {p.num}</span>
              <span className="project-year">{p.year} · {p.tag}</span>
            </div>
            <h3 className="project-title">{p.title}</h3>
            <p className="project-blurb">{p.blurb}</p>
            <div className="project-foot" style={{ justifyContent: "space-between", display: "flex", alignItems: "center" }}>
              <span className="project-stack">{p.stack.join("  ·  ")}</span>
              <span className="mono" style={{ color: "var(--pink)", fontWeight: 600 }}>→ ssh</span>
            </div>
          </button>
        )}
      </div>
    </div>);

}

export function BlogWindow({ onSelect }) {
  const d = usePortfolioData().posts;
  return (
    <div>
      <div className="kicker accent" style={{ marginBottom: 6 }}>Notas y ensayos</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <h2 className="display med">El cuaderno.</h2>
        <span className="mono muted">{d.length.toString().padStart(2, "0")} entradas</span>
      </div>
      <p className="muted" style={{ fontSize: 13, fontStyle: "italic", marginBottom: 16 }}>
        Lo que escribo cuando no estoy compilando.
      </p>
      <div>
        {d.map((p, i) =>
        <article key={p.slug} className="post" onClick={() => onSelect && onSelect(p.slug)}
          style={{ cursor: "default" }}>
            <div className="post-head">
              <span className="post-kicker">{p.kicker}</span>
              <span className="post-date">{formatDateEs(p.date)}</span>
            </div>
            <h3 className="post-title">{p.title}</h3>
            <p className="post-excerpt">{p.excerpt}</p>
            <span className="post-read">→ {p.readMin} min de lectura</span>
          </article>
        )}
      </div>
    </div>);

}

export function ExperienceWindow() {
  const d = usePortfolioData().experience;
  return (
    <div>
      <div className="kicker accent" style={{ marginBottom: 6 }}>Currículum</div>
      <h2 className="display med" style={{ marginBottom: 16 }}>Trayectoria.</h2>
      <div>
        {d.map((e, i) =>
        <div key={i} className="cv-item">
            <div className="cv-period">{e.period}</div>
            <div>
              <h3 className="cv-role">{e.role}</h3>
              <div className="cv-org">
                <span>{e.org}</span>
                <span className="city">{e.city}</span>
              </div>
              <p className="cv-blurb">{e.blurb}</p>
            </div>
          </div>
        )}
      </div>
      <hr className="rule" style={{ margin: "18px 0" }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span className="tag">TypeScript</span>
        <span className="tag">Go</span>
        <span className="tag">React · Next.js</span>
        <span className="tag">Postgres · Redis</span>
        <span className="tag">Docker · K8s</span>
        <span className="tag">CI/CD</span>
        <span className="tag">GraphQL · gRPC</span>
        <span className="tag">Web Audio</span>
      </div>
    </div>);

}

export function ContactWindow() {
  const d = usePortfolioData().contact;
  return (
    <div>
      <div className="kicker accent" style={{ marginBottom: 6 }}>¿Hablamos?</div>
      <h2 className="display med" style={{ marginBottom: 8 }}>Contacto.</h2>
      <p style={{ fontSize: 14, lineHeight: 1.5, fontStyle: "italic", color: "var(--ink-soft)" }}>
        Respondo a todos los correos en menos de 48 horas. Si es algo urgente,
        marcá «<span style={{ color: "var(--pink)" }}>URGENTE</span>» en el asunto y bajo a 12.
      </p>
      <div className="contact-card">
        <div className="contact-row">
          <span className="k">Email</span>
          <span className="v"><a href={`mailto:${d.email}`}>{d.email}</a></span>
        </div>
        <div className="contact-row">
          <span className="k">Teléfono</span>
          <span className="v">{d.phone}</span>
        </div>
        {d.socials.map((s) =>
        <div key={s.label} className="contact-row">
            <span className="k">{s.label}</span>
            <span className="v">{s.handle}</span>
          </div>
        )}
      </div>
      <hr className="rule" style={{ margin: "18px 0" }} />
      <p className="mono muted" style={{ textAlign: "center" }}>
        ◆ © {new Date().getFullYear()} · Manzur Industries · Tegucigalpa ◆
      </p>
    </div>);

}

// ── PostWindow (notes program · SimpleText/TextEdit style) ─────────
export function PostWindow({ post, onPrev, onNext, hasPrev, hasNext }) {
  if (!post) return null;
  const posts = usePortfolioData().posts;
  const idx = posts.findIndex((p) => p.slug === post.slug);
  const total = posts.length;
  const wordCount = useMemo(() => countWords(post), [post.slug]);
  const charCount = useMemo(() => countChars(post), [post.slug]);
  return (
    <div className="notes-app" data-screen-label={`Post: ${post.slug}`}>
      {/* Toolbar */}
      <div className="notes-toolbar">
        <select className="notes-tb-select" defaultValue="Garamond" aria-label="Tipografía">
          <option>Garamond</option>
          <option>Geneva</option>
          <option>Monaco</option>
          <option>Chicago</option>
        </select>
        <select className="notes-tb-select" defaultValue="12" aria-label="Tamaño" style={{ width: 56 }}>
          <option>10</option><option>12</option><option>14</option><option>18</option>
        </select>
        <span className="notes-tb-sep" />
        <button type="button" className="notes-tb-btn b" aria-label="Bold">B</button>
        <button type="button" className="notes-tb-btn i" aria-label="Italic">I</button>
        <button type="button" className="notes-tb-btn u" aria-label="Underline">U</button>
        <span className="notes-tb-sep" />
        <button type="button" className="notes-tb-btn" aria-label="Alinear izquierda">≡</button>
        <button type="button" className="notes-tb-btn" aria-label="Centrar">☰</button>
        <button type="button" className="notes-tb-btn" aria-label="Alinear derecha">≣</button>
        <span className="notes-tb-sep" />
        <button type="button" className="notes-tb-btn wide" aria-label="Guardar">▣ Guardar</button>
      </div>

      {/* Ruler */}
      <div className="notes-ruler" aria-hidden="true" />

      {/* Paper */}
      <div className="notes-paper">
        <header className="notes-header">
          <div className="notes-kicker">{post.kicker} · El Cuaderno</div>
          <h1 className="notes-title">{post.title}</h1>
          <div className="notes-meta">
            <span>Por Jorge Manzur</span>
            <span className="sep">·</span>
            <span>{formatDateEs(post.date)}</span>
            <span className="sep">·</span>
            <span>{post.readMin} min de lectura</span>
            <span className="sep">·</span>
            <span>{wordCount} palabras</span>
          </div>
        </header>

        <div className="notes-body" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

        <div className="notes-end">FIN</div>
      </div>

      {/* Status bar */}
      <div className="notes-status">
        <div className="group">
          <span><span className="dot">●</span> {post.slug}.txt</span>
          <span>UTF-8</span>
          <span>Sin guardar</span>
        </div>
        <div className="group">
          <button type="button" disabled={!hasPrev} onClick={onPrev}>← Anterior</button>
          <span>Doc {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          <button type="button" disabled={!hasNext} onClick={onNext}>Siguiente →</button>
        </div>
        <div className="group">
          <span>{wordCount} palabras</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
}

function countWords(post) {
  return (post.bodyText || "").split(/\s+/).filter(Boolean).length;
}

function countChars(post) {
  return (post.bodyText || "").length;
}
