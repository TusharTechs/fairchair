import "server-only";
import { YouCamError } from "./errors";
import { FEATURES, type AnalysisFeature } from "./features";
import { youcamFetch } from "./http";

export type TaskState =
  | { status: "running" }
  | { status: "success"; results: unknown }
  | { status: "error"; code: string; message?: string };

type StartResponse = { data?: { task_id?: string } };
type PollResponse = {
  data?: { task_status?: string; error?: string | null; error_message?: string; results?: unknown };
};

export async function startTask(feature: AnalysisFeature, fileIds: string[]): Promise<string> {
  const def = FEATURES[feature];
  const res = await youcamFetch<StartResponse>(`/s2s/v2.0/task/${def.slug}`, {
    method: "POST",
    body: def.body(fileIds),
  });
  const id = res.data?.task_id;
  if (!id) throw new YouCamError({ code: "malformed_response", message: `${def.slug}: no task_id` });
  return id;
}

export async function pollTask(feature: AnalysisFeature, taskId: string): Promise<TaskState> {
  const def = FEATURES[feature];
  const res = await youcamFetch<PollResponse>(`/s2s/v2.0/task/${def.slug}/${encodeURIComponent(taskId)}`);
  const d = res.data ?? {};
  switch (d.task_status) {
    case "success":
      return { status: "success", results: d.results };
    case "error":
      return { status: "error", code: d.error ?? "task_failed", message: d.error_message };
    default:
      return { status: "running" };
  }
}

// Removes the task, its input and its output from YouCam storage.
export async function deleteTask(taskId: string): Promise<void> {
  await youcamFetch("/s2s/v2.0/task/delete", { method: "POST", body: { task_id: taskId } });
}

type CreditResponse = { results?: { amount_dec?: number; amount?: number; expiry?: number }[] };

export async function creditBalance(): Promise<number> {
  const res = await youcamFetch<CreditResponse>("/s2s/v1.0/client/credit");
  const now = Date.now();
  return (res.results ?? [])
    .filter((c) => !c.expiry || c.expiry > now)
    .reduce((sum, c) => sum + Number(c.amount_dec ?? c.amount ?? 0), 0);
}

// Generic task helpers for features outside the analysis registry (try-on).
export async function startRawTask(path: string, body: unknown): Promise<string> {
  const res = await youcamFetch<StartResponse>(path, { method: "POST", body });
  const id = res.data?.task_id;
  if (!id) throw new YouCamError({ code: "malformed_response", message: `${path}: no task_id` });
  return id;
}

export async function pollRawTask(path: string, taskId: string): Promise<TaskState> {
  const res = await youcamFetch<PollResponse>(`${path}/${encodeURIComponent(taskId)}`);
  const d = res.data ?? {};
  if (d.task_status === "success") return { status: "success", results: d.results };
  if (d.task_status === "error") return { status: "error", code: d.error ?? "task_failed", message: d.error_message };
  return { status: "running" };
}
