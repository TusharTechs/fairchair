import { DENSITY_GRADES, type HairFamily, type Measurements } from "@/lib/hair/measurements";
import { FAMILY_INFO, familyFromHex, type ColourFamily } from "@/lib/pricing/shades";

// "Find my match" for hair-extension stores: YouCam measurements → the right
// variant (texture, length, shade) and pack count of a store's own product,
// with the measurement behind every choice. Pure and deterministic.
//
// Products use the shape of Shopify's public product JSON (/products/<handle>.js),
// so any Shopify store works without installing an app.

export type Variant = { id: string; title: string; options: string[]; price: number; available: boolean };
export type Product = { handle: string; title: string; optionNames: string[]; variants: Variant[] };
export type MatchSettings = {
  /** Packs (or bundles) needed per YouCam density grade 0–3. */
  packsByDensity: [number, number, number, number];
  /** Extra inches to order for curly/coily textures, which wear shorter. */
  curlyExtraInches: number;
};
export const DEFAULT_MATCH_SETTINGS: MatchSettings = { packsByDensity: [2, 3, 5, 7], curlyExtraInches: 2 };

export type Reason = { what: string; choice: string; because: string; measured: boolean };
export type Match = {
  variant?: Variant;
  quantity: number;
  reasons: Reason[];
  alternatives: Variant[];
  colourFamily?: ColourFamily;
  shadeOptions: string[];
  tryOnTemplate: "all_length_1" | "all_length_2_" | "all_length_3";
  warnings: string[];
};

const TEXTURE_WORDS: Record<HairFamily, string[]> = {
  straight: ["silky straight", "straight", "silky"],
  wavy: ["body wave", "wavy", "loose wave"],
  curly: ["deep wave", "curly", "water wave", "loose curl"],
  coily: ["kinky straight", "kinky curly", "afro", "coily", "kinky", "4c", "yaki"],
};
const TEXTURE_LABEL: Record<HairFamily, string> = {
  straight: "Straight / silky",
  wavy: "Body wave",
  curly: "Deep wave / curly",
  coily: "Kinky straight or kinky curly",
};

