import "server-only";
import { getYouCamConfig } from "./config";
import { YouCamError } from "./errors";

// Thin, instrumented fetch to the YouCam S2S API: auth, timeout, error
// mapping, and one backoff retry for 429/5xx.

export async function youcamFetch<T = unknown>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown } = { method: "GET" },
  attempt = 0,
): Promise<T> {
  const cfg = getYouCamConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  const started = Date.now();

  let res: Response;
  try {
    res = await fetch(new URL(path, cfg.baseUrl), {
      method: init.method,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    throw new YouCamError({
      code: controller.signal.aborted ? "timeout" : "request_failed",
      message: controller.signal.aborted ? "YouCam request timed out" : "Could not reach YouCam",
      retryable: true,
    });
  } finally {
    clearTimeout(timer);
  }

  log("youcam.request", { path: redactTaskId(path), status: res.status, ms: Date.now() - started });

  if ((res.status === 429 || res.status >= 500) && attempt < 1) {
    const retryAfter = Number(res.headers.get("retry-after")) || 0;
    await new Promise((r) => setTimeout(r, Math.min(8000, Math.max(1000, retryAfter * 1000))));
    return youcamFetch<T>(path, init, attempt + 1);
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new YouCamError({ code: "malformed_response", message: `Non-JSON response (${res.status})`, status: res.status });
  }

  if (!res.ok) {
    const body = json as { error_code?: string; error?: string; message?: string };
    const code =
      res.status === 401 || res.status === 403
        ? "auth_failed"
        : res.status === 429
          ? "rate_limited"
          : body.error_code === "InvalidTaskId"
            ? "task_expired"
            : (body.error_code ?? "request_failed");
    throw new YouCamError({
      code,
      status: res.status,
      message: `YouCam ${res.status}: ${(body.error ?? body.message ?? text).toString().slice(0, 240)}`,
      retryable: res.status === 429 || res.status >= 500,
    });
  }

  return json as T;
}

function redactTaskId(path: string): string {
  return path.replace(/\/[A-Za-z0-9_\-+=]{24,}$/, "/:task_id");
}

export function log(event: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV === "test") return;
  console.info(JSON.stringify({ event, ...data }));
}
