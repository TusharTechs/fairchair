import Link from "next/link";
import { Wordmark as Logo } from "./brand";
import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export { Wordmark as Logo } from "./brand";

type ButtonProps = { variant?: "primary" | "secondary" | "ghost" | "inverse" | "ghost-inverse"; size?: "md" | "lg" };

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const buttonVariants = {
  primary: "bg-ink text-surface hover:bg-ink-2",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-2",
  /** For use on dark (bg-ink) sections. */
  inverse: "bg-surface text-ink hover:bg-surface-2",
  "ghost-inverse": "text-surface hover:bg-white/10",
};
const buttonSizes = { md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-[0.95rem]" };

export function Button({ variant = "primary", size = "md", className, ...rest }: ComponentProps<"button"> & ButtonProps) {
  return <button className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...rest} />;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...rest }: ComponentProps<typeof Link> & ButtonProps) {
  return <Link className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...rest} />;
}

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl border border-line bg-surface shadow-card", className)} {...rest} />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted", className)}>{children}</p>;
}

/** Marks a value that came from a YouCam measurement. */
export function MeasuredChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full bg-measured-soft px-2.5 py-1 text-xs font-medium text-measured",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
        <path d="M2 8h3l2-5 2 10 2-5h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  );
}

export type ResultSource = "live" | "replay" | "sample";

/** Always-visible provenance for measurements. Never hide this. */
export function SourceBadge({ source, recordedAt }: { source: ResultSource; recordedAt?: string }) {
  if (source === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-measured/30 bg-measured-soft px-2.5 py-1 text-xs font-semibold text-measured">
        <span className="h-1.5 w-1.5 rounded-full bg-measured" /> Live YouCam result
      </span>
    );
  }
  if (source === "replay") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink-2">
        Recorded YouCam result{recordedAt ? ` · ${recordedAt}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
      Sample values — not a YouCam result
    </span>
  );
}

export function SiteHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          {right ?? (
            <>
              <span className="hidden items-center gap-1 md:flex">
                <HeaderLink href="/#how">How it works</HeaderLink>
                <HeaderLink href="/compare">Two heads</HeaderLink>
                <HeaderLink href="/#stores">For stores</HeaderLink>
                <HeaderLink href="/start">For stylists</HeaderLink>
              </span>
              <ButtonLink href="/s/amara-braids-demo" className="ml-1">
                Get a quote
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="relative rounded-full px-3 py-2 text-ink-2 transition-colors hover:text-ink after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100"
    >
      {children}
    </Link>
  );
}
