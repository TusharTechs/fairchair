import type { Range } from "@/lib/pricing/types";

const SYMBOL: Record<string, string> = { USD: "$", CAD: "$", GBP: "£", EUR: "€" };

export function money(value: number, currency = "USD"): string {
  const sign = value < 0 ? "−" : "";
  return `${sign}${SYMBOL[currency] ?? ""}${Math.round(Math.abs(value)).toLocaleString("en-US")}`;
}

export function moneyRange([lo, hi]: Range, currency = "USD"): string {
  return Math.round(lo) === Math.round(hi) ? money(lo, currency) : `${money(lo, currency)}–${money(hi, currency).replace(/^[$£€]/, "")}`;
}

export function signedMoneyRange([lo, hi]: Range, currency = "USD"): string {
  if (Math.round(lo) === 0 && Math.round(hi) === 0) return "—";
  const fmt = (v: number) => `${v >= 0 ? "+" : "−"}${SYMBOL[currency] ?? ""}${Math.round(Math.abs(v))}`;
  if (Math.round(lo) === Math.round(hi)) return fmt(lo);
  // Same sign: "+$0–20"; mixed: "−$7 to +$30".
  return lo >= 0 || hi <= 0 ? `${fmt(lo)}–${Math.round(Math.abs(hi))}` : `${fmt(lo)} to ${fmt(hi)}`;
}

export function duration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}

export function durationRange([lo, hi]: Range): string {
  return lo === hi ? duration(lo) : `${duration(lo)} – ${duration(hi)}`;
}

export function signedMinutes([lo, hi]: Range): string {
  if (lo === 0 && hi === 0) return "no change";
  const fmt = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v)} min`;
  if (lo === hi) return fmt(lo);
  const sign = (v: number) => (v >= 0 ? "+" : "−");
  return lo >= 0 || hi <= 0 ? `${sign(lo)}${Math.abs(lo)}–${Math.abs(hi)} min` : `${fmt(lo)} to ${fmt(hi)}`;
}
