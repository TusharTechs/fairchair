import type { Adjustment, QuoteWarning, Service, Studio } from "./types";

// FairChair prices by time and materials. Curl pattern can change how long
// prep takes, so it may add minutes, but a flat price keyed on hair type is a
// texture surcharge. This check finds those rules and proposes the
// time-based equivalent at the studio's hourly rate.

export type FairnessIssue = {
  serviceId: string;
  adjustmentId: string;
  message: string;
  suggestion: Adjustment;
};

export function findTextureSurcharges(studio: Pick<Studio, "hourlyRate">, service: Service): FairnessIssue[] {
  const issues: FairnessIssue[] = [];
  for (const adj of service.adjustments) {
    if (adj.basis !== "type" || !adj.price) continue;
    const charged = Object.entries(adj.price).filter(([, v]) => (v ?? 0) > 0);
    if (charged.length === 0) continue;

    const minutes: Record<string, number> = { ...(adj.minutes as Record<string, number>) };
    for (const [bucket, price] of charged) {
      const extra = Math.round((((price ?? 0) / studio.hourlyRate) * 60) / 5) * 5;
      minutes[bucket] = (minutes[bucket] ?? 0) + extra;
    }
    issues.push({
      serviceId: service.id,
      adjustmentId: adj.id,
      message: `“${adj.label}” charges a flat amount for hair texture. FairChair prices the extra prep time instead.`,
      suggestion: { ...adj, price: undefined, minutes, label: adj.label || "Prep time for this texture" },
    });
  }
  return issues;
}

export function applyFairnessFix(service: Service, issue: FairnessIssue): Service {
  return {
    ...service,
    adjustments: service.adjustments.map((a) => (a.id === issue.adjustmentId ? issue.suggestion : a)),
  };
}

export function fairnessWarnings(studio: Pick<Studio, "hourlyRate">, service: Service): QuoteWarning[] {
  return findTextureSurcharges(studio, service).map((i) => ({ code: "texture-surcharge", message: i.message }));
}
