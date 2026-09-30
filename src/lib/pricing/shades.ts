// YouCam's skin-tone analysis reports hair colour as one of a small fixed set
// of colours (see docs: hair_color enum + hair_color_name). That is a colour
// *family*, not a precise shade, so FairChair maps it to a family and the
// industry shade numbers worth swatching — never to a single "exact" shade.

export type ColourFamily = "black" | "brown" | "blonde" | "auburn" | "red" | "grey";

// Documented hair_color values → family (docs pair names inconsistently, so we
// map by the colour itself).
const HEX_FAMILY: Record<string, ColourFamily> = {
  "#000000": "black",
  "#42280e": "brown",
  "#b56637": "auburn",
  "#722626": "red",
  "#faf0be": "blonde",
  "#808080": "grey",
  "#a0a0a0": "grey",
};

export const FAMILY_INFO: Record<ColourFamily, { label: string; shades: string[] }> = {
  black: { label: "Black", shades: ["1", "1B"] },
  brown: { label: "Brown", shades: ["2", "4", "6"] },
  blonde: { label: "Blonde", shades: ["27", "18", "613"] },
  auburn: { label: "Auburn", shades: ["30", "33", "350"] },
  red: { label: "Red", shades: ["99J", "350", "BUG"] },
  grey: { label: "Grey / silver", shades: ["60", "SILVER", "GREY"] },
};

export function familyFromHex(hex: string): ColourFamily | undefined {
  return HEX_FAMILY[hex.trim().toLowerCase()];
}

export function shadeSuggestion(hex: string) {
  const family = familyFromHex(hex);
  if (!family) return undefined;
  return { family, ...FAMILY_INFO[family] };
}
