import type { Service, ServiceTemplateId } from "./types";

// Starting menus a stylist edits during setup. Numbers are editable defaults,
// not industry facts: the product always labels them as "your prices".

const KNOTLESS_SIZES = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
  { id: "jumbo", label: "Jumbo" },
];
const BRAID_LENGTHS = [
  { id: "shoulder", label: "Shoulder" },
  { id: "mid-back", label: "Mid-back" },
  { id: "waist", label: "Waist" },
];

function grid(sizes: string[], lengths: string[], values: number[][]): Record<string, number> {
  const out: Record<string, number> = {};
  sizes.forEach((s, i) => lengths.forEach((l, j) => (out[`${s}|${l}`] = values[i][j])));
  return out;
}

export const TEMPLATES: Record<ServiceTemplateId, () => Omit<Service, "id">> = {
  knotless: () => ({
    template: "knotless",
    name: "Knotless braids",
    blurb: "Feed-in knotless braids with pre-stretched hair included.",
    axes: [
      { id: "size", label: "Braid size", choices: KNOTLESS_SIZES },
      { id: "length", label: "Braid length", choices: BRAID_LENGTHS },
    ],
    basePrice: grid(
      ["small", "medium", "large", "jumbo"],
      ["shoulder", "mid-back", "waist"],
      [
        [300, 340, 400],
        [200, 220, 260],
        [160, 180, 210],
        [130, 150, 170],
      ],
    ),
    baseMinutes: grid(
      ["small", "medium", "large", "jumbo"],
      ["shoulder", "mid-back", "waist"],
      [
        [420, 480, 560],
        [270, 300, 360],
        [200, 225, 260],
        [150, 165, 190],
      ],
    ),
    adjustments: [
      {
        id: "density",
        basis: "density",
        label: "Parting and feeding, by hair fullness",
        minutes: { "0": -20, "1": -10, "2": 0, "3": 45 },
      },
      {
        id: "natural-length",
        basis: "length",
        label: "Working with your natural length",
        minutes: { short: 15, shoulder: 0, chest: 15, long: 35 },
      },
      {
        id: "prep",
        basis: "type",
        label: "Stretch and detangle prep",
        minutes: { straight: 0, wavy: 0, curly: 15, coily: 30 },
      },
      {
        id: "frizz",
        basis: "frizz",
        label: "Smoothing so parts stay crisp",
        minutes: { "0": 0, "1": 5, "2": 10, "3": 20 },
      },
    ],
    supplies: {
      kind: "braiding-hair",
      product: "Pre-stretched braiding hair",
      packs: {
        "small|shoulder": [7, 8], "small|mid-back": [9, 10], "small|waist": [11, 12],
        "medium|shoulder": [5, 6], "medium|mid-back": [6, 7], "medium|waist": [8, 9],
        "large|shoulder": [4, 5], "large|mid-back": [5, 6], "large|waist": [6, 7],
        "jumbo|shoulder": [3, 4], "jumbo|mid-back": [4, 5], "jumbo|waist": [5, 6],
      },
    },
    measures: ["type", "density", "length", "frizz"],
    preview: "hair-transfer",
  }),

  "silk-press": () => ({
    template: "silk-press",
    name: "Silk press",
    blurb: "Wash, deep condition, blow-out and flat-iron finish.",
    axes: [],
    basePrice: { "|": 75 },
    baseMinutes: { "|": 90 },
    adjustments: [
      {
        id: "length",
        basis: "length",
        label: "Length of hair to press",
        minutes: { short: -10, shoulder: 0, chest: 15, long: 30 },
        price: { short: 0, shoulder: 10, chest: 20, long: 35 },
      },
      {
        id: "density",
        basis: "density",
        label: "Sections to blow out, by fullness",
        minutes: { "0": -10, "1": -5, "2": 0, "3": 30 },
      },
      {
        id: "blowout",
        basis: "type",
        label: "Blow-out time to fully stretch",
        minutes: { straight: 0, wavy: 10, curly: 20, coily: 30 },
      },
      {
        id: "frizz",
        basis: "frizz",
        label: "Extra smoothing passes",
        minutes: { "0": 0, "1": 5, "2": 10, "3": 20 },
      },
    ],
    measures: ["type", "density", "length", "frizz"],
    preview: "none",
  }),

  "sew-in": () => ({
    template: "sew-in",
    name: "Sew-in with leave-out",
    blurb: "Braid-down, wefts sewn in, leave-out blended and styled. Bundles not included.",
    axes: [
      {
        id: "length",
        label: "Bundle length",
        choices: [
          { id: "14", label: '14"' },
          { id: "18", label: '18"' },
          { id: "22", label: '22"' },
          { id: "26", label: '26"' },
        ],
      },
    ],
    basePrice: { "|14": 250, "|18": 260, "|22": 275, "|26": 300 },
    baseMinutes: { "|14": 180, "|18": 190, "|22": 200, "|26": 210 },
    adjustments: [
      {
        id: "braid-down",
        basis: "density",
        label: "Braid-down, by hair fullness",
        minutes: { "0": -10, "1": -5, "2": 0, "3": 30 },
      },
      {
        id: "natural-length",
        basis: "length",
        label: "Tucking your natural length",
        minutes: { short: 0, shoulder: 0, chest: 10, long: 20 },
      },
      {
        id: "leave-out",
        basis: "type",
        label: "Leave-out blending prep",
        minutes: { straight: 0, wavy: 5, curly: 10, coily: 15 },
      },
    ],
    supplies: { kind: "bundles", gramsPerBundle: 100, closure: false },
    measures: ["type", "density", "length", "color"],
    preview: "hair-ext",
  }),

  "tape-ins": () => ({
    template: "tape-ins",
    name: "Tape-in extensions",
    blurb: "Colour-matched tape-ins installed and blended. Hair not included.",
    axes: [
      {
        id: "length",
        label: "Extension length",
        choices: [
          { id: "16", label: '16"' },
          { id: "20", label: '20"' },
          { id: "24", label: '24"' },
        ],
      },
    ],
    basePrice: { "|16": 200, "|20": 220, "|24": 250 },
    baseMinutes: { "|16": 90, "|20": 100, "|24": 110 },
    adjustments: [
      {
        id: "packs",
        basis: "density",
        label: "Installing packs, by hair fullness",
        minutes: { "0": -15, "1": -10, "2": 0, "3": 25 },
      },
      {
        id: "blend",
        basis: "length",
        label: "Blending over your natural length",
        minutes: { short: 20, shoulder: 10, chest: 0, long: 0 },
      },
    ],
    supplies: {
      kind: "tape-in-packs",
      packsByDensity: { "0": [2, 2], "1": [2, 3], "2": [4, 5], "3": [6, 7] },
    },
    measures: ["type", "density", "length", "color"],
    preview: "hair-ext",
  }),

  "wig-install": () => ({
    template: "wig-install",
    name: "Frontal wig install",
    blurb: "Braid-down, lace customisation, install and style. Wig not included.",
    axes: [],
    basePrice: { "|": 180 },
    baseMinutes: { "|": 150 },
    adjustments: [
      {
        id: "braid-down",
        basis: "density",
        label: "Flat braid-down, by hair fullness",
        minutes: { "0": -10, "1": -5, "2": 0, "3": 25 },
      },
      {
        id: "natural-length",
        basis: "length",
        label: "Braiding down your natural length",
        minutes: { short: -10, shoulder: 0, chest: 10, long: 20 },
      },
      {
        id: "prep",
        basis: "type",
        label: "Stretch before braid-down",
        minutes: { straight: 0, wavy: 0, curly: 10, coily: 15 },
      },
    ],
    measures: ["type", "density", "length"],
    preview: "none",
  }),
};

export function createService(template: ServiceTemplateId, id?: string): Service {
  return { id: id ?? template, ...TEMPLATES[template]() };
}
