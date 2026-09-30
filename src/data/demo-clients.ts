// Demo clients for the judge path. Portraits are AI-generated (YouCam
// text-to-image) — no real person is shown. `recorded` holds the raw results
// the live YouCam hair detectors returned for those portraits on 2026-09-30
// (see docs/measurements.md and spike/results.json). `errors` holds detectors
// that returned an error, replayed as "not measured".

import type { AnalysisFeature } from "@/lib/youcam/features";

export type DemoClient = {
  id: string;
  name: string;
  blurb: string;
  photo: string;
  source: "sample" | "replay";
  recordedAt?: string;
  recorded: Partial<Record<AnalysisFeature, unknown>>;
  errors?: Partial<Record<AnalysisFeature, string>>;
  /** Recorded YouCam hair-transfer results, by service id. */
  previews?: Record<string, string>;
  /** Recorded YouCam hair-extension try-on (template all_length_2_). */
  extPreview?: string;
};

const RECORDED = "30 Sep 2026";

export const DEMO_CLIENTS: DemoClient[] = [
  {
    id: "maya",
    name: "Maya",
    blurb: "Full, collarbone-length 3B curls",
    photo: "/demo/generated/curly-collarbone.jpg",
    extPreview: "/demo/extensions/curly-collarbone-all_length_2.jpg",
    previews: {
      knotless: "/demo/previews/curly-collarbone-knotless.jpg",
      "silk-press": "/demo/previews/curly-collarbone-silk-press.jpg",
      "sew-in": "/demo/previews/curly-collarbone-sew-in.jpg",
      "tape-ins": "/demo/previews/curly-collarbone-tape-ins.jpg",
    },
    source: "replay",
    recordedAt: RECORDED,
    recorded: {
      "hair-type": { hair_type: { mapping: "3B to 3C", term: "Medium to Tight Curls" } },
      "hair-density": { timed: 4831, hair_density: { mapping: "2.57", term: "High Density" } },
      "hair-length": { hair_length: { term: "above chest" }, timed: 8016 },
      "hair-frizz": { hair_frizziness: { mapping: 1, term: "Slightly Frizzy" } },
    },
  },
  {
    id: "nia",
    name: "Nia",
    blurb: "4C afro — shrinkage hides its length",
    photo: "/demo/generated/coily-long-full.jpg",
    extPreview: "/demo/extensions/coily-long-full-all_length_2.jpg",
    previews: {
      knotless: "/demo/previews/coily-long-full-knotless.jpg",
      "silk-press": "/demo/previews/coily-long-full-silk-press.jpg",
      "sew-in": "/demo/previews/coily-long-full-sew-in.jpg",
      "tape-ins": "/demo/previews/coily-long-full-tape-ins.jpg",
    },
    source: "replay",
    recordedAt: RECORDED,
    recorded: {
      "hair-type": { hair_type: { mapping: "4B to 4C", term: "Coily to Extremely Coily" } },
      "hair-density": { timed: 5020, hair_density: { mapping: "2.11", term: "Medium Density" } },
      "hair-length": { hair_length: { term: "short hair" }, timed: 7151 },
      "hair-frizz": { hair_frizziness: { mapping: 1, term: "Slightly Frizzy" } },
    },
  },
  {
    id: "tess",
    name: "Tess",
    blurb: "Short tapered 4C cut",
    photo: "/demo/generated/coily-short.jpg",
    extPreview: "/demo/extensions/coily-short-all_length_2.jpg",
    previews: {
      knotless: "/demo/previews/coily-short-knotless.jpg",
      "silk-press": "/demo/previews/coily-short-silk-press.jpg",
      "sew-in": "/demo/previews/coily-short-sew-in.jpg",
      "tape-ins": "/demo/previews/coily-short-tape-ins.jpg",
    },
    source: "replay",
    recordedAt: RECORDED,
    recorded: {
      "hair-type": { hair_type: { mapping: "4B to 4C", term: "Coily to Extremely Coily" } },
      "hair-density": { timed: 5601, hair_density: { mapping: "0.74", term: "Low Density" } },
      "hair-length": { hair_length: { term: "above the ears" }, timed: 8134 },
      "hair-frizz": { hair_frizziness: { mapping: 2, term: "Frizzy" } },
    },
  },
  {
    id: "ada",
    name: "Ada",
    blurb: "Stretched 4A–4B, chest length",
    photo: "/demo/generated/kinky-chest-stretched.jpg",
    extPreview: "/demo/extensions/kinky-chest-stretched-all_length_2.jpg",
    previews: {
      knotless: "/demo/previews/kinky-chest-stretched-knotless.jpg",
      "silk-press": "/demo/previews/kinky-chest-stretched-silk-press.jpg",
      "sew-in": "/demo/previews/kinky-chest-stretched-sew-in.jpg",
      "tape-ins": "/demo/previews/kinky-chest-stretched-tape-ins.jpg",
    },
    source: "replay",
    recordedAt: RECORDED,
    recorded: {
      "hair-type": { hair_type: { mapping: "4B to 4C", term: "Coily to Extremely Coily" } },
      "hair-length": { hair_length: { term: "long hair" }, timed: 8614 },
      "hair-frizz": { hair_frizziness: { mapping: 0, term: "Not Frizzy" } },
    },
    errors: { "hair-density": "error_face_angle_invalid" },
  },
];

export function demoClient(id: string | null | undefined) {
  return DEMO_CLIENTS.find((c) => c.id === id);
}
