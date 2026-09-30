// Minimal YouCam helpers for scripts (the app uses src/lib/youcam, which is server-only).
const key = process.env.YOUCAM_API_KEY;
const base = process.env.YOUCAM_BASE_URL || "https://yce-api-01.makeupar.com";
if (!key) throw new Error("YOUCAM_API_KEY not set");
const auth = { Authorization: `Bearer ${key}` };

export async function api<T>(p: string, init?: { method: "POST"; body: unknown }): Promise<T> {
  const res = await fetch(new URL(p, base), {
    method: init?.method ?? "GET",
    headers: { ...auth, ...(init ? { "Content-Type": "application/json" } : {}) },
    body: init ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${p} → ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

export type RunResult =
  | { ok: true; results: unknown; ms: number; taskId: string }
  | { ok: false; error: string; message?: string; ms: number; taskId: string };

/** Start a task at /s2s/<version>/task/<slugPath> and poll until it finishes. */
export async function run(slugPath: string, body: unknown, version = "v2.0"): Promise<RunResult> {
  const started = Date.now();
  const s = await api<{ data?: { task_id?: string } }>(`/s2s/${version}/task/${slugPath}`, { method: "POST", body });
  const id = s.data?.task_id;
  if (!id) throw new Error(`no task id for ${slugPath}`);
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, i < 3 ? 1500 : 3000));
    const p = await api<{ data?: { task_status?: string; results?: unknown; error?: string; error_message?: string } }>(
      `/s2s/${version}/task/${slugPath}/${encodeURIComponent(id)}`,
    );
    const st = p.data?.task_status;
    if (st === "success") return { ok: true, results: p.data?.results, ms: Date.now() - started, taskId: id };
    if (st === "error") return { ok: false, error: p.data?.error ?? "error", message: p.data?.error_message, ms: Date.now() - started, taskId: id };
  }
  return { ok: false, error: "poll_timeout", ms: Date.now() - started, taskId: id };
}

export function findUrl(v: unknown): string | undefined {
  if (typeof v === "string" && /^https?:\/\//.test(v)) return v;
  if (Array.isArray(v)) for (const x of v) { const u = findUrl(x); if (u) return u; }
  if (v && typeof v === "object") for (const x of Object.values(v)) { const u = findUrl(x); if (u) return u; }
  return undefined;
}

export async function upload(bytes: Uint8Array, name: string, contentType = "image/jpeg") {
  const init = await api<{ data?: { files?: { file_id?: string; requests?: { url: string; method?: string; headers?: Record<string, string> }[] }[] } }>(
    "/s2s/v2.0/file",
    { method: "POST", body: { files: [{ content_type: contentType, file_name: name, file_size: bytes.byteLength }] } },
  );
  const f = init.data?.files?.[0];
  const req = f?.requests?.[0];
  if (!f?.file_id || !req) throw new Error("upload init failed");
  const put = await fetch(req.url, { method: req.method ?? "PUT", headers: req.headers, body: new Uint8Array(bytes) });
  if (!put.ok) throw new Error(`PUT ${put.status}`);
  return f.file_id;
}

export async function download(url: string) {
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}
