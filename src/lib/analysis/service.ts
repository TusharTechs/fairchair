import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import { demoClient } from "@/data/demo-clients";
import { getDb, schema } from "@/lib/db";
import type { AnalysisSource } from "@/lib/db/schema";
import type { Measurements } from "@/lib/hair/measurements";
import { newId, sha256 } from "@/lib/security";
import { getYouCamConfig, youcamConfigured } from "@/lib/youcam/config";
import { YouCamError } from "@/lib/youcam/errors";
import { FEATURES, mergeMeasurements, viewsFor, type AnalysisFeature, type View } from "@/lib/youcam/features";
import { uploadImage } from "@/lib/youcam/files";
import { creditBalance, deleteTask, pollTask, startTask } from "@/lib/youcam/tasks";
import { log } from "@/lib/youcam/http";

export type Photo = { bytes: Uint8Array; contentType: "image/jpeg" | "image/png" };
export type Photos = Partial<Record<View, Photo>>;

export class LiveUnavailable extends Error {
  constructor(
    readonly reason: "not_configured" | "credit_reserve" | "daily_cap",
    message: string,
  ) {
    super(message);
  }
}


// ---------------------------------------------------------------------------
// Credit protection

let balanceCache: { at: number; value: number } | undefined;

async function unitsAvailable(): Promise<number> {
  if (balanceCache && Date.now() - balanceCache.at < 60_000) return balanceCache.value;
  const value = await creditBalance();
  balanceCache = { at: Date.now(), value };
  return value;
}

export async function liveStatus(ipHash: string | null) {
  if (!youcamConfigured()) return { available: false as const, reason: "not_configured" as const };
  const cfg = getYouCamConfig();
  try {
    const balance = await unitsAvailable();
    if (balance < cfg.creditReserve) return { available: false as const, reason: "credit_reserve" as const, balance };
  } catch (e) {
    log("youcam.credit_check_failed", { message: (e as Error).message });
  }
  if (ipHash) {
    const db = await getDb();
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.analyses)
      .where(
        and(
          eq(schema.analyses.ipHash, ipHash),
          eq(schema.analyses.source, "live"),
          gt(schema.analyses.createdAt, new Date(Date.now() - 24 * 3600_000)),
        ),
      );
    if (n >= cfg.liveDailyCapPerIp) return { available: false as const, reason: "daily_cap" as const };
  }
  return { available: true as const };
}

// ---------------------------------------------------------------------------
// Create

export async function createDemoAnalysis(studioId: string, demoId: string, features: AnalysisFeature[]) {
  const demo = demoClient(demoId);
  if (!demo) throw new Error("Unknown demo client");
  const db = await getDb();
  const id = newId("an");
  const parts = features.map((f) => FEATURES[f].normalize(demo.recorded[f]));
  await db.insert(schema.analyses).values({
    id,
    studioId,
    source: demo.source,
    status: parts.some(Boolean) ? "done" : "failed",
    imageHashes: {},
    measurements: mergeMeasurements(parts),
    demoClientId: demo.id,
  });
  await db.insert(schema.analysisTasks).values(
    features.map((feature) => {
      const raw = demo.recorded[feature];
      return raw !== undefined
        ? { analysisId: id, feature, status: "success" as const, raw, cached: true, finishedAt: new Date() }
        : {
            analysisId: id,
            feature,
            status: "error" as const,
            errorCode: demo.errors?.[feature] ?? "not_recorded",
            cached: true,
            finishedAt: new Date(),
          };
    }),
  );
  return id;
}

