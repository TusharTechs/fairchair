import {
  DENSITY_GRADES,
  FRIZZ_GRADES,
  HAIR_LENGTH_BANDS,
  LENGTH_TIERS,
  type Measurements,
} from "@/lib/hair/measurements";
import { fairnessWarnings } from "./fairness";
import { nearestShade } from "./shades";
import {
  BUCKETS,
  BUCKET_LABELS,
  type Adjustment,
  type AdjustmentBasis,
  type Because,
  type Quote,
  type QuoteLine,
  type QuoteOptions,
  type QuoteWarning,
  type Range,
  type Service,
  type Studio,
  type Supply,
} from "./types";

// The quote is a pure function of (studio rules, service, chosen options,
// measurements). Same inputs → same quote, always. No I/O here.

type Resolved = { buckets: string[]; because: Because };

export function optionKey(service: Service, options: QuoteOptions): string {
  const has = (id: "size" | "length") => service.axes.some((a) => a.id === id);
  return `${has("size") ? (options.size ?? "") : ""}|${has("length") ? (options.length ?? "") : ""}`;
}

function resolveBuckets(basis: AdjustmentBasis, m: Measurements, options: QuoteOptions): Resolved {
  switch (basis) {
    case "density": {
      const d = m.density;
      if (!d) return unmeasured(basis, "Hair density");
      return {
        buckets: [String(d.grade)],
        because: {
          type: "measurement",
          key: basis,
          text: `${DENSITY_GRADES[d.grade].label} hair`,
          youcam: `Hair Density: ${d.term} (${d.value.toFixed(2)} / 3)`,
        },
      };
    }
    case "length": {
      const l = m.length;
      if (!l) return unmeasured(basis, "Natural length");
      const i = LENGTH_TIERS.indexOf(l.tier);
      // Shrinkage: curly/coily hair hangs shorter than it stretches. A longer
      // client-reported stretched length is used, and labelled as reported.
      const s = options.stretched ? LENGTH_TIERS.indexOf(options.stretched) : -1;
      if (s > i) {
        return {
          buckets: [LENGTH_TIERS[s]],
          because: {
            type: "reported",
            key: basis,
            text: `Stretched length (you told us): ${BUCKET_LABELS.length[LENGTH_TIERS[s]].toLowerCase()}`,
            youcam: `Hair Length measured “${l.term}” (shrinkage)`,
          },
        };
      }
      const buckets = l.openEnded && i < LENGTH_TIERS.length - 1 ? [l.tier, LENGTH_TIERS[i + 1]] : [l.tier];
      return {
        buckets,
        because: {
          type: "measurement",
          key: basis,
          text: `Natural length: ${HAIR_LENGTH_BANDS[l.index].label.toLowerCase()}`,
          youcam: `Hair Length: “${l.term}”`,
        },
      };
    }
    case "type": {
      const t = m.type;
      if (!t) return unmeasured(basis, "Curl pattern");
      return {
        buckets: [t.family],
        because: {
          type: "measurement",
          key: basis,
          text: `${t.mapping.replace(" to ", "–").toUpperCase()} curl pattern`,
          youcam: `Hair Type: ${t.mapping.toUpperCase().replace(" TO ", " to ")} · ${t.term}`,
        },
      };
    }
    case "frizz": {
      const f = m.frizz;
      if (!f) return unmeasured(basis, "Frizz");
      return {
        buckets: [String(f.grade)],
        because: {
          type: "measurement",
          key: basis,
          text: FRIZZ_GRADES[f.grade].label,
          youcam: `Hair Frizziness: ${f.term}`,
        },
      };
    }
  }
}

function unmeasured(basis: AdjustmentBasis, name: string): Resolved {
  return {
    buckets: [...BUCKETS[basis]],
    because: { type: "unmeasured", key: basis, text: `${name} not measured — range covers every case` },
  };
}

function span(values: number[]): Range {
  return [Math.min(...values), Math.max(...values)];
}

const add = (a: Range, b: Range): Range => [a[0] + b[0], a[1] + b[1]];
const floorTo = (n: number, step: number) => Math.floor(n / step) * step;
const ceilTo = (n: number, step: number) => Math.ceil(n / step) * step;

function adjustmentLine(studio: Studio, adj: Adjustment, m: Measurements, options: QuoteOptions): QuoteLine {
  const { buckets, because } = resolveBuckets(adj.basis, m, options);
  const minutes = span(buckets.map((b) => adj.minutes[b] ?? 0));
  // Texture is priced as time only: flat prices keyed on hair type are ignored
  // here and surfaced to the stylist as a fairness warning instead.
  const flat = adj.price && adj.basis !== "type" ? span(buckets.map((b) => adj.price?.[b] ?? 0)) : ([0, 0] as Range);
  const fromTime: Range = studio.priceByTime
    ? [(minutes[0] / 60) * studio.hourlyRate, (minutes[1] / 60) * studio.hourlyRate]
    : [0, 0];
  return { id: adj.id, label: adj.label, minutes, price: add(fromTime, flat), because };
}

