import { useEffect, useMemo, useRef, useState } from "react";

// rAF-driven, timestamp-based reveal so throttled timers in inactive
// frames can't stall the animation. Caller passes chars-per-second.
function useTypewriter(text, cps = 320) {
  const [shown, setShown] = useState("");
  useEffect(() => {
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

export function ConsoleWindow({ project }) {
  if (!project) return null;
  const bootText = useMemo(() => buildBootText(project), [project.slug]);
  const [shown, done] = useTypewriter(bootText, 280);
  const [showPreview, setShowPreview] = useState(false);
  const outRef = useRef(null);

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [shown]);

  useEffect(() => {
    setShowPreview(false);
    if (done) {
      const t = setTimeout(() => setShowPreview(true), 320);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [done, project.slug]);

  const previewSrcDoc = useMemo(() => buildPreviewSrcDoc(project), [project.slug]);
  const safeLiveUrl = getSafeHttpsUrl(project.liveUrl);

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
            {safeLiveUrl ? (
              <button className="open-live" onClick={() => window.open(safeLiveUrl, "_blank", "noopener")}>
                ↗ Live
              </button>
            ) : (
              <span className="open-live inert">↗ Live</span>
            )}
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

function buildPreviewSrcDoc(p) {
  const palette = {
    pink:   { bg: "#1a1530", fg: "#fbf6e7", accent: "#e63b7a", glow: "rgba(230,59,122,.4)" },
    cyan:   { bg: "#0d1e2b", fg: "#e6fbff", accent: "#1c8fa8", glow: "rgba(28,143,168,.4)" },
    yellow: { bg: "#1a1530", fg: "#fbf6e7", accent: "#f0c845", glow: "rgba(240,200,69,.4)" },
  }[p.color] || { bg: "#1a1530", fg: "#fbf6e7", accent: "#e63b7a", glow: "rgba(230,59,122,.4)" };
  const chips = p.stack.map(function (s) {
    return '<span class="chip">' + escapeHtml(s) + "</span>";
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

function getSafeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
