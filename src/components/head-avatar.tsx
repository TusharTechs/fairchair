import type { Measurements } from "@/lib/hair/measurements";

// An illustration generated from measurements (not a photo): hair volume
// follows density, silhouette length follows natural length, and the outline
// texture follows curl family.
export function HeadAvatar({ m, skin = "#8a5a3c", hair = "#1f1712", className }: { m: Measurements; skin?: string; hair?: string; className?: string }) {
  const volume = 1 + ((m.density?.value ?? 1.5) / 3) * 0.55;
  const tier = m.length?.tier ?? "shoulder";
  const drop = { short: 58, shoulder: 92, chest: 122, long: 150 }[tier];
  const family = m.type?.family ?? "wavy";
  const amp = { straight: 0, wavy: 2.2, curly: 4.2, coily: 6 }[family];
  const freq = { straight: 1, wavy: 9, curly: 16, coily: 26 }[family];

  const cx = 80;
  const top = 34;
  const w = 46 * volume;
  const pts: string[] = [];
  const steps = 90;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = Math.PI * (1 + t);
    const baseX = cx + Math.cos(angle) * w;
    const baseY = top + 46 + Math.sin(angle) * (46 * volume * 0.92);
    const n = amp * Math.sin(t * freq * Math.PI);
    pts.push(`${(baseX + Math.cos(angle) * n).toFixed(1)},${(baseY + Math.sin(angle) * n).toFixed(1)}`);
  }
  const sideL = [];
  const sideR = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const y = top + 46 + t * (drop - 20);
    const n = amp * Math.sin(t * freq * 0.8 * Math.PI);
    const spread = w * (1 - t * 0.12);
    sideR.push(`${(cx + spread + n).toFixed(1)},${y.toFixed(1)}`);
    sideL.unshift(`${(cx - spread - n).toFixed(1)},${y.toFixed(1)}`);
  }
  const path = `M${pts.join(" L")} L${sideR.join(" L")} L${(cx + w * 0.6).toFixed(1)},${(top + 26 + drop).toFixed(1)} L${(cx - w * 0.6).toFixed(1)},${(top + 26 + drop).toFixed(1)} L${sideL.join(" L")} Z`;

  return (
    <svg viewBox="0 0 160 200" className={className} role="img" aria-label="Illustration generated from the hair measurements">
      <rect width="160" height="200" rx="18" fill="var(--surface-2)" />
      <path d="M36 200c4-30 22-44 44-44s40 14 44 44Z" fill="var(--line-strong)" />
      <path d={path} fill={hair} />
      <rect x="70" y="112" width="20" height="24" rx="8" fill={skin} />
      <ellipse cx="80" cy="92" rx="25" ry="30" fill={skin} />
      <path d={`M${cx - 26} 84c4-22 16-30 26-30s22 8 26 30c-8-10-16-14-26-14s-18 4-26 14Z`} fill={hair} />
    </svg>
  );
}
