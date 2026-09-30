import { describe, expect, it } from "vitest";
import {
  densityFromResult,
  frizzFromResult,
  hairTypeFromMapping,
  lengthFromTerm,
  type Measurements,
} from "@/lib/hair/measurements";
import { quote } from "../engine";
import { applyFairnessFix, findTextureSurcharges } from "../fairness";
import { familyFromHex, shadeSuggestion } from "../shades";
import { createService } from "../templates";
import type { Studio } from "../types";

const studio: Studio = {
  id: "s1",
  slug: "demo",
  name: "Demo Studio",
  city: "Atlanta, GA",
  currency: "USD",
  timezone: "America/New_York",
  hourlyRate: 40,
  depositPct: 0.25,
  priceByTime: true,
  services: [createService("knotless"), createService("silk-press"), createService("tape-ins")],
};
const knotless = studio.services[0];

const headA: Measurements = {
  type: hairTypeFromMapping("3b to 3c"),
  density: densityFromResult("1.94", "Medium Density"),
  length: lengthFromTerm("above chest"),
  frizz: frizzFromResult(1, "Slightly Frizzy"),
};
const headB: Measurements = {
  type: hairTypeFromMapping("4b to 4c"),
  density: densityFromResult("2.71", "High Density"),
  length: lengthFromTerm("long hair"),
  frizz: frizzFromResult(2, "Frizzy"),
};
const medMidBack = { size: "medium", length: "mid-back" };

describe("normalizers", () => {
  it("parse every documented YouCam value", () => {
    expect(hairTypeFromMapping("4b to 4c")?.family).toBe("coily");
    expect(lengthFromTerm("above chest or longer")).toMatchObject({ tier: "chest", openEnded: true });
    expect(densityFromResult("2.16", "High Density")).toMatchObject({ grade: 3, value: 2.16 });
    expect(frizzFromResult(3, "Extreme Frizzy")?.grade).toBe(3);
    expect(hairTypeFromMapping("5 to 6")).toBeUndefined();
  });
});

describe("quote", () => {
  it("is deterministic", () => {
    expect(quote(studio, knotless, medMidBack, headA)).toEqual(quote(studio, knotless, medMidBack, headA));
  });

  it("gives the same style two different honest quotes for two different heads", () => {
    const a = quote(studio, knotless, medMidBack, headA);
    const b = quote(studio, knotless, medMidBack, headB);
    expect(a.lines[0]).toEqual(b.lines[0]); // same base: same style chosen
    expect(b.price[0]).toBeGreaterThan(a.price[1]);
    expect(b.slotMinutes).toBeGreaterThan(a.slotMinutes);
    // Every line that differs is explained by a YouCam measurement.
    const differing = b.lines.filter((l, i) => l.minutes[0] !== a.lines[i].minutes[0]);
    expect(differing.length).toBeGreaterThan(0);
    for (const l of differing) expect(l.because.type).toBe("measurement");
  });

  it("produces exact numbers for head A", () => {
    const a = quote(studio, knotless, medMidBack, headA);
    // base 300 min / $220; density medium 0; chest +15; curly +15; slight frizz +5 → 335 min
    expect(a.minutes).toEqual([330, 345]);
    expect(a.price).toEqual([240, 245]); // 220 + 35 min × $40/h = 243.33
    expect(a.slotMinutes).toBe(345);
    expect(a.deposit).toBe(60);
  });

  it("widens the range for open-ended length bands", () => {
    const open = quote(studio, knotless, medMidBack, { ...headA, length: lengthFromTerm("above chest or longer") });
    const line = open.lines.find((l) => l.id === "natural-length")!;
    expect(line.minutes).toEqual([15, 35]);
  });

  it("covers every case and warns when a measurement is missing", () => {
    const q = quote(studio, knotless, medMidBack, { ...headA, density: undefined });
    const line = q.lines.find((l) => l.id === "density")!;
    expect(line.minutes).toEqual([-20, 45]);
    expect(line.because.type).toBe("unmeasured");
    expect(q.warnings.some((w) => w.code === "unmeasured")).toBe(true);
  });

  it("uses a longer client-reported stretched length for shrinkage, labelled as reported", () => {
    const shrunk = { ...headB, length: lengthFromTerm("short hair") };
    const measured = quote(studio, knotless, medMidBack, shrunk).lines.find((l) => l.id === "natural-length")!;
    const reported = quote(studio, knotless, { ...medMidBack, stretched: "long" }, shrunk).lines.find((l) => l.id === "natural-length")!;
    expect(measured.minutes).toEqual([0, 0]);
    expect(reported.minutes).toEqual([35, 35]);
    expect(reported.because.type).toBe("reported");
    // A shorter reported length never overrides the measurement.
    const shorter = quote(studio, knotless, { ...medMidBack, stretched: "short" }, headB).lines.find((l) => l.id === "natural-length")!;
    expect(shorter.because.type).toBe("measurement");
  });

  it("throws on options the menu does not offer", () => {
    expect(() => quote(studio, knotless, { size: "micro", length: "mid-back" }, headA)).toThrow();
  });
});

describe("fairness", () => {
  const surcharged = {
    ...knotless,
    adjustments: knotless.adjustments.map((a) =>
      a.basis === "type" ? { ...a, price: { coily: 25 } } : a,
    ),
  };

  it("never adds a flat texture surcharge to a quote", () => {
    const withSurcharge = quote(studio, surcharged, medMidBack, headB);
    const without = quote(studio, knotless, medMidBack, headB);
    expect(withSurcharge.price).toEqual(without.price);
    expect(withSurcharge.warnings.some((w) => w.code === "texture-surcharge")).toBe(true);
  });

  it("converts a texture surcharge into prep time at the hourly rate", () => {
    const [issue] = findTextureSurcharges(studio, surcharged);
    const fixed = applyFairnessFix(surcharged, issue);
    const prep = fixed.adjustments.find((a) => a.basis === "type")!;
    expect(prep.price).toBeUndefined();
    expect(prep.minutes.coily).toBe(30 + 40); // $25 at $40/h ≈ 37.5 → 40 min (nearest 5)
    expect(findTextureSurcharges(studio, fixed)).toHaveLength(0);
  });
});

describe("supplies", () => {
  it("sizes tape-in packs from measured density and suggests texture + shade", () => {
    const tape = studio.services[2];
    const q = quote(studio, tape, { length: "20" }, { ...headB, color: { kind: "color", hex: "#000000" } });
    expect(q.supplies.find((s) => s.id === "tape-ins")?.quantity).toEqual([6, 7]);
    expect(q.supplies.find((s) => s.id === "order-length")?.detail).toContain("22–24");
    expect(q.supplies.find((s) => s.id === "shade")?.detail).toContain("#1B");
  });

  it("treats YouCam's hair colour as a family with shades to swatch, never an exact shade", () => {
    expect(familyFromHex("#FAF0BE")).toBe("blonde");
    expect(shadeSuggestion("#42280E")?.shades).toEqual(["2", "4", "6"]);
    expect(shadeSuggestion("#123456")).toBeUndefined();
  });
});
