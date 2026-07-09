// app.jsx — Manzur.OS main app

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "sunset",
  "font": "editorial"
}/*EDITMODE-END*/;

const WINDOWS_CONFIG = [
  {
    id: "hero",
    title: "manzur · about.txt",
    component: "HeroWindow",
    initial: { x: 56, y: 60, w: 720, h: 420 },
    initiallyOpen: true,
  },
  {
    id: "about",
    title: "Sobre mí",
    component: "AboutWindow",
    initial: { x: 800, y: 60, w: 380, h: 420 },
    initiallyOpen: true,
  },
  {
    id: "projects",
    title: "Proyectos",
    component: "ProjectsWindow",
    initial: { x: 40, y: 500, w: 860, h: 460 },
    initiallyOpen: true,
  },
  {
    id: "blog",
    title: "El cuaderno",
    component: "BlogWindow",
    initial: { x: 920, y: 500, w: 440, h: 460 },
    initiallyOpen: true,
  },
  {
    id: "experience",
    title: "Trayectoria",
    component: "ExperienceWindow",
    initial: { x: 220, y: 200, w: 580, h: 540 },
    initiallyOpen: false,
  },
  {
    id: "contact",
    title: "Contacto",
    component: "ContactWindow",
    initial: { x: 700, y: 240, w: 440, h: 460 },
    initiallyOpen: false,
  },
];

// Custom theme picker — visual swatches with theme name labels
const THEMES = [
  { id: "sunset",   label: "Sunset",   colors: ["#efe3c8", "#e63b7a", "#1c8fa8", "#f0c845"] },
  { id: "miami",    label: "Miami",    colors: ["#fbd9ea", "#d11a6b", "#009b8c", "#ffd23f"] },
  { id: "cyber",    label: "Cyber",    colors: ["#1a0b2e", "#ff2a8e", "#00d4ff", "#ffd23f"] },
  { id: "news",     label: "News",     colors: ["#f0e6cf", "#c3252f", "#1f4c8a", "#e8b73e"] },
];

function ThemePicker({ value, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {THEMES.map((th) => {
        const on = th.id === value;
        return (
          <button
            key={th.id}
            type="button"
            onClick={() => onChange(th.id)}
            style={{
              appearance: "none",
              border: on ? "1.5px solid rgba(0,0,0,.85)" : "0.5px solid rgba(0,0,0,.15)",
              borderRadius: 6,
              cursor: "default",
              background: th.colors[0],
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px",
              gap: 6,
              height: 30,
              boxShadow: on ? "0 1px 3px rgba(0,0,0,.18)" : "0 1px 2px rgba(0,0,0,.06)",
            }}
            aria-pressed={on}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: th.id === "cyber" ? "#fff" : "#1a1530",
              letterSpacing: 0.2,
            }}>{th.label}</span>
            <span style={{ display: "flex", gap: 2 }}>
              {th.colors.slice(1).map((c, i) => (
                <i key={i} style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: c,
                  boxShadow: "0 0 0 0.5px rgba(0,0,0,.2)",
                }} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [booted, setBooted] = useState(false);

  // window state: which are open, z-order, focused
  const [openIds, setOpenIds] = useState(
    WINDOWS_CONFIG.filter((w) => w.initiallyOpen).map((w) => w.id),
  );
  const [zOrder, setZOrder] = useState(
    WINDOWS_CONFIG.filter((w) => w.initiallyOpen).map((w) => w.id),
  );
  const [focusedId, setFocusedId] = useState("hero");

  // active project console (separate window, opens on project click)
  const [activeProjectSlug, setActiveProjectSlug] = useState(null);
  const activeProject = React.useMemo(
    () => window.PORTFOLIO_DATA.projects.find((p) => p.slug === activeProjectSlug) || null,
    [activeProjectSlug],
  );

  // active blog post (separate window, opens on post click)
  const [activePostSlug, setActivePostSlug] = useState(null);
  const activePost = React.useMemo(
    () => window.PORTFOLIO_DATA.posts.find((p) => p.slug === activePostSlug) || null,
    [activePostSlug],
  );
  const postIdx = React.useMemo(() => {
    const all = window.PORTFOLIO_DATA.posts;
    return all.findIndex((p) => p.slug === activePostSlug);
  }, [activePostSlug]);

  const focusWindow = useCallback((id) => {
    setFocusedId(id);
    setZOrder((prev) => [...prev.filter((x) => x !== id), id]);
  }, []);

  const openWindow = useCallback((id) => {
    setOpenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    focusWindow(id);
  }, [focusWindow]);

  const closeWindow = useCallback((id) => {
    setOpenIds((prev) => prev.filter((x) => x !== id));
    setZOrder((prev) => prev.filter((x) => x !== id));
    setFocusedId((prev) => (prev === id ? null : prev));
  }, []);

  const openProjectConsole = useCallback((slug) => {
    setActiveProjectSlug(slug);
    focusWindow("console");
  }, [focusWindow]);

  const closeConsole = useCallback(() => {
    setActiveProjectSlug(null);
    setZOrder((prev) => prev.filter((x) => x !== "console"));
  }, []);

  const openPost = useCallback((slug) => {
    setActivePostSlug(slug);
    focusWindow("post");
  }, [focusWindow]);

  const closePost = useCallback(() => {
    setActivePostSlug(null);
    setZOrder((prev) => prev.filter((x) => x !== "post"));
  }, []);

  const navPost = useCallback((delta) => {
    const all = window.PORTFOLIO_DATA.posts;
    const i = all.findIndex((p) => p.slug === activePostSlug);
    const next = all[i + delta];
    if (next) setActivePostSlug(next.slug);
  }, [activePostSlug]);

  // initial focus stacking
  useEffect(() => {
    setZOrder(["about", "blog", "projects", "hero"]);
  }, []);

  return (
    <div className={`desktop theme-${t.theme} font-${t.font}`}>
      <Wallpaper />
      <MenuBar />

      {!booted && <BootScreen onDone={() => setBooted(true)} />}

      {WINDOWS_CONFIG.map((w) => {
        if (!openIds.includes(w.id)) return null;
        const z = zOrder.indexOf(w.id) + 10;
        const Comp = window[w.component];
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
            {w.id === "projects"
              ? <Comp onSelect={openProjectConsole} />
              : w.id === "blog"
              ? <Comp onSelect={openPost} />
              : <Comp />}
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
            hasNext={postIdx < window.PORTFOLIO_DATA.posts.length - 1}
          />
        </WindowFrame>
      )}

      <Dock
        windows={WINDOWS_CONFIG}
        openIds={openIds}
        onOpen={openWindow}
        onFocus={focusWindow}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Paleta">
          <ThemePicker value={t.theme} onChange={(v) => setTweak("theme", v)} />
        </TweakSection>
        <TweakSection label="Tipografía">
          <TweakRadio
            label="Pareja"
            value={t.font}
            options={[
              { value: "editorial", label: "Editorial" },
              { value: "magazine", label: "Magazine" },
              { value: "boulevard", label: "Boulevard" },
            ]}
            onChange={(v) => setTweak("font", v)}
          />
          <div style={{ padding: "6px 0", borderTop: "1px solid rgba(0,0,0,.08)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20, lineHeight: 1.1 }}>
              The quick brown fox
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, marginTop: 2 }}>
              jumps over the lazy dog · 1234567890
            </div>
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
