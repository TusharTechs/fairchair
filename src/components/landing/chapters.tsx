"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BeforeAfter } from "@/components/before-after";
import { cx } from "@/components/ui";

export type Chapter = { n: string; title: string; body: string; api: string; visual: ReactNode };

// Scroll story: chapter text scrolls, the visual beside it follows. On small
// screens each chapter shows its own visual inline.
export function Chapters({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  // The active chapter is the one whose middle is nearest the middle of the
  // screen. Five rect reads per scroll event is cheap, so no frame throttling.
  useEffect(() => {
    const update = () => {
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive((a) => (a === best ? a : best));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <ol className="flex flex-col">
        {chapters.map((c, i) => (
          <li
            key={c.n}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-index={i}
            className="flex min-h-[46vh] flex-col justify-center border-t border-line py-10 first:border-t-0 lg:min-h-[62vh]"
          >
            <p className="numeral text-2xl text-accent-ink">{c.n}</p>
            <h3 className={cx("mt-2 font-display text-3xl leading-tight transition-colors duration-500 sm:text-4xl", active === i ? "text-ink" : "text-ink lg:text-ink/55")}>
              {c.title}
            </h3>
            <p className="mt-3 max-w-md text-ink-2">{c.body}</p>
            <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-measured-soft px-2.5 py-1 text-xs font-medium text-measured">
              <span className="h-1.5 w-1.5 rounded-full bg-measured" />
              {c.api}
            </p>
            <div className="mt-6 lg:hidden">{c.visual}</div>
          </li>
        ))}
      </ol>
      <div className="hidden lg:block">
        <div className="sticky top-24 h-[34rem]">
          {chapters.map((c, i) => (
            <div
              key={c.n}
              // inert: inactive visuals leave both the tab order and the accessibility tree.
              inert={active !== i}
              className={cx(
                "absolute inset-0 transition-all duration-700 [transition-timing-function:var(--ease-out)]",
                active === i ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3",
              )}
            >
              {c.visual}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { BeforeAfter };
