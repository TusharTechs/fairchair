// Registry of the YouCam features FairChair uses: how to call each one, what
// it costs, and how to turn its result into a normalized measurement.
// Pure (no server-only import) so normalizers are unit-testable.

import {
  densityFromResult,
  frizzFromResult,
  hairTypeFromMapping,
  lengthFromTerm,
  type Measurements,
} from "@/lib/hair/measurements";

export type AnalysisFeature = "hair-type" | "hair-density" | "hair-length" | "hair-frizz" | "hair-color";

/**
 * Capture views, per YouCam's documented protocol: type and frizz take exactly
 * [front, right, left] (45° yaw, same size); length and colour take the front
 * view; density takes a front-facing selfie with the head lowered ~45°.
 */
export type View = "front" | "right" | "left" | "down" | "full";
/** `full` is an optional step-back shot (YouCam Camera Kit hairlength mode); length prefers it. */
export const VIEWS: View[] = ["front", "right", "left", "down", "full"];

/** The photos a feature reads for a given set of captured views. */
export function viewsFor(feature: AnalysisFeature, available: Partial<Record<View, unknown>>): View[] {
  if (feature === "hair-length" && available.full) return ["full"];
  return FEATURES[feature].views;
}

type FeatureDef = {
  label: string;
  /** Path segment after /s2s/v2.0/task/ */
  slug: string;
  units: number;
  /** Photos this feature reads, in the order YouCam expects. */
  views: View[];
  /** Build the request body from uploaded file ids, ordered as `views`. */
  body: (fileIds: string[]) => Record<string, unknown>;
  normalize: (results: unknown) => Partial<Measurements> | undefined;
};

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | undefined => (v && typeof v === "object" ? (v as Obj) : undefined);
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined);

export const FEATURES: Record<AnalysisFeature, FeatureDef> = {
  "hair-type": {
    label: "Hair Type",
    slug: "hair-type-detection",
    units: 2,
    views: ["front", "right", "left"],
    body: (ids) => ({ src_file_ids: ids }),
    normalize: (r) => {
      const ht = obj(obj(r)?.hair_type);
      const type = ht && str(ht.mapping) ? hairTypeFromMapping(str(ht.mapping)!) : undefined;
      return type ? { type } : undefined;
    },
  },
  "hair-density": {
    label: "Hair Density",
    slug: "hair-density-detection",
    units: 1,
    views: ["down"],
    body: (ids) => ({ src_file_id: ids[0] }),
    normalize: (r) => {
      const hd = obj(obj(r)?.hair_density);
      const density = hd && str(hd.mapping) && str(hd.term) ? densityFromResult(str(hd.mapping)!, str(hd.term)!) : undefined;
      return density ? { density } : undefined;
    },
  },
  "hair-length": {
    label: "Hair Length",
    slug: "hair-length-detection",
    units: 2,
    views: ["front"],
    body: (ids) => ({ src_file_id: ids[0] }),
    normalize: (r) => {
      const hl = obj(obj(r)?.hair_length);
      const length = hl && str(hl.term) ? lengthFromTerm(str(hl.term)!) : undefined;
      return length ? { length } : undefined;
    },
  },
  "hair-frizz": {
    label: "Hair Frizziness",
    slug: "hair-frizziness-detection",
    units: 2,
    views: ["front", "right", "left"],
    body: (ids) => ({ src_file_ids: ids }),
    normalize: (r) => {
      const hf = obj(obj(r)?.hair_frizziness);
      const frizz = hf && str(hf.term) ? frizzFromResult(str(hf.mapping) ?? -1, str(hf.term)!) : undefined;
      return frizz ? { frizz } : undefined;
    },
  },
  "hair-color": {
    label: "Hair Colour",
    slug: "skin-tone-analysis",
    units: 20,
    views: ["front"],
    body: (ids) => ({ src_file_id: ids[0], face_angle_strictness_level: "medium" }),
    normalize: (r) => {
      const hex = str(obj(obj(r)?.color)?.hair_color);
      return hex && /^#?[0-9a-f]{6}$/i.test(hex) ? { color: { kind: "color", hex: hex.startsWith("#") ? hex : `#${hex}` } } : undefined;
    },
  },
};

export function featuresFor(measures: (keyof Measurements)[]): AnalysisFeature[] {
  const map: Record<keyof Measurements, AnalysisFeature> = {
    type: "hair-type",
    density: "hair-density",
    length: "hair-length",
    frizz: "hair-frizz",
    color: "hair-color",
  };
  return measures.map((m) => map[m]);
}

export function unitsFor(features: AnalysisFeature[]): number {
  return features.reduce((sum, f) => sum + FEATURES[f].units, 0);
}

export function mergeMeasurements(parts: (Partial<Measurements> | undefined)[]): Measurements {
  return Object.assign({}, ...parts.filter(Boolean));
}
