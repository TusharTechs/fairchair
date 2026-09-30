// Normalized hair measurements. These types are the contract between the
// YouCam integration (which produces them) and the pricing engine (which
// consumes them). Every value keeps the raw YouCam term so the UI can show
// exactly what the API returned.

export const HAIR_TYPE_BANDS = [
  { mapping: "1 to 2a", term: "Straight to Slight Wavy", family: "straight" },
  { mapping: "2a to 2b", term: "Slight to Medium Wavy", family: "wavy" },
  { mapping: "2b to 2c", term: "Medium to Thick Wavy", family: "wavy" },
  { mapping: "2c to 3a", term: "Thick Wavy to Loose Curls", family: "wavy" },
  { mapping: "3a to 3b", term: "Loose to Medium Curls", family: "curly" },
  { mapping: "3b to 3c", term: "Medium to Tight Curls", family: "curly" },
  { mapping: "3c to 4a", term: "Tight Curls to Kinky Soft", family: "curly" },
  { mapping: "4a to 4b", term: "Kinky Soft to Coily", family: "coily" },
  { mapping: "4b to 4c", term: "Coily to Extremely Coily", family: "coily" },
] as const;

export type HairFamily = (typeof HAIR_TYPE_BANDS)[number]["family"];

// Ordered shortest → longest. "or longer" bands mean the model saw at least
// that length but could not confirm more, so they carry a range upward.
export const HAIR_LENGTH_BANDS = [
  { term: "above the ears", label: "Above the ears", tier: "short", openEnded: false },
  { term: "ear length", label: "Ear length", tier: "short", openEnded: false },
  { term: "ear length or longer", label: "Ear length or longer", tier: "short", openEnded: true },
  { term: "short hair", label: "Above the shoulders", tier: "shoulder", openEnded: false },
  { term: "short hair or longer", label: "Shoulder length or longer", tier: "shoulder", openEnded: true },
  { term: "above chest", label: "Collarbone to chest", tier: "chest", openEnded: false },
  { term: "above chest or longer", label: "Chest length or longer", tier: "chest", openEnded: true },
  { term: "long hair", label: "Long (past the chest)", tier: "long", openEnded: false },
] as const;

export type LengthTier = (typeof HAIR_LENGTH_BANDS)[number]["tier"];
export const LENGTH_TIERS: readonly LengthTier[] = ["short", "shoulder", "chest", "long"];

export const DENSITY_GRADES = [
  { term: "Extremely Low Density", label: "Very fine / sparse" },
  { term: "Low Density", label: "Fine" },
  { term: "Medium Density", label: "Medium" },
  { term: "High Density", label: "Full / thick" },
] as const;

export const FRIZZ_GRADES = [
  { term: "Not Frizzy", label: "Smooth" },
  { term: "Slightly Frizzy", label: "Slight frizz" },
  { term: "Frizzy", label: "Frizzy" },
  { term: "Extreme Frizzy", label: "Very frizzy" },
] as const;

export type HairTypeMeasurement = { kind: "type"; index: number; mapping: string; term: string; family: HairFamily };
export type DensityMeasurement = { kind: "density"; grade: number; value: number; term: string };
export type LengthMeasurement = { kind: "length"; index: number; term: string; tier: LengthTier; openEnded: boolean };
export type FrizzMeasurement = { kind: "frizz"; grade: number; term: string };
export type HairColorMeasurement = { kind: "color"; hex: string };

export type Measurements = {
  type?: HairTypeMeasurement;
  density?: DensityMeasurement;
  length?: LengthMeasurement;
  frizz?: FrizzMeasurement;
  color?: HairColorMeasurement;
};

export type MeasurementKey = keyof Measurements;

export function hairTypeFromMapping(mapping: string): HairTypeMeasurement | undefined {
  // The live API returns e.g. "4B to 4C"; the docs show "4b to 4c".
  const index = HAIR_TYPE_BANDS.findIndex((b) => b.mapping === mapping.trim().toLowerCase());
  if (index < 0) return undefined;
  const band = HAIR_TYPE_BANDS[index];
  return { kind: "type", index, mapping: band.mapping, term: band.term, family: band.family };
}

export function lengthFromTerm(term: string): LengthMeasurement | undefined {
  const index = HAIR_LENGTH_BANDS.findIndex((b) => b.term === term.trim().toLowerCase());
  if (index < 0) return undefined;
  const band = HAIR_LENGTH_BANDS[index];
  return { kind: "length", index, term: band.term, tier: band.tier, openEnded: band.openEnded };
}

export function densityFromResult(mapping: string | number, term: string): DensityMeasurement | undefined {
  const grade = DENSITY_GRADES.findIndex((g) => g.term.toLowerCase() === term.trim().toLowerCase());
  const value = typeof mapping === "number" ? mapping : Number.parseFloat(mapping);
  if (grade < 0 || !Number.isFinite(value)) return undefined;
  return { kind: "density", grade, value: Math.min(3, Math.max(0, value)), term: DENSITY_GRADES[grade].term };
}

export function frizzFromResult(mapping: number | string, term: string): FrizzMeasurement | undefined {
  const byTerm = FRIZZ_GRADES.findIndex((g) => g.term.toLowerCase() === term.trim().toLowerCase());
  const grade = byTerm >= 0 ? byTerm : Number(mapping);
  if (!Number.isInteger(grade) || grade < 0 || grade > 3) return undefined;
  return { kind: "frizz", grade, term: FRIZZ_GRADES[grade].term };
}

export function describe(m: Measurements[MeasurementKey]): string {
  if (!m) return "Not measured";
  switch (m.kind) {
    case "type":
      return `${m.mapping.replace(" to ", "–")} · ${m.term}`;
    case "density":
      return `${DENSITY_GRADES[m.grade].label} (${m.value.toFixed(2)} / 3)`;
    case "length":
      return HAIR_LENGTH_BANDS[m.index].label;
    case "frizz":
      return FRIZZ_GRADES[m.grade].label;
    case "color":
      return m.hex.toUpperCase();
  }
}
