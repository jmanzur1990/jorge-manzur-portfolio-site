import { useCallback, useEffect, useMemo, useState } from "react";
import { PORTFOLIO_DATA } from "./data.js";
import { BootScreen, Dock, MenuBar, Wallpaper, WindowChrome, WindowFrame } from "./desktop.jsx";
import { ConsoleWindow } from "./console.jsx";
import {
  AboutWindow,
  BlogWindow,
  ContactWindow,
  ExperienceWindow,
  HeroWindow,
  PostWindow,
  ProjectsWindow,
} from "./windows.jsx";

const PREF_DEFAULTS = {
  theme: "sunset",
  font: "editorial",
};

const PREF_KEY = "manzur-os:prefs";

const THEMES = [
  { id: "sunset", label: "Sunset", colors: ["#efe3c8", "#e63b7a", "#1c8fa8", "#f0c845"] },
  { id: "miami", label: "Miami", colors: ["#fbd9ea", "#d11a6b", "#009b8c", "#ffd23f"] },
  { id: "cyber", label: "Cyber", colors: ["#1a0b2e", "#ff2a8e", "#00d4ff", "#ffd23f"] },
  { id: "news", label: "News", colors: ["#f0e6cf", "#c3252f", "#1f4c8a", "#e8b73e"] },
];

const FONTS = [
  { value: "editorial", label: "Editorial" },
  { value: "magazine", label: "Magazine" },
  { value: "boulevard", label: "Boulevard" },
];

const WINDOWS_CONFIG = [
  {
    id: "hero",
    title: "manzur · about.txt",
    component: HeroWindow,
    initial: { x: 56, y: 60, w: 720, h: 420 },
    initiallyOpen: true,
  },
  {
    id: "about",
    title: "Sobre mí",
    component: AboutWindow,
    initial: { x: 800, y: 60, w: 380, h: 420 },
    initiallyOpen: true,
  },
  {
    id: "projects",
    title: "Proyectos",
    component: ProjectsWindow,
    initial: { x: 40, y: 500, w: 860, h: 460 },
    initiallyOpen: true,
  },
  {
    id: "blog",
    title: "El cuaderno",
    component: BlogWindow,
    initial: { x: 920, y: 500, w: 440, h: 460 },
    initiallyOpen: true,
  },
  {
    id: "experience",
    title: "Trayectoria",
    component: ExperienceWindow,
    initial: { x: 220, y: 200, w: 580, h: 540 },
    initiallyOpen: false,
  },
  {
    id: "contact",
    title: "Contacto",
    component: ContactWindow,
    initial: { x: 700, y: 240, w: 440, h: 460 },
    initiallyOpen: false,
  },
  {
    id: "prefs",
    title: "Preferencias",
    component: PreferencesWindow,
    initial: { x: 1040, y: 120, w: 360, h: 360 },
    initiallyOpen: false,
  },
];

function safeStorageRead(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageWrite(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing and blocked storage should not break the site.
  }
}

function readPrefs() {
  const raw = safeStorageRead(PREF_KEY);
  if (!raw) return PREF_DEFAULTS;
  try {
    const parsed = JSON.parse(raw);
    const theme = THEMES.some((t) => t.id === parsed.theme) ? parsed.theme : PREF_DEFAULTS.theme;
    const font = FONTS.some((f) => f.value === parsed.font) ? parsed.font : PREF_DEFAULTS.font;
    return { theme, font };
  } catch {
    return PREF_DEFAULTS;
  }
}