export async function createLiveAnalysis(opts: {
  studioId: string;
  photos: Photos;
  features: AnalysisFeature[];
  ipHash: string | null;
}) {
  const status = await liveStatus(opts.ipHash);
  if (!status.available) {
    throw new LiveUnavailable(
      status.reason,
      status.reason === "daily_cap"
        ? "You've reached today's live analyses for this device."
        : "Live analysis is paused right now.",
    );
  }

  const db = await getDb();
  const id = newId("an");
  const hashes: Partial<Record<View, string>> = {};
  for (const [view, p] of Object.entries(opts.photos) as [View, Photo][]) hashes[view] = sha256(p.bytes);
  await db.insert(schema.analyses).values({
    id,
    studioId: opts.studioId,
    source: "live",
    status: "running",
    imageHashes: hashes,
    ipHash: opts.ipHash,
  });

  // Upload lazily, once per view, only if some feature misses the cache.
  const uploads = new Map<View, Promise<string>>();
  const fileId = (view: View) => {
    const p = opts.photos[view]!;
    if (!uploads.has(view)) uploads.set(view, uploadImage(p.bytes, p.contentType, `fairchair-${view}.${p.contentType === "image/png" ? "png" : "jpg"}`));
    return uploads.get(view)!;
  };
  const saveFileIds = async () => {
    if (!uploads.size) return;
    const entries = await Promise.all([...uploads].map(async ([v, p]) => [v, await p.catch(() => "")] as const));
    await db.update(schema.analyses).set({ fileIds: Object.fromEntries(entries.filter(([, id]) => id)) }).where(eq(schema.analyses.id, id));
  };

  for (const feature of opts.features) {
    const views = viewsFor(feature, opts.photos);
    if (!views.every((v) => opts.photos[v])) {
      // The client skipped a view this detector needs; it is reported as not measured.
      await db.insert(schema.analysisTasks).values({ analysisId: id, feature, status: "error", errorCode: "missing_view", finishedAt: new Date() });
      continue;
    }
    const cacheKey = `${feature}:${views.map((v) => hashes[v]).join("+")}`;
    const [hit] = await db.select().from(schema.resultCache).where(eq(schema.resultCache.key, cacheKey));
    if (hit) {
      await db.insert(schema.analysisTasks).values({
        analysisId: id,
        feature,
        status: "success",
        raw: hit.raw,
        cached: true,
        finishedAt: new Date(),
      });
      continue;
    }
    try {
      const ids = await Promise.all(views.map(fileId));
      const taskId = await startTask(feature, ids);
      await db.insert(schema.analysisTasks).values({ analysisId: id, feature, youcamTaskId: taskId, status: "running" });
    } catch (e) {
      const code = e instanceof YouCamError ? e.code : "request_failed";
      await db.insert(schema.analysisTasks).values({
        analysisId: id,
        feature,
        status: "error",
        errorCode: code,
        finishedAt: new Date(),
      });
      if (e instanceof YouCamError && e.code === "auth_failed") throw e;
    }
  }
  await saveFileIds();
  return id;
}

// ---------------------------------------------------------------------------
// Poll

export type AnalysisView = {
  id: string;
  source: AnalysisSource;
  status: "running" | "done" | "failed";
  demoClientId: string | null;
  tasks: {
    feature: AnalysisFeature;
    label: string;
    status: "running" | "success" | "error";
    errorCode: string | null;
    errorMessage: string | null;
    cached: boolean;
    attempts: number;
  }[];
  measurements: Measurements;
};

export async function getAnalysis(id: string): Promise<AnalysisView | undefined> {
  const db = await getDb();
  const [analysis] = await db.select().from(schema.analyses).where(eq(schema.analyses.id, id));
  if (!analysis) return undefined;
  let tasks = await db.select().from(schema.analysisTasks).where(eq(schema.analysisTasks.analysisId, id));

  const running = tasks.filter((t) => t.status === "running" && t.youcamTaskId);
  if (running.length) {
    await Promise.all(running.map((t) => advance(t)));
    tasks = await db.select().from(schema.analysisTasks).where(eq(schema.analysisTasks.analysisId, id));
  }

  if (!tasks.some((t) => t.status === "running")) void cleanupUpstream(tasks);

  const measurements = mergeMeasurements(
    tasks.filter((t) => t.status === "success").map((t) => FEATURES[t.feature as AnalysisFeature].normalize(t.raw)),
  );
  const stillRunning = tasks.some((t) => t.status === "running");
  const status = stillRunning ? "running" : tasks.some((t) => t.status === "success") ? "done" : "failed";
  if (status !== analysis.status || JSON.stringify(measurements) !== JSON.stringify(analysis.measurements)) {
    await db.update(schema.analyses).set({ status, measurements }).where(eq(schema.analyses.id, id));
  }

  return {
    id,
    source: analysis.source,
    status,
    demoClientId: analysis.demoClientId,
    measurements,
    tasks: tasks.map((t) => ({
      feature: t.feature as AnalysisFeature,
      label: FEATURES[t.feature as AnalysisFeature].label,
      status: t.status,
      errorCode: t.errorCode,
      errorMessage: t.status === "error" ? ((t.raw as { message?: string } | null)?.message ?? null) : null,
      cached: t.cached,
      attempts: t.attempts,
    })),
  };
}

