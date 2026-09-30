// Studio-local time helpers. Appointments live in the studio's timezone, not
// the server's (UTC on Vercel) or the visitor's browser.

function offsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - instant;
}

/** UTC instant for a wall-clock time (minutes after midnight) on a date in `timeZone`. */
export function zonedToUtc(year: number, month: number, day: number, minutes: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60);
  let ts = guess - offsetMs(guess, timeZone);
  ts = guess - offsetMs(ts, timeZone); // settle across DST boundaries
  return new Date(ts);
}

/** Calendar date (y/m/d) of `instant` in `timeZone`. */
export function zonedDate(instant: Date, timeZone: string) {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(instant)
    .split("-")
    .map(Number);
  return { year: y, month: m, day: d };
}

export function formatInZone(instant: Date, timeZone: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...opts }).format(instant);
}