function usePrefs() {
  const [prefs, setPrefs] = useState(readPrefs);

  const setPref = useCallback((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev };
      if (key === "theme" && THEMES.some((t) => t.id === value)) next.theme = value;
      if (key === "font" && FONTS.some((f) => f.value === value)) next.font = value;
      safeStorageWrite(PREF_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return [prefs, setPref];
}

function getInitialBooted() {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
    return window.sessionStorage.getItem("manzur-os:booted") === "1";
  } catch {
    return true;
  }
}

function markBooted() {
  try {
    window.sessionStorage.setItem("manzur-os:booted", "1");
  } catch {
    // Non-critical.
  }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

function parseHash() {
  const hash = window.location.hash || "";
  if (!hash || hash === "#/" || hash === "#") return { kind: "home" };
  const match = hash.match(/^#\/(post|proyecto)\/([^/?#]+)$/);
  if (!match) return { kind: "unknown" };
  const slug = decodeURIComponent(match[2]);
  if (match[1] === "post") {
    return PORTFOLIO_DATA.posts.some((p) => p.slug === slug)
      ? { kind: "post", slug }
      : { kind: "unknown" };
  }
  return PORTFOLIO_DATA.projects.some((p) => p.slug === slug)
    ? { kind: "project", slug }
    : { kind: "unknown" };
}

function hashFor(kind, slug) {
  if (kind === "post") return `#/post/${encodeURIComponent(slug)}`;
  if (kind === "project") return `#/proyecto/${encodeURIComponent(slug)}`;
  return "#/";
}

function writeHash(mode, kind, slug) {
  const next = hashFor(kind, slug);
  const url = `${window.location.pathname}${window.location.search}${next}`;
  window.history[mode === "push" ? "pushState" : "replaceState"](null, "", url);
}

function ThemePicker({ value, onChange }) {
  return (
    <div className="pref-theme-grid">
      {THEMES.map((th) => {
        const on = th.id === value;
        return (
          <button key={th.id} type="button" className="pref-swatch" onClick={() => onChange(th.id)} aria-pressed={on}>
            <span>{th.label}</span>
            <span className="pref-dots" aria-hidden="true">
              {th.colors.map((c) => <i key={c} style={{ background: c }} />)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PreferencesWindow({ prefs, setPref }) {
  return (
    <div className="prefs-window">
      <div className="kicker accent">Sistema</div>
      <h2 className="display sm">Preferencias.</h2>
      <section className="pref-section">
        <h3>Paleta</h3>
        <ThemePicker value={prefs.theme} onChange={(v) => setPref("theme", v)} />
      </section>
      <section className="pref-section">
        <h3>Tipografía</h3>
        <div className="pref-radios">
          {FONTS.map((font) => (
            <label key={font.value}>
              <input
                type="radio"
                name="font-pairing"
                value={font.value}
                checked={prefs.font === font.value}
                onChange={() => setPref("font", font.value)}
              />
              <span>{font.label}</span>
            </label>
          ))}
        </div>
        <div className="pref-sample">
          <div>The quick brown fox</div>
          <p>jumps over the lazy dog · 1234567890</p>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [prefs, setPref] = usePrefs();
  const isMobile = useIsMobile();
  const [booted, setBooted] = useState(getInitialBooted);
  const [openIds, setOpenIds] = useState(
    WINDOWS_CONFIG.filter((w) => w.initiallyOpen).map((w) => w.id),
  );
  const [zOrder, setZOrder] = useState(["about", "blog", "projects", "hero"]);
  const [focusedId, setFocusedId] = useState("hero");
  const [activeProjectSlug, setActiveProjectSlug] = useState(null);
  const [activePostSlug, setActivePostSlug] = useState(null);
  const [needsHashNormalize, setNeedsHashNormalize] = useState(false);

  const activeProject = useMemo(
    () => PORTFOLIO_DATA.projects.find((p) => p.slug === activeProjectSlug) || null,
    [activeProjectSlug],
  );
  const activePost = useMemo(
    () => PORTFOLIO_DATA.posts.find((p) => p.slug === activePostSlug) || null,
    [activePostSlug],
  );
  const postIdx = useMemo(
    () => PORTFOLIO_DATA.posts.findIndex((p) => p.slug === activePostSlug),
    [activePostSlug],
  );

  const focusWindow = useCallback((id) => {
    setFocusedId(id);
    setZOrder((prev) => [...prev.filter((x) => x !== id), id]);
  }, []);

  const openWindow = useCallback((id) => {
    setOpenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    focusWindow(id);
    if (isMobile) {
      window.requestAnimationFrame(() => {
        document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [focusWindow, isMobile]);

  const closeWindow = useCallback((id) => {
    setOpenIds((prev) => prev.filter((x) => x !== id));
    setZOrder((prev) => prev.filter((x) => x !== id));
    setFocusedId((prev) => (prev === id ? null : prev));
  }, []);

  const applyHashState = useCallback((state) => {
    if (state.kind === "post") {
      setActivePostSlug(state.slug);
      setActiveProjectSlug(null);
      focusWindow("post");
      return;
    }
    if (state.kind === "project") {
      setActiveProjectSlug(state.slug);
      setActivePostSlug(null);
      focusWindow("console");
      return;
    }
    setActivePostSlug(null);
    setActiveProjectSlug(null);
    setZOrder((prev) => prev.filter((x) => x !== "post" && x !== "console"));
    setFocusedId((prev) => (prev === "post" || prev === "console" ? null : prev));
  }, [focusWindow]);

  useEffect(() => {
    const syncFromHash = () => {
      const state = parseHash();
      applyHashState(state);
      setNeedsHashNormalize(state.kind === "unknown");
    };
    syncFromHash();
    const onHashChange = () => syncFromHash();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [applyHashState]);

  useEffect(() => {
    if (!needsHashNormalize) return;
    writeHash("replace", "home");
    setNeedsHashNormalize(false);
  }, [needsHashNormalize]);

  const openProjectConsole = useCallback((slug) => {
    writeHash("push", "project", slug);
    applyHashState({ kind: "project", slug });
  }, [applyHashState]);

  const closeConsole = useCallback(() => {
    writeHash("replace", "home");
    applyHashState({ kind: "home" });
  }, [applyHashState]);

  const openPost = useCallback((slug) => {
    writeHash("push", "post", slug);
    applyHashState({ kind: "post", slug });
  }, [applyHashState]);

  const closePost = useCallback(() => {
    writeHash("replace", "home");
    applyHashState({ kind: "home" });
  }, [applyHashState]);

  const navPost = useCallback((delta) => {
    const i = PORTFOLIO_DATA.posts.findIndex((p) => p.slug === activePostSlug);
    const next = PORTFOLIO_DATA.posts[i + delta];
    if (!next) return;
    writeHash("replace", "post", next.slug);
    applyHashState({ kind: "post", slug: next.slug });
  }, [activePostSlug, applyHashState]);

  const finishBoot = useCallback(() => {
    markBooted();
    setBooted(true);
  }, []);

  const renderWindowContent = (id, Comp) => {
    if (id === "projects") return <Comp onSelect={openProjectConsole} />;
    if (id === "blog") return <Comp onSelect={openPost} />;
    if (id === "prefs") return <Comp prefs={prefs} setPref={setPref} />;
    return <Comp />;
  };

  const mobileSections = WINDOWS_CONFIG.filter((w) => openIds.includes(w.id));

  return (
    <div className={`desktop theme-${prefs.theme} font-${prefs.font} ${isMobile ? "mobile-mode" : ""}`}>
      <Wallpaper />
      <MenuBar onOpenPrefs={() => openWindow("prefs")} />

      {!booted && <BootScreen onDone={finishBoot} />}

      {isMobile ? (
        <main className="mobile-stack">
          {mobileSections.map((w) => (
            <section key={w.id} id={`card-${w.id}`} className={`mobile-card win ${focusedId === w.id ? "focused" : ""}`}>
              <WindowChrome title={w.title} focused={focusedId === w.id} onClose={() => closeWindow(w.id)}>
                {renderWindowContent(w.id, w.component)}
              </WindowChrome>
            </section>
          ))}
          {activeProject && (
            <section id="card-console" className="mobile-card win focused terminal-win">
              <WindowChrome title={`terminal · ${activeProject.slug}.sh`} focused onClose={closeConsole}>
                <ConsoleWindow project={activeProject} />
              </WindowChrome>
            </section>
          )}
          {activePost && (
            <section id="card-post" className="mobile-card win focused notebook-win">
              <WindowChrome title={`SimpleNotes · ${activePost.slug}.txt`} focused onClose={closePost}>
                <PostWindow
                  post={activePost}
                  onPrev={() => navPost(-1)}
                  onNext={() => navPost(1)}
                  hasPrev={postIdx > 0}
                  hasNext={postIdx < PORTFOLIO_DATA.posts.length - 1}
                />
              </WindowChrome>
            </section>
          )}
        </main>
      ) : (
        <>
          {WINDOWS_CONFIG.map((w) => {
            if (!openIds.includes(w.id)) return null;
            const z = zOrder.indexOf(w.id) + 10;
            return (
              <WindowFrame
                key={w.id}
                id={w.id}
                title={w.title}
                x={w.initial.x}
                y={w.initial.y}
                w={w.initial.w}
                h={w.initial.h}
                z={z}
                focused={focusedId === w.id}
                onFocus={() => focusWindow(w.id)}
                onClose={() => closeWindow(w.id)}
              >
                {renderWindowContent(w.id, w.component)}
              </WindowFrame>
            );
          })}

          {activeProject && (
            <WindowFrame
              key={`console-${activeProject.slug}`}
              id="console"
              title={`terminal · ${activeProject.slug}.sh`}
              x={140}
              y={110}
              w={780}
              h={540}
              z={(zOrder.indexOf("console") + 1 || zOrder.length + 1) + 10}
              focused={focusedId === "console"}
              onFocus={() => focusWindow("console")}
              onClose={closeConsole}
              className="terminal-win"
            >
              <ConsoleWindow project={activeProject} />
            </WindowFrame>
          )}

          {activePost && (
            <WindowFrame
              key={`post-${activePost.slug}`}
              id="post"
              title={`SimpleNotes · ${activePost.slug}.txt`}
              x={180}
              y={70}
              w={640}
              h={700}
              z={(zOrder.indexOf("post") + 1 || zOrder.length + 2) + 10}
              focused={focusedId === "post"}
              onFocus={() => focusWindow("post")}
              onClose={closePost}
              className="notebook-win"
            >
              <PostWindow
                post={activePost}
                onPrev={() => navPost(-1)}
                onNext={() => navPost(1)}
                hasPrev={postIdx > 0}
                hasNext={postIdx < PORTFOLIO_DATA.posts.length - 1}
              />
            </WindowFrame>
          )}
        </>
      )}

      <Dock
        windows={WINDOWS_CONFIG}
        openIds={openIds}
        onOpen={openWindow}
        onFocus={isMobile ? openWindow : focusWindow}
      />
    </div>
  );
}
