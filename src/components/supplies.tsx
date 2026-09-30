import type { Supply } from "@/lib/pricing/types";

export function SupplyList({ supplies }: { supplies: Supply[] }) {
  if (!supplies.length) return null;
  return (
    <ul className="divide-y divide-line">
      {supplies.map((s) => (
        <li key={s.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="font-medium">{s.label}</p>
            <p className="text-sm text-ink-2">{s.detail}</p>
            {s.because ? <p className="mt-0.5 font-mono text-[0.7rem] text-muted">{s.because}</p> : null}
          </div>
          {s.quantity ? (
            <p className="tabular shrink-0 font-display text-lg font-normal">
              {s.quantity[0] === s.quantity[1] ? s.quantity[0] : `${s.quantity[0]}–${s.quantity[1]}`}
              <span className="ml-1 text-xs font-medium text-muted">{s.unit}</span>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
