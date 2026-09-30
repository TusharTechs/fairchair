import { DENSITY_GRADES, FRIZZ_GRADES, HAIR_LENGTH_BANDS, HAIR_TYPE_BANDS, type Measurements } from "@/lib/hair/measurements";
import { shadeSuggestion } from "@/lib/pricing/shades";
import { cx } from "./ui";

type Row = { key: string; label: string; api: string; value?: string; detail?: string; scale?: { at: number; of: number } };

export function hairRows(m: Measurements): Row[] {
  const rows: Row[] = [
    {
      key: "type",
      label: "Curl pattern",
      api: "Hair Type Detection",
      value: m.type ? m.type.mapping.replace(" to ", "–").toUpperCase() : undefined,
      detail: m.type?.term,
      scale: m.type ? { at: m.type.index, of: HAIR_TYPE_BANDS.length - 1 } : undefined,
    },
    {
      key: "density",
      label: "Density",
      api: "Hair Density Detection",
      value: m.density ? DENSITY_GRADES[m.density.grade].label : undefined,
      detail: m.density ? `${m.density.term} · ${m.density.value.toFixed(2)} of 3` : undefined,
      scale: m.density ? { at: m.density.value, of: 3 } : undefined,
    },
    {
      key: "length",
      label: "Natural length",
      api: "Hair Length Detection",
      value: m.length ? HAIR_LENGTH_BANDS[m.length.index].label : undefined,
      detail: m.length ? `“${m.length.term}”${m.length.openEnded ? " — could be longer" : ""}` : undefined,
      scale: m.length ? { at: m.length.index, of: HAIR_LENGTH_BANDS.length - 1 } : undefined,
    },
    {
      key: "frizz",
      label: "Frizz",
      api: "Hair Frizziness Detection",
      value: m.frizz ? FRIZZ_GRADES[m.frizz.grade].label : undefined,
      detail: m.frizz?.term,
      scale: m.frizz ? { at: m.frizz.grade, of: 3 } : undefined,
    },
  ];
  if (m.color) {
    const shade = shadeSuggestion(m.color.hex);
    rows.push({
      key: "color",
      label: "Colour family",
      api: "Facial Color Tones · hair_color",
      value: shade ? shade.label : m.color.hex.toUpperCase(),
      detail: `${m.color.hex.toUpperCase()}${shade ? ` · swatch #${shade.shades.join(", #")}` : ""}`,
    });
  }
  return rows;
}

export function HairCard({ measurements, compact, className }: { measurements: Measurements; compact?: boolean; className?: string }) {
  const rows = hairRows(measurements).filter((r) => !compact || r.value);
  return (
    <dl className={cx("divide-y divide-line", className)}>
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[7.5rem_1fr] items-start gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr]">
          <dt className="pt-0.5 text-sm text-muted">{r.label}</dt>
          <dd className="min-w-0">
            {r.value ? (
              <>
                <div className="flex items-center gap-2">
                  {r.key === "color" && measurements.color ? (
                    <span className="h-4 w-4 shrink-0 rounded-full border border-line-strong" style={{ background: measurements.color.hex }} />
                  ) : null}
                  <span className="font-semibold text-ink">{r.value}</span>
                </div>
                {r.scale ? (
                  <div className="mt-1.5 h-1.5 w-full max-w-[11rem] overflow-hidden rounded-full bg-surface-2" aria-hidden>
                    <div className="h-full rounded-full bg-measured" style={{ width: `${Math.max(6, (r.scale.at / r.scale.of) * 100)}%` }} />
                  </div>
                ) : null}
                {!compact ? (
                  <p className="mt-1 font-mono text-[0.72rem] text-muted">
                    {r.api}: {r.detail}
                  </p>
                ) : null}
              </>
            ) : (
              <span className="text-sm text-muted">Not measured</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