const idx = (names: string[], re: RegExp) => names.findIndex((n) => re.test(n));
const inches = (v: string) => {
  const m = /(\d{1,2})\s*(?:"|”|in\b|inch)/i.exec(v) ?? /^(\d{1,2})\b/.exec(v.trim());
  return m ? Number(m[1]) : undefined;
};
const hasCode = (value: string, code: string) =>
  new RegExp(`(^|[^0-9a-z])#?${code.replace(/[^0-9a-z]/gi, "")}($|[^0-9a-z])`, "i").test(value);

export function tryOnTemplateFor(lengthInches: number): Match["tryOnTemplate"] {
  return lengthInches <= 16 ? "all_length_1" : lengthInches <= 20 ? "all_length_2_" : "all_length_3";
}

/**
 * `chosenColour` is the shopper's own pick. FairChair does not auto-select shade
 * from YouCam's hair_color: in our live test it labelled black hair "Blonde" on
 * 2 of 4 portraits (both dark hair on dark skin) — see docs/measurements.md.
 */
export function matchExtensions(
  product: Product,
  m: Measurements,
  desiredInches: number,
  settings: MatchSettings = DEFAULT_MATCH_SETTINGS,
  chosenColour?: ColourFamily,
): Match {
  const reasons: Reason[] = [];
  const warnings: string[] = [];
  const names = product.optionNames;
  const texIdx = idx(names, /texture|pattern|curl|style/i);
  const lenIdx = idx(names, /length|inch/i);
  const colIdx = idx(names, /colou?r|shade/i);
  let pool = product.variants.filter((v) => v.available);
  if (!pool.length) {
    warnings.push("Every variant is sold out.");
    pool = product.variants;
  }

  // Texture ← YouCam Hair Type
  const family = m.type?.family;
  if (family && texIdx >= 0) {
    const words = TEXTURE_WORDS[family];
    const matching = pool.filter((v) => words.some((w) => v.options[texIdx]?.toLowerCase().includes(w)));
    if (matching.length) {
      pool = matching;
      reasons.push({ what: "Texture", choice: matching[0].options[texIdx], because: `Hair Type: ${m.type!.mapping.toUpperCase().replace(" TO ", " to ")}`, measured: true });
    } else warnings.push(`This product has no ${TEXTURE_LABEL[family].toLowerCase()} texture to blend with your hair.`);
  } else if (!family) warnings.push("Curl pattern wasn't measured — pick the texture closest to your own hair.");

  // Length ← desired length + shrinkage allowance for curly/coily textures
  const curly = family === "curly" || family === "coily";
  const target = desiredInches + (curly ? settings.curlyExtraInches : 0);
  if (lenIdx >= 0) {
    const lengths = [...new Set(pool.map((v) => inches(v.options[lenIdx] ?? "")).filter((n): n is number => n !== undefined))].sort((a, b) => a - b);
    const pick = lengths.find((l) => l >= target) ?? lengths.at(-1);
    if (pick !== undefined) {
      pool = pool.filter((v) => inches(v.options[lenIdx] ?? "") === pick);
      reasons.push({
        what: "Length",
        choice: `${pick}"`,
        because: curly
          ? `${desiredInches}" wanted + ${settings.curlyExtraInches}" for shrinkage (Hair Type: ${m.type!.mapping.toUpperCase().replace(" TO ", " to ")})`
          : `${desiredInches}" wanted`,
        measured: curly,
      });
    }
  }

  // Shade ← the shopper's chosen colour family (offer the shades to swatch)
  const colourFamily = chosenColour ?? (m.color ? familyFromHex(m.color.hex) : undefined);
  const colourSource = chosenColour ? "You chose" : "Hair colour family";
  let shadeOptions: string[] = [];
  if (colIdx >= 0) {
    const values = [...new Set(pool.map((v) => v.options[colIdx]))];
    if (colourFamily) {
      const codes = FAMILY_INFO[colourFamily].shades;
      shadeOptions = values.filter((v) => codes.some((c) => hasCode(v, c)) || v.toLowerCase().includes(colourFamily));
      if (shadeOptions.length) {
        pool = pool.filter((v) => v.options[colIdx] === shadeOptions[0]);
        reasons.push({
          what: "Shade",
          choice: shadeOptions[0],
          because: `${colourSource}: ${FAMILY_INFO[colourFamily].label}${shadeOptions.length > 1 ? ` (also consider ${shadeOptions.slice(1).join(", ")})` : ""}`,
          measured: !chosenColour,
        });
      } else warnings.push(`No ${FAMILY_INFO[colourFamily].label.toLowerCase()} shade in this product.`);
    } else {
      shadeOptions = values;
      warnings.push("Choose your colour family — and order a swatch before the full set.");
    }
  }

  // Quantity ← YouCam Hair Density
  const grade = m.density?.grade;
  const quantity = grade !== undefined ? settings.packsByDensity[grade] : settings.packsByDensity[2];
  reasons.push({
    what: "Packs",
    choice: String(quantity),
    because: m.density ? `Hair Density: ${m.density.term} — ${DENSITY_GRADES[m.density.grade].label.toLowerCase()} hair` : "Density not measured — a typical amount",
    measured: m.density !== undefined,
  });
  if (!m.density) warnings.push("Density wasn't measured, so the pack count is a typical amount.");

  const variant = pool[0];
  const alternatives = pool.slice(1, 4);
  return {
    variant,
    quantity,
    reasons,
    alternatives,
    colourFamily,
    shadeOptions,
    tryOnTemplate: tryOnTemplateFor(lenIdx >= 0 && variant ? (inches(variant.options[lenIdx]) ?? target) : target),
    warnings,
  };
}

/** Shopify cart permalink: opens checkout with the variant and quantity. */
export function cartPermalink(domain: string, variantId: string, quantity: number) {
  return `https://${domain}/cart/${encodeURIComponent(variantId)}:${quantity}`;
}

/** Normalises Shopify's public product JSON (/products/<handle>.js). */
export function productFromShopifyJson(json: unknown): Product {
  const p = json as {
    handle?: string;
    title?: string;
    options?: (string | { name?: string })[];
    variants?: { id?: number | string; title?: string; options?: string[]; option1?: string; option2?: string; option3?: string; price?: number | string; available?: boolean }[];
  };
  if (!p || !Array.isArray(p.variants) || !p.variants.length) throw new Error("That doesn't look like a Shopify product.");
  const optionNames = (p.options ?? []).map((o) => (typeof o === "string" ? o : (o.name ?? "")));
  return {
    handle: String(p.handle ?? ""),
    title: String(p.title ?? "Product"),
    optionNames,
    variants: p.variants.map((v) => ({
      id: String(v.id ?? ""),
      title: String(v.title ?? ""),
      options: v.options ?? [v.option1, v.option2, v.option3].filter((x): x is string => typeof x === "string"),
      price: typeof v.price === "string" ? Math.round(Number.parseFloat(v.price) * 100) : Number(v.price ?? 0),
      available: v.available !== false,
    })),
  };
}
