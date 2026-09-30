import { describe, expect, it } from "vitest";
import { densityFromResult, frizzFromResult, hairTypeFromMapping, lengthFromTerm, type Measurements } from "@/lib/hair/measurements";
import { accuracySummary, applySuggestion, suggestions } from "../accuracy";
import { quote } from "../engine";
import { createService } from "../templates";
import type { Studio } from "../types";

const knotless = createService("knotless");
const studio: Studio = {
  id: "s", slug: "s", name: "S", city: "", currency: "USD", timezone: "America/New_York",
  hourlyRate: 40, depositPct: 0.25, priceByTime: true, services: [knotless],
};
const full: Measurements = {
  type: hairTypeFromMapping("4a to 4b"),
  density: densityFromResult("2.8", "High Density"),
  length: lengthFromTerm("above chest"),
  frizz: frizzFromResult(1, "Slightly Frizzy"),
};
const opts = { size: "medium", length: "mid-back" };

function done(m: Measurements, over: number) {
  const r = quote(studio, knotless, opts, m);
  return { serviceId: "knotless", measurements: m, result: r, actualMinutes: Math.round((r.minutes[0] + r.minutes[1]) / 2) + over };
}

describe("estimate accuracy", () => {
  it("has nothing to say without logged appointments", () => {
    expect(accuracySummary([])).toBeUndefined();
    expect(suggestions([knotless], [])).toEqual([]);
  });

  it("suggests more time where the stylist consistently runs over", () => {
    const s = suggestions([knotless], [done(full, 40), done(full, 50), done(full, 35)]);
    expect(s.length).toBeGreaterThan(0);
    const density = s.find((x) => x.basis === "density")!;
    expect(density).toMatchObject({ bucket: "3", n: 3, proposedDelta: 40 });
    const updated = applySuggestion(knotless, density);
    expect(updated.adjustments.find((a) => a.id === "density")!.minutes["3"]).toBe(45 + 40);
  });

  it("ignores single data points and small misses", () => {
    expect(suggestions([knotless], [done(full, 60)])).toEqual([]);
    expect(suggestions([knotless], [done(full, 5), done(full, -5)])).toEqual([]);
  });
});
