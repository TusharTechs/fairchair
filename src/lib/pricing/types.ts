import type { LengthTier, MeasurementKey } from "@/lib/hair/measurements";

export type { LengthTier };

export type Range = readonly [low: number, high: number];

// Which measured variable an adjustment depends on, and how its value is
// bucketed. Buckets are what a stylist sees in settings.
export type AdjustmentBasis = "density" | "length" | "type" | "frizz";

export const BUCKETS: Record<AdjustmentBasis, readonly string[]> = {
  density: ["0", "1", "2", "3"],
  length: ["short", "shoulder", "chest", "long"] satisfies readonly LengthTier[],
  type: ["straight", "wavy", "curly", "coily"],
  frizz: ["0", "1", "2", "3"],
};

export const BUCKET_LABELS: Record<AdjustmentBasis, Record<string, string>> = {
  density: { "0": "Very fine", "1": "Fine", "2": "Medium", "3": "Full / thick" },
  length: { short: "Short", shoulder: "Shoulder", chest: "Collarbone–chest", long: "Past chest" },
  type: { straight: "Straight (1–2a)", wavy: "Wavy (2a–3a)", curly: "Curly (3a–4a)", coily: "Coily (4a–4c)" },
  frizz: { "0": "Smooth", "1": "Slight frizz", "2": "Frizzy", "3": "Very frizzy" },
};

export type Adjustment = {
  id: string;
  basis: AdjustmentBasis;
  /** What the extra work is, in the stylist's words. Shown to the client. */
  label: string;
  /** Extra (or fewer) minutes of chair time per bucket. */
  minutes: Partial<Record<string, number>>;
  /**
   * Flat price per bucket, for work priced by tier rather than by time.
   * Allowed for length and density. A flat price keyed on hair type is a
   * texture surcharge; the fairness check flags it (see fairness.ts).
   */
  price?: Partial<Record<string, number>>;
};

export type ServiceOptionAxis = {
  id: "size" | "length";
  label: string;
  choices: { id: string; label: string }[];
};

export type SupplyPlan =
  | {
      kind: "braiding-hair";
      /** Packs by `${size}|${length}` option key. */
      packs: Record<string, Range>;
      product: string;
    }
  | {
      kind: "bundles";
      /** Target length in inches is the `length` option id. */
      gramsPerBundle: number;
      closure: boolean;
    }
  | {
      kind: "tape-in-packs";
      /** Packs by density bucket. */
      packsByDensity: Record<string, Range>;
    };

export type ServiceTemplateId = "knotless" | "silk-press" | "sew-in" | "tape-ins" | "wig-install";

export type Service = {
  id: string;
  template: ServiceTemplateId;
  name: string;
  blurb: string;
  axes: ServiceOptionAxis[];
  /** Base labour price by option key (`size|length`, `|length`, or `|`). */
  basePrice: Record<string, number>;
  baseMinutes: Record<string, number>;
  adjustments: Adjustment[];
  supplies?: SupplyPlan;
  /** Which YouCam measurements this service needs. */
  measures: MeasurementKey[];
  /** Whether to show a try-on preview step. */
  preview?: "hair-ext" | "hair-transfer" | "none";
  /** The stylist's own work, used as the try-on reference (YouCam hair-transfer). */
  portfolio?: { image: string; caption: string };
};

export type Studio = {
  id: string;
  slug: string;
  name: string;
  city: string;
  currency: "USD" | "GBP" | "EUR" | "CAD";
  /** IANA timezone the studio books in. */
  timezone: string;
  hourlyRate: number;
  depositPct: number;
  /** When true, measured time adjustments are converted to price at hourlyRate. */
  priceByTime: boolean;
  services: Service[];
};

export type QuoteOptions = Partial<Record<"size" | "length", string>> & {
  /** Client-reported stretched length for curly/coily hair (shrinkage). */
  stretched?: LengthTier;
};

export type Because =
  | { type: "option"; text: string }
  | { type: "measurement"; key: AdjustmentBasis; text: string; youcam: string }
  | { type: "unmeasured"; key: AdjustmentBasis; text: string }
  | { type: "reported"; key: AdjustmentBasis; text: string; youcam: string };

export type QuoteLine = {
  id: string;
  label: string;
  minutes: Range;
  price: Range;
  because: Because;
};

export type Supply = {
  id: string;
  label: string;
  detail: string;
  quantity?: Range;
  unit?: string;
  because?: string;
};

export type QuoteWarning = { code: string; message: string };

export type Quote = {
  serviceId: string;
  options: QuoteOptions;
  lines: QuoteLine[];
  price: Range;
  minutes: Range;
  /** Slot to reserve: the high estimate rounded up to 15 minutes. */
  slotMinutes: number;
  deposit: number;
  supplies: Supply[];
  warnings: QuoteWarning[];
  rulesHash: string;
};
