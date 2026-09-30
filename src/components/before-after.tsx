"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./ui";

type Side = { src: string; alt: string; label: string };

/**
 * Draggable before/after comparison. Pointer drag anywhere, keyboard as a
 * slider (arrows, Home/End), soft snapping to 0/50/100, and a one-time sweep
 * the first time it scrolls into view (skipped for reduced motion).
 */
export function BeforeAfter({
  before,
  after,
  className,
  initial = 50,
  invite = true,
  children,
}: {
  before: Side;
  after: Side;
  className?: string;
  initial?: number;
  invite?: boolean;
  /** Overlays (e.g. measurement callouts) positioned over the frame. */
  children?: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  // Contextual cursor label, only for fine pointers (mouse/trackpad).
  const cursor = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const fine = useRef(false);
  useEffect(() => {
    fine.current = window.matchMedia("(pointer: fine)").matches;
  }, []);
  const moveCursor = (e: { clientX: number; clientY: number }) => {
    if (!fine.current || !cursor.current || !frame.current) return;
    const r = frame.current.getBoundingClientRect();
    cursor.current.style.transform = `translate3d(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 16}px, 0)`;
  };

  const fromEvent = useCallback((clientX: number) => {
    const r = frame.current!.getBoundingClientRect();
    return Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
  }, []);

  const snap = (v: number) => {
    for (const s of [0, 50, 100]) if (Math.abs(v - s) < 5) return s;
    return v;
  };

  // A gentle invitation to drag, once, when first visible.
  useEffect(() => {
    if (!invite || !frame.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const frames = [
          { t: 0, v: initial },
          { t: 700, v: 78 },
          { t: 1500, v: 26 },
          { t: 2200, v: initial },
        ];
        const tick = (now: number) => {
          const t = now - start;
          const i = frames.findIndex((f) => f.t > t);
          if (i === -1) return setPos(initial);
          const a = frames[i - 1];
          const b = frames[i];
          const k = (t - a.t) / (b.t - a.t);
          const ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
          setPos(a.v + (b.v - a.v) * ease);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(frame.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [invite, initial]);

  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 4;
    const next = e.key === "ArrowLeft" ? pos - step : e.key === "ArrowRight" ? pos + step : e.key === "Home" ? 0 : e.key === "End" ? 100 : undefined;
    if (next === undefined) return;
    e.preventDefault();
    setTouched(true);
    setPos(Math.min(100, Math.max(0, next)));
  };

  return (
    <div
      ref={frame}
      className={cx("relative select-none overflow-hidden bg-surface-2 [touch-action:pan-y]", dragging ? "cursor-grabbing" : "cursor-ew-resize", className)}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setDragging(true);
        setTouched(true);
        setPos(fromEvent(e.clientX));
      }}
      onPointerMove={(e) => {
        moveCursor(e);
        if (dragging) setPos(fromEvent(e.clientX));
      }}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        moveCursor(e);
        setHover(true);
      }}
      onPointerLeave={() => setHover(false)}
      onPointerUp={() => {
        setDragging(false);
        setPos((p) => snap(p));
      }}
      onPointerCancel={() => setDragging(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after.src} alt={after.alt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before.src}
        alt={before.alt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />

      <span
        className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-surface backdrop-blur-sm transition-opacity"
        style={{ opacity: pos > 12 ? 1 : 0 }}
      >
        {before.label}
      </span>
      <span
        className="pointer-events-none absolute right-3 top-3 rounded-full bg-surface/85 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-ink backdrop-blur-sm transition-opacity"
        style={{ opacity: pos < 88 ? 1 : 0 }}
      >
        {after.label}
      </span>

      {children}

      <div
        ref={cursor}
        aria-hidden
        className={cx(
          "pointer-events-none absolute left-0 top-0 z-20 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-surface shadow-card transition-opacity duration-200",
          hover && !dragging ? "opacity-100" : "opacity-0",
        )}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <path d="M9 6l-5 6 5 6M15 6l5 6-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Drag to compare
      </div>

      <div className="pointer-events-none absolute inset-y-0 w-px bg-surface/90 shadow-[0_0_0_0.5px_rgb(0_0_0/0.15)]" style={{ left: `${pos}%` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Compare ${before.label} and ${after.label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)}% ${before.label}`}
        onKeyDown={onKey}
        className={cx(
          "absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface text-ink shadow-card ring-1 ring-black/5 transition-transform",
          dragging ? "scale-95" : "hover:scale-105",
          !touched && invite && "motion-safe:animate-[nudge_2.6s_ease-in-out_3s_infinite]",
        )}
        style={{ left: `${pos}%` }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path d="M9 6l-5 6 5 6M15 6l5 6-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
