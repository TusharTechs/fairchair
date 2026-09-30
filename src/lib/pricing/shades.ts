// Nearest industry hair-colour number for a measured hex. The numbering
// (1, 1B, 2, 4, 27, 30, 613…) is the common extension/wig shade system; the
// reference hexes are approximations, so results are always presented as
// "closest shade — confirm with a swatch".

export const INDUSTRY_SHADES = [
  { code: "1", name: "Jet black", hex: "#0b0a0a" },
  { code: "1B", name: "Off black", hex: "#1d1714" },
  { code: "2", name: "Darkest brown", hex: "#2c1e17" },
  { code: "4", name: "Dark brown", hex: "#3d271b" },
  { code: "6", name: "Medium brown", hex: "#5a3a26" },
  { code: "8", name: "Light brown", hex: "#74502f" },
  { code: "30", name: "Light auburn", hex: "#8c4b25" },
  { code: "350", name: "Copper", hex: "#a2472a" },
  { code: "27", name: "Honey blonde", hex: "#b0773d" },
  { code: "18", name: "Ash blonde", hex: "#9c8a6e" },
  { code: "613", name: "Bleach blonde", hex: "#e3cfa2" },
  { code: "99J", name: "Burgundy", hex: "#4b1620" },
] as const;

type Lab = [number, number, number];

function hexToRgb(hex: string): [number, number, number] | undefined {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return undefined;
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToLab([r, g, b]: [number, number, number]): Lab {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

function deltaE([l1, a1, b1]: Lab, [l2, a2, b2]: Lab): number {
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

export function nearestShade(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;
  const lab = rgbToLab(rgb);
  let best: { code: string; name: string; hex: string; deltaE: number } | undefined;
  for (const s of INDUSTRY_SHADES) {
    const d = deltaE(lab, rgbToLab(hexToRgb(s.hex)!));
    if (!best || d < best.deltaE) best = { ...s, deltaE: d };
  }
  return best;
}
