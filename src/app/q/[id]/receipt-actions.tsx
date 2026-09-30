"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui";

export type SavedQuote = { id: string; studio: string; service: string; price: string; savedAt: string };
const KEY = "fairchair.quotes";

function readSaved(): SavedQuote[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedQuote[];
  } catch {
    return [];
  }
}

/** Share, add to calendar, and remember this quote on this device. */
export function ReceiptActions(props: {
  id: string;
  studio: string;
  service: string;
  priceLabel: string;
  start?: string;
  slotMinutes: number;
  /** Render for a dark background. */
  dark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const url = useSyncExternalStore(
    () => () => {},
    () => window.location.href,
    () => "",
  );

  // Remember this quote locally so clients can compare quotes across studios.
  useEffect(() => {
    try {
      const list = readSaved().filter((q) => q.id !== props.id);
      list.unshift({ id: props.id, studio: props.studio, service: props.service, price: props.priceLabel, savedAt: new Date().toISOString() });
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12)));
    } catch {
      // Private mode or storage blocked: the receipt link still works.
    }
  }, [props.id, props.studio, props.service, props.priceLabel]);

  async function share() {
    const data = { title: `${props.service} at ${props.studio}`, text: `My measured quote: ${props.priceLabel}`, url };
    try {
      if (navigator.share) return await navigator.share(data);
    } catch {
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function calendar() {
    if (!props.start) return;
    const start = new Date(props.start);
    const end = new Date(start.getTime() + props.slotMinutes * 60_000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//FairChair//Quote//EN",
      "BEGIN:VEVENT",
      `UID:${props.id}@fairchair`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${props.service} · ${props.studio}`,
      `DESCRIPTION:Measured quote ${props.priceLabel}. Receipt: ${url}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "fairchair-appointment.ics";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant={props.dark ? "inverse" : "primary"} onClick={share}>
        {copied ? "Link copied" : "Share quote"}
      </Button>
      {props.start ? (
        <Button variant={props.dark ? "ghost-inverse" : "secondary"} className={props.dark ? "ring-1 ring-white/25" : undefined} onClick={calendar}>
          Add to calendar
        </Button>
      ) : null}
    </div>
  );
}

/** Other quotes this device has saved, for comparing studios. */
export function SavedQuotes({ currentId }: { currentId: string }) {
  const [list, setList] = useState<SavedQuote[]>([]);
  useEffect(() => {
    const t = window.setTimeout(() => setList(readSaved().filter((q) => q.id !== currentId)), 0);
    return () => window.clearTimeout(t);
  }, [currentId]);
  if (!list.length) return null;
  return (
    <section className="rounded-[1.5rem] border border-line bg-surface p-5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">Your other quotes · saved on this device</p>
      <ul className="mt-3 divide-y divide-line">
        {list.slice(0, 5).map((q) => (
          <li key={q.id}>
            <a href={`/q/${q.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent-ink">
              <span className="min-w-0">
                <span className="block font-display text-lg leading-tight">{q.studio}</span>
                <span className="block text-sm text-muted">{q.service}</span>
              </span>
              <span className="shrink-0 font-display text-xl tabular">{q.price}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