export function quote(studio: Studio, service: Service, options: QuoteOptions, m: Measurements): Quote {
  const key = optionKey(service, options);
  const basePrice = service.basePrice[key];
  const baseMinutes = service.baseMinutes[key];
  if (basePrice === undefined || baseMinutes === undefined) {
    throw new Error(`No base price for ${service.id} with options “${key}”`);
  }

  const optionText = service.axes
    .map((axis) => axis.choices.find((c) => c.id === options[axis.id])?.label)
    .filter(Boolean)
    .join(", ");

  const lines: QuoteLine[] = [
    {
      id: "base",
      label: service.name,
      minutes: [baseMinutes, baseMinutes],
      price: [basePrice, basePrice],
      because: { type: "option", text: optionText ? `You chose ${optionText}` : "Service price" },
    },
    ...service.adjustments.map((adj) => adjustmentLine(studio, adj, m, options)),
  ];

  const totalPrice = lines.reduce<Range>((acc, l) => add(acc, l.price), [0, 0]);
  const totalMinutes = lines.reduce<Range>((acc, l) => add(acc, l.minutes), [0, 0]);

  const price: Range = [Math.max(0, floorTo(totalPrice[0], 5)), ceilTo(totalPrice[1], 5)];
  const minutes: Range = [Math.max(15, floorTo(totalMinutes[0], 15)), ceilTo(totalMinutes[1], 15)];

  const warnings: QuoteWarning[] = [
    ...lines
      .filter((l) => l.because.type === "unmeasured")
      .map((l) => ({ code: "unmeasured", message: l.because.text })),
    ...fairnessWarnings(studio, service),
  ];

  return {
    serviceId: service.id,
    options,
    lines,
    price,
    minutes,
    slotMinutes: minutes[1],
    deposit: ceilTo(price[0] * studio.depositPct, 5),
    supplies: supplies(service, options, m),
    warnings,
    rulesHash: rulesHash(studio, service),
  };
}

// ---------------------------------------------------------------------------
// Supplies

const TEXTURE_MATCH: Record<string, string> = {
  straight: "Straight / silky",
  wavy: "Body wave",
  curly: "Deep wave or curly",
  coily: "Kinky straight (blends with coily leave-out)",
};

function supplies(service: Service, options: QuoteOptions, m: Measurements): Supply[] {
  const plan = service.supplies;
  if (!plan) return [];
  const out: Supply[] = [];

  if (plan.kind === "braiding-hair") {
    const packs = plan.packs[`${options.size}|${options.length}`];
    if (packs) {
      out.push({
        id: "braiding-hair",
        label: plan.product,
        detail: "Included in your price — your stylist brings it.",
        quantity: packs,
        unit: "packs",
        because: "Set by braid size and length",
      });
    }
    return out;
  }

  const target = Number(options.length);
  const family = m.type?.family;
  const curlyShrink = family === "curly" || family === "coily";

  if (plan.kind === "bundles") {
    let bundles: Range = target <= 14 ? [2, 3] : target <= 20 ? [3, 3] : [3, 4];
    if (m.density?.grade === 3) bundles = [bundles[0], bundles[1] + 1];
    out.push({
      id: "bundles",
      label: `${plan.gramsPerBundle} g bundles`,
      detail: m.density ? "Fuller heads need an extra bundle for a natural blend." : "Bundle count by length.",
      quantity: bundles,
      unit: "bundles",
      because: m.density ? `Length ${target}" + ${DENSITY_GRADES[m.density.grade].label.toLowerCase()} hair` : `Length ${target}"`,
    });
  }

  if (plan.kind === "tape-in-packs") {
    const packs = m.density ? plan.packsByDensity[String(m.density.grade)] : ([2, 7] as Range);
    out.push({
      id: "tape-ins",
      label: "Tape-in packs",
      detail: "Enough to hide tape lines at your fullness.",
      quantity: packs,
      unit: "packs",
      because: m.density ? `Hair Density: ${m.density.term}` : "Density not measured",
    });
  }

  if (Number.isFinite(target)) {
    out.push({
      id: "order-length",
      label: "Length to order",
      detail: curlyShrink
        ? `Order ${target + 2}–${target + 4}" — curly textures wear shorter than their stretched length.`
        : `Order ${target}".`,
      because: family ? `Hair Type: ${m.type?.mapping}` : undefined,
    });
  }

  out.push({
    id: "texture",
    label: "Texture to match",
    detail: family ? TEXTURE_MATCH[family] : "Measure hair type to match texture",
    because: m.type ? `Hair Type: ${m.type.term}` : undefined,
  });

  const shade = m.color ? nearestShade(m.color.hex) : undefined;
  out.push({
    id: "shade",
    label: "Closest shade",
    detail: shade ? `#${shade.code} ${shade.name} — confirm with a swatch in daylight` : "Measure hair colour to suggest a shade",
    because: m.color ? `Measured hair colour ${m.color.hex.toUpperCase()}` : undefined,
  });

  return out;
}

// ---------------------------------------------------------------------------
// Stable hash of the rules a quote was computed with (FNV-1a, 32-bit).

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((value as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function rulesHash(studio: Pick<Studio, "hourlyRate" | "priceByTime" | "depositPct">, service: Service): string {
  const s = stable({ r: studio.hourlyRate, t: studio.priceByTime, d: studio.depositPct, service });
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export { BUCKET_LABELS };
