import { describe, expect, it } from "vitest";
import { formatInZone, zonedDate, zonedToUtc } from "../time";

describe("studio time", () => {
  it("converts wall-clock times in the studio's zone to UTC", () => {
    expect(zonedToUtc(2026, 10, 2, 9 * 60, "America/New_York").toISOString()).toBe("2026-10-02T13:00:00.000Z");
    expect(zonedToUtc(2026, 12, 2, 9 * 60, "America/New_York").toISOString()).toBe("2026-12-02T14:00:00.000Z");
    expect(zonedToUtc(2026, 10, 2, 9 * 60 + 30, "Europe/London").toISOString()).toBe("2026-10-02T08:30:00.000Z");
  });
  it("round-trips dates and formats in zone", () => {
    const t = new Date("2026-10-02T13:00:00.000Z");
    expect(zonedDate(t, "America/New_York")).toEqual({ year: 2026, month: 10, day: 2 });
    expect(formatInZone(t, "America/New_York", { hour: "numeric", minute: "2-digit" })).toBe("9:00 AM");
  });
});
