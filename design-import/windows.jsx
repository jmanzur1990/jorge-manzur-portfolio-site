// windows.jsx — content of each window

function HeroWindow() {
  const d = window.PORTFOLIO_DATA.hero;
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
        <div className="hero-portrait">
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

function AboutWindow() {
  const d = window.PORTFOLIO_DATA.about;
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

function ProjectsWindow({ onSelect }) {
  const d = window.PORTFOLIO_DATA.projects;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div>
          <div className="kicker accent">Selección · 2022 — 2025</div>
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

function BlogWindow({ onSelect }) {
  const d = window.PORTFOLIO_DATA.posts;
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
              <span className="post-date">{p.date}</span>
            </div>
            <h3 className="post-title">{p.title}</h3>
            <p className="post-excerpt">{p.excerpt}</p>
            <span className="post-read">→ {p.readMin} min de lectura</span>
          </article>
        )}
      </div>
    </div>);

}

function ExperienceWindow() {
  const d = window.PORTFOLIO_DATA.experience;
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

function ContactWindow() {
  const d = window.PORTFOLIO_DATA.contact;
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

Object.assign(window, {
  HeroWindow, AboutWindow, ProjectsWindow, BlogWindow, ExperienceWindow, ContactWindow,
  ConsoleWindow,
});

// ── PostWindow (notes program · SimpleText/TextEdit style) ─────────
function PostWindow({ post, onPrev, onNext, hasPrev, hasNext }) {
  if (!post) return null;
  const posts = window.PORTFOLIO_DATA.posts;
  const idx = posts.findIndex((p) => p.slug === post.slug);
  const total = posts.length;
  const wordCount = React.useMemo(() => countWords(post), [post.slug]);
  const charCount = React.useMemo(() => countChars(post), [post.slug]);
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
            <span>{post.date}</span>
            <span className="sep">·</span>
            <span>{post.readMin} min de lectura</span>
            <span className="sep">·</span>
            <span>{wordCount} palabras</span>
          </div>
        </header>

        <div className="notes-body">
          {post.body && post.body.map((block, i) => {
            if (block.type === "quote") {
              return <blockquote key={i} className="notes-quote">{block.text}</blockquote>;
            }
            const firstParaIdx = post.body.findIndex((b) => b.type === "p");
            const isFirst = i === firstParaIdx;
            return <p key={i} className={isFirst ? "first" : ""}>{block.text}</p>;
          })}
          {!post.body && <p className="first">{post.excerpt}</p>}
        </div>

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
  if (!post.body) return (post.excerpt || "").split(/\s+/).filter(Boolean).length;
  return post.body.reduce(
    (acc, b) => acc + String(b.text || "").split(/\s+/).filter(Boolean).length,
    0,
  );
}

function countChars(post) {
  if (!post.body) return (post.excerpt || "").length;
  return post.body.reduce((acc, b) => acc + String(b.text || "").length, 0);
}

Object.assign(window, { PostWindow });

// ── useTypewriter ──────────────────────────────────────────────────
// rAF-driven, timestamp-based reveal so throttled timers in inactive
// frames can't stall the animation. Caller passes chars-per-second.
function useTypewriter(text, cps = 320) {
  const [shown, setShown] = React.useState("");
  React.useEffect(() => {
    setShown("");
    if (!text) return undefined;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const elapsed = t - start;
      const i = Math.min(text.length, Math.floor((elapsed / 1000) * cps));
      setShown(text.slice(0, i));
      if (i < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, cps]);
  return [shown, shown.length === (text || "").length];
}

// ── ConsoleWindow ──────────────────────────────────────────────────
function ConsoleWindow({ project }) {
  if (!project) return null;
  const bootText = React.useMemo(() => buildBootText(project), [project.slug]);
  const [shown, done] = useTypewriter(bootText, 280);
  const [showPreview, setShowPreview] = React.useState(false);
  const outRef = React.useRef(null);

  // auto-scroll terminal as text grows
  React.useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [shown]);

  // reveal preview shortly after typing finishes
  React.useEffect(() => {
    setShowPreview(false);
    if (done) {
      const t = setTimeout(() => setShowPreview(true), 320);
      return () => clearTimeout(t);
    }
  }, [done, project.slug]);

  const previewSrcDoc = React.useMemo(() => buildPreviewSrcDoc(project), [project.slug]);

  return (
    <div className="terminal" data-screen-label={`Console: ${project.slug}`}>
      <pre ref={outRef} className="term-out" dangerouslySetInnerHTML={{
        __html: colorizeTerm(shown) + (done ? "" : '<span class="term-cursor"></span>'),
      }} />
      {showPreview && (
        <div className="term-preview">
          <div className="term-chrome">
            <div className="lights"><i /><i /><i /></div>
            <div className="url-bar">
              <span className="lock">⌁</span>
              <span>{project.liveUrl}</span>
            </div>
            <button className="open-live"
              onClick={() => window.open(project.liveUrl, "_blank", "noopener")}>
              ↗ Live
            </button>
          </div>
          <iframe
            className="term-iframe"
            title={`Preview · ${project.title}`}
            srcDoc={previewSrcDoc}
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}

// Build the multiline boot transcript for a project. Mixed markers
// (#prompt, #host, #ok, #warn, #dim, #path) get translated to span
// colors by colorizeTerm — keeps the typewriter source as plain text
// so character revealing is straightforward.
function buildBootText(p) {
  return [
    "MANZUR.OS  ·  Terminal v7.0",
    "──────────────────────────────────────────",
    "",
    "#prompt[jorge@manzur ~]$# ssh deploy@infra.manzur.dev",
    "#dimAuthenticating with key ~/.ssh/id_ed25519...#dim",
    "#okConnection established.#ok",
    "Welcome to Ubuntu 22.04.4 LTS  ·  Last login: " + nowStamp(),
    "",
    "#prompt[jorge@deploy ~]$# cd /var/www/" + p.slug,
    "#prompt[jorge@deploy " + p.slug + "]$# git pull origin main",
    "#dimFrom #pathgithub.com:jmanzur/" + p.slug + "#path",
    "   a31fde2..7c9b002  main -> origin/main",
    "Updating a31fde2..7c9b002  Fast-forward#dim",
    "",
    "#prompt[jorge@deploy " + p.slug + "]$# ./serve --prod",
    "#dim▸ Pulling latest container...        [████████████] 100%",
    "▸ Building production bundle...      [████████████] 100%",
    "▸ Optimizing static assets...        [████████████] 100%",
    "▸ Running migrations...              [████████████] 100%#dim",
    "#okstatus#ok    " + p.stack.map(function (s) { return s.toLowerCase(); }).join(" · "),
    "#oklisten#ok   0.0.0.0:443  (TLS)",
    "#okready#ok    " + p.liveUrl,
    "",
    "#warn▸ Booting preview frame...#warn",
  ].join("\n");
}

// Wrap our #tag markers in spans so the colorizer applies CSS classes
// only after each tag has been fully typed. The typewriter reveals
// characters left-to-right, so a partial "#prom" would otherwise
// flash unstyled. Match the full tag pair before substituting.
function colorizeTerm(s) {
  const escape = (str) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let html = escape(s);
  const classes = ["prompt", "host", "ok", "warn", "dim", "path"];
  for (const c of classes) {
    const re = new RegExp("#" + c + "(.+?)#" + c, "gs");
    html = html.replace(re, function (_, inner) {
      return '<span class="term-' + c + '">' + inner + "</span>";
    });
  }
  return html;
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return d.toISOString().slice(0, 10) + " " +
    pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) +
    " " + Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Generate a self-contained HTML page for the iframe preview.
// This is a placeholder demo styled to feel like the deployed product;
// once project.liveUrl points to a reachable site, swap `srcDoc` for `src`.
function buildPreviewSrcDoc(p) {
  const palette = {
    pink:   { bg: "#1a1530", fg: "#fbf6e7", accent: "#e63b7a", glow: "rgba(230,59,122,.4)" },
    cyan:   { bg: "#0d1e2b", fg: "#e6fbff", accent: "#1c8fa8", glow: "rgba(28,143,168,.4)" },
    yellow: { bg: "#1a1530", fg: "#fbf6e7", accent: "#f0c845", glow: "rgba(240,200,69,.4)" },
  }[p.color] || { bg: "#1a1530", fg: "#fbf6e7", accent: "#e63b7a", glow: "rgba(230,59,122,.4)" };
  const chips = p.stack.map(function (s) {
    return '<span class="chip">' + s + "</span>";
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@1&family=JetBrains+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: "DM Serif Display", Georgia, serif;
    background: ${palette.bg};
    color: ${palette.fg};
    overflow: hidden;
    position: relative;
    padding: 22px 28px;
  }
  body::before {
    content: "";
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 110%, ${palette.glow}, transparent 55%);
    pointer-events: none;
  }
  body::after {
    content: "";
    position: absolute; inset: 0;
    background: repeating-linear-gradient(to bottom, transparent 0 2px, rgba(255,255,255,.025) 2px 3px);
    pointer-events: none;
  }
  .nav {
    position: relative; z-index: 1;
    display: flex; justify-content: space-between; align-items: center;
    font-family: "JetBrains Mono", monospace;
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    opacity: 0.7;
  }
  .nav .links { display: flex; gap: 18px; }
  .hero { position: relative; z-index: 1; margin-top: 6vh; }
  .kicker {
    font-family: "JetBrains Mono", monospace;
    color: ${palette.accent};
    font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
    margin-bottom: 10px;
  }
  h1 {
    font-style: italic; font-weight: 400;
    font-size: clamp(40px, 7.5vw, 84px);
    line-height: 0.95; letter-spacing: -0.02em;
  }
  h1 em { color: ${palette.accent}; font-style: italic; }
  .blurb {
    margin-top: 18px; max-width: 38ch;
    font-family: Georgia, serif; font-style: italic;
    font-size: 15px; line-height: 1.45; opacity: 0.85;
  }
  .chips { margin-top: 22px; display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    font-family: "JetBrains Mono", monospace;
    font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 3px 9px;
    border: 1px solid ${palette.fg}40;
    border-radius: 999px;
  }
  .cta {
    margin-top: 26px; display: inline-flex; align-items: center; gap: 10px;
    background: ${palette.accent}; color: ${palette.bg};
    padding: 10px 18px;
    font-family: "JetBrains Mono", monospace;
    font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
    font-weight: 600;
    border: 0; cursor: pointer;
  }
  .grid {
    position: absolute; left: -10%; right: -10%; bottom: -40%; height: 60%;
    background:
      linear-gradient(to right, ${palette.accent}55 1px, transparent 1px) 0 0 / 40px 40px,
      linear-gradient(to bottom, ${palette.accent}55 1px, transparent 1px) 0 0 / 40px 40px;
    transform: perspective(360px) rotateX(64deg);
    transform-origin: center top;
    opacity: 0.5;
  }
  .badge {
    font-family: "JetBrains Mono", monospace;
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    background: ${palette.fg}; color: ${palette.bg};
    padding: 3px 8px;
  }
</style></head>
<body>
  <div class="grid"></div>
  <div class="nav">
    <span>${escapeHtml(p.slug.toUpperCase())}</span>
    <div class="links"><span>Producto</span><span>Docs</span><span>Pricing</span><span class="badge">Live</span></div>
  </div>
  <div class="hero">
    <div class="kicker">${escapeHtml(p.tag)} · ${escapeHtml(p.year)}</div>
    <h1>${escapeHtml(p.title.split(" ").slice(0, -1).join(" "))} <em>${escapeHtml(p.title.split(" ").slice(-1)[0])}</em></h1>
    <p class="blurb">${escapeHtml(p.blurb)}</p>
    <div class="chips">${chips}</div>
    <div class="cta">Probar demo →</div>
  </div>
</body></html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

Object.assign(window, { ConsoleWindow, useTypewriter });