const POLL_BUDGET_MS = 120_000;
const TRANSIENT = new Set(["unknown_internal_error", "error_inference"]);

// Privacy: once every task in an analysis has finished, remove the tasks, their
// input photos and outputs from YouCam. This must wait for *all* tasks —
// task/delete also deletes the input files, which other tasks share (found in
// live testing: deleting early made the remaining tasks fail).
async function cleanupUpstream(tasks: (typeof schema.analysisTasks.$inferSelect)[]) {
  const db = await getDb();
  for (const t of tasks) {
    if (!t.youcamTaskId || t.upstreamDeleted) continue;
    try {
      await deleteTask(t.youcamTaskId);
      await db.update(schema.analysisTasks).set({ upstreamDeleted: true }).where(eq(schema.analysisTasks.id, t.id));
    } catch (e) {
      log("youcam.delete_failed", { message: (e as Error).message });
    }
  }
  await db.update(schema.analyses).set({ fileIds: {} }).where(eq(schema.analyses.id, tasks[0]?.analysisId ?? ""));
}

async function advance(task: typeof schema.analysisTasks.$inferSelect) {
  const db = await getDb();
  const feature = task.feature as AnalysisFeature;
  try {
    const state = await pollTask(feature, task.youcamTaskId!);
    if (state.status === "running") {
      if (Date.now() - task.startedAt.getTime() > POLL_BUDGET_MS) {
        await db
          .update(schema.analysisTasks)
          .set({ status: "error", errorCode: "timeout", finishedAt: new Date() })
          .where(eq(schema.analysisTasks.id, task.id));
      }
      return;
    }
    if (state.status === "error") {
      // Errors cost no units. Retry once for transient engine errors, and for
      // an angle rejection on the three-view detectors retry with the side
      // views swapped: front cameras mirror images and capture order varies,
      // so "turned right" can arrive as the left view.
      const swap = state.code === "error_face_angle_invalid" && (feature === "hair-type" || feature === "hair-frizz");
      if ((TRANSIENT.has(state.code) || swap) && task.attempts < 2) {
        const [analysis] = await db.select().from(schema.analyses).where(eq(schema.analyses.id, task.analysisId));
        const fileIds = analysis.fileIds as Record<string, string>;
        let ids = viewsFor(feature, fileIds).map((v) => fileIds[v]);
        if (swap) ids = [ids[0], ids[2], ids[1]];
        if (ids.every(Boolean)) {
          const retryId = await startTask(feature, ids);
          await db
            .update(schema.analysisTasks)
            .set({ youcamTaskId: retryId, attempts: task.attempts + 1, startedAt: new Date() })
            .where(eq(schema.analysisTasks.id, task.id));
          log("youcam.task_retry", { feature, code: state.code, swapped: swap });
          return;
        }
      }
      await db
        .update(schema.analysisTasks)
        .set({ status: "error", errorCode: state.code, raw: { error: state.code, message: state.message ?? null }, finishedAt: new Date() })
        .where(eq(schema.analysisTasks.id, task.id));
      return;
    }

    const units = FEATURES[feature].units;
    await db
      .update(schema.analysisTasks)
      .set({ status: "success", raw: state.results ?? null, units, finishedAt: new Date() })
      .where(eq(schema.analysisTasks.id, task.id));
    await db.insert(schema.usageLedger).values({ feature, units });

    const [analysis] = await db.select().from(schema.analyses).where(eq(schema.analyses.id, task.analysisId));
    const hashes = analysis.imageHashes as Partial<Record<View, string>>;
    await db
      .insert(schema.resultCache)
      .values({ key: `${feature}:${viewsFor(feature, hashes).map((v) => hashes[v]).join("+")}`, raw: state.results ?? null })
      .onConflictDoNothing();

  } catch (e) {
    const err = e instanceof YouCamError ? e : undefined;
    if (err && !err.retryable) {
      await db
        .update(schema.analysisTasks)
        .set({ status: "error", errorCode: err.code, finishedAt: new Date() })
        .where(eq(schema.analysisTasks.id, task.id));
    }
    // Retryable errors: leave running; the next poll tries again.
  }
}
