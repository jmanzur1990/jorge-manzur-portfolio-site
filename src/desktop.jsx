// desktop.jsx — WindowFrame, useDraggable, MenuBar, Wallpaper, Dock
import { useState, useEffect, useRef } from "react";

function clampPosition(pos, size = {}) {
  if (typeof window === "undefined") return pos;
  const minY = 32;
  const minX = -Math.max(40, Math.min(200, (size.w || 0) - 80));
  const maxX = Math.max(minX, window.innerWidth - 80);
  const maxY = Math.max(minY, window.innerHeight - 40);
  return {
    x: Math.max(minX, Math.min(maxX, pos.x)),
    y: Math.max(minY, Math.min(maxY, pos.y)),
  };
}

// ── useDraggable ──────────────────────────────────────────────────────
export function useDraggable(initial, onFocus, size) {
  const [pos, setPos] = useState(() => clampPosition(initial, size));
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    setPos((prev) => clampPosition(prev, size));
  }, [size?.w, size?.h]);

  useEffect(() => {
    const onResize = () => setPos((prev) => clampPosition(prev, size));
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [size?.w, size?.h]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    // ignore clicks on close button
    if (e.target.closest("[data-no-drag]")) return;
    e.preventDefault();
    onFocus && onFocus();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    offsetRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const x = e.clientX - offsetRef.current.dx;
      const y = e.clientY - offsetRef.current.dy;
      setPos(clampPosition({ x, y }, size));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, size?.w, size?.h]);

  return { pos, dragging, onMouseDown };
}

// ── WindowFrame ──────────────────────────────────────────────────────
export function WindowChrome({ title, focused, onClose, onTitleMouseDown, className, children }) {
  return (
    <>
      <div
        className={`titlebar ${focused ? "is-focused" : "is-blurred"}`}
        onMouseDown={onTitleMouseDown}
        onDoubleClick={onClose}
      >
        <button
          className="ctrl close"
          data-no-drag
          aria-label={`Close ${title}`}
          onClick={(e) => { e.stopPropagation(); onClose && onClose(); }}
        />
        <span className="title">{title}</span>
      </div>
      <div className={`win-body ${className || ""}`}>{children}</div>
    </>
  );
}

export function WindowFrame({
  id,
  title,
  x, y, w, h,
  z,
  focused,
  onFocus,
  onClose,
  className,
  children,
}) {
  const { pos, dragging, onMouseDown } = useDraggable({ x, y }, onFocus, { w, h });

  return (
    <div
      className={`win ${focused ? "focused" : ""} ${dragging ? "dragging" : ""} ${className || ""}`}
      data-screen-label={`Window: ${title}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: w,
        height: h,
        zIndex: z,
      }}
      onMouseDown={onFocus}
    >
      <WindowChrome title={title} focused={focused} onClose={onClose} onTitleMouseDown={onMouseDown}>
        {children}
      </WindowChrome>
    </div>
  );
}

// ── MenuBar ──────────────────────────────────────────────────────────
export function MenuBar({ onOpenPrefs }) {
  const [time, setTime] = useState(() => fmtTime(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTime(fmtTime(new Date())), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="menubar">
      <div className="logo" aria-hidden="true" />
      <div className="menu-item smallcaps"><b>Jorge</b></div>
      <div className="menu-item">File</div>
      <div className="menu-item">Edit</div>
      <div className="menu-item">View</div>
      <button className="menu-item menu-button" type="button" onClick={onOpenPrefs}>Preferencias</button>
      <div className="menu-item">Help</div>
      <div className="spacer" />
      <span className="pill"><i className="dot" />Disponible</span>
      <span className="clock">{time}</span>
    </div>
  );
}

function fmtTime(d) {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${days[d.getDay()]} ${hh}:${mm}`;
}

// ── Dock ────────────────────────────────────────────────────────────
export function Dock({ windows, openIds, onOpen, onFocus }) {
  return (
    <div className="dock">
      {windows.map((w) => {
        const isOpen = openIds.includes(w.id);
        return (
          <button
            key={w.id}
            className={isOpen ? "open" : ""}
            onClick={() => (isOpen ? onFocus(w.id) : onOpen(w.id))}
          >
            <i className="swatch" />
            {w.title}
          </button>
        );
      })}
    </div>
  );
}

// ── Wallpaper ────────────────────────────────────────────────────────
export function Wallpaper() {
  return <div className="wallpaper" aria-hidden="true" />;
}

// ── BootScreen ───────────────────────────────────────────────────────
export function BootScreen({ onDone }) {
  const [fading, setFading] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    "Cargando System 7.0...",
    "Verificando memoria... 32MB OK",
    "Iniciando MANZUR.OS",
    "¡Bienvenido!",
  ];
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 280);
    const t2 = setTimeout(() => setStep(2), 560);
    const t3 = setTimeout(() => setStep(3), 820);
    const t4 = setTimeout(() => setFading(true), 1100);
    const t5 = setTimeout(() => onDone(), 1500);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onDone]);
  return (
    <div className={`boot ${fading ? "fading" : ""}`}>
      <div className="logo-big" />
      <div className="serif-it" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontStyle: "italic" }}>
        Manzur.OS
      </div>
      <div>{steps[step]}</div>
    </div>
  );
}
