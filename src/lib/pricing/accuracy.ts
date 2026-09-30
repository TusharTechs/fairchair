import type { Measurements } from "@/lib/hair/measurements";
import { BUCKET_LABELS, type AdjustmentBasis, type Quote, type Service } from "./types";

// Compares estimated chair time with the time the stylist actually logged,
// grouped by what was measured, and proposes rule changes where the stylist's
// own history shows a consistent miss. Pure and deterministic.

export type Completed = { serviceId: string; measurements: Measurements; result: Quote; actualMinutes: number };

export type Suggestion = {
  serviceId: string;
  adjustmentId: string;
  basis: AdjustmentBasis;
  bucket: string;
  bucketLabel: string;
  n: number;
  meanDelta: number;
  proposedDelta: number;
};

function bucketOf(basis: AdjustmentBasis, m: Measurements): string | undefined {
  switch (basis) {
    case "density":
      return m.density ? String(m.density.grade) : undefined;
    case "length":
      return m.length && !m.length.openEnded ? m.length.tier : undefined;
    case "type":
      return m.type?.family;
    case "frizz":
      return m.frizz ? String(m.frizz.grade) : undefined;
  }
}

export function estimateMid(q: Quote) {
  return (q.minutes[0] + q.minutes[1]) / 2;
}

export function accuracySummary(completed: Completed[]) {
  if (!completed.length) return undefined;
  const deltas = completed.map((c) => c.actualMinutes - estimateMid(c.result));
  const within = completed.filter((c) => c.actualMinutes >= c.result.minutes[0] - 15 && c.actualMinutes <= c.result.slotMinutes).length;
  return {
    n: completed.length,
    meanDelta: deltas.reduce((a, b) => a + b, 0) / deltas.length,
    withinSlot: within / completed.length,
  };
}

export function suggestions(services: Service[], completed: Completed[], minN = 2, minDelta = 15): Suggestion[] {
  const out: Suggestion[] = [];
  for (const service of services) {
    const rows = completed.filter((c) => c.serviceId === service.id);
    for (const adj of service.adjustments) {
      const groups = new Map<string, number[]>();
      for (const r of rows) {
        const b = bucketOf(adj.basis, r.measurements);
        if (b === undefined) continue;
        groups.set(b, [...(groups.get(b) ?? []), r.actualMinutes - estimateMid(r.result)]);
      }
      for (const [bucket, ds] of groups) {
        if (ds.length < minN) continue;
        const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
        if (Math.abs(mean) < minDelta) continue;
        out.push({
          serviceId: service.id,
          adjustmentId: adj.id,
          basis: adj.basis,
          bucket,
          bucketLabel: BUCKET_LABELS[adj.basis][bucket] ?? bucket,
          n: ds.length,
          meanDelta: mean,
          proposedDelta: Math.round(mean / 5) * 5,
        });
      }
    }
  }
  // Strongest, best-supported evidence first; one suggestion per bucket group.
  out.sort((a, b) => Math.abs(b.meanDelta) * Math.sqrt(b.n) - Math.abs(a.meanDelta) * Math.sqrt(a.n));
  const seen = new Set<string>();
  return out.filter((s) => {
    const k = `${s.serviceId}:${s.basis}:${s.bucket}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function applySuggestion(service: Service, s: Suggestion): Service {
  return {
    ...service,
    adjustments: service.adjustments.map((a) =>
      a.id === s.adjustmentId ? { ...a, minutes: { ...a.minutes, [s.bucket]: (a.minutes[s.bucket] ?? 0) + s.proposedDelta } } : a,
    ),
  };
}
