// YouCam JS Camera Kit (v2.5): guided capture with live face-quality checks.
// No API key is used in the browser; captured photos are uploaded through our
// server like any other photo. Docs: docs.perfectcorp.com → "JS Camera Kit".
//
// The Camera Kit renders its live view *inside* #YMK-module, so FairChair shows
// that element in a full-screen overlay (with a step label and Cancel) while
// the camera is open. The node is created once and reused across sessions.

const SDK_URL = "https://plugins-media.makeupar.com/v2.5-camera-kit/sdk.js";

export type CameraMode = "hairtype" | "hairdensity" | "hairlength";
export type Captured = { phase: number; blob: Blob; width: number; height: number };

type YMKApi = {
  init: (opts: Record<string, unknown>) => void;
  openCameraKit: () => void;
  close: () => void;
  addEventListener: (event: string, cb: (payload: unknown) => void) => number;
  removeEventListener: (id: number) => void;
};

declare global {
  interface Window {
    YMK?: YMKApi;
    YMKAsyncInit?: () => void;
    ymkAsyncInit?: () => void;
  }
}

let loading: Promise<YMKApi> | undefined;

function overlay() {
  let root = document.getElementById("fc-camera");
  if (root) return root;
  root = document.createElement("div");
  root.id = "fc-camera";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Guided camera");
  root.style.cssText =
    "position:fixed;inset:0;z-index:1000;display:none;flex-direction:column;align-items:center;background:#0f0b09;color:#fff;font-family:inherit";
  root.innerHTML = `
    <div style="display:flex;width:100%;max-width:520px;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px">
      <div style="min-width:0">
        <div data-fc-step style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.7"></div>
        <div data-fc-label style="font-weight:600;font-size:15px;line-height:1.3"></div>
      </div>
      <button type="button" data-fc-cancel style="flex-shrink:0;height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;font-weight:600">Cancel</button>
    </div>
    <div id="YMK-module" style="flex:1;width:100%;max-width:520px;display:flex;justify-content:center;align-items:flex-start"></div>
    <div style="padding:10px 16px 18px;font-size:12px;opacity:.65;text-align:center">YouCam guided camera · photos are only used to measure your hair</div>`;
  document.body.appendChild(root);
  return root;
}

function showOverlay(step: string, label: string, onCancel: () => void) {
  const root = overlay();
  root.querySelector<HTMLElement>("[data-fc-step]")!.textContent = step;
  root.querySelector<HTMLElement>("[data-fc-label]")!.textContent = label;
  root.querySelector<HTMLButtonElement>("[data-fc-cancel]")!.onclick = onCancel;
  root.style.display = "flex";
  document.documentElement.style.overflow = "hidden";
  // Inside an embed the overlay fills the iframe; ask the host page to bring
  // the top of the iframe into view (see public/embed.js).
  if (window.parent !== window) window.parent.postMessage({ type: "fairchair:focus" }, "*");
}

function hideOverlay() {
  const root = document.getElementById("fc-camera");
  if (root) root.style.display = "none";
  document.documentElement.style.overflow = "";
}

export function loadCameraKit(): Promise<YMKApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("Camera Kit runs in the browser"));
  overlay();
  loading ??= new Promise<YMKApi>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("The guided camera took too long to load.")), 20_000);
    const ready = () => {
      window.clearTimeout(timer);
      resolve(window.YMK!);
    };
    // The docs name the callback `YMKAsyncInit`, but sdk.js v2.5 calls
    // `window.ymkAsyncInit` (lower-case y). Define both.
    window.ymkAsyncInit = ready;
    window.YMKAsyncInit = ready;
    if (window.YMK && document.querySelector(`script[src="${SDK_URL}"]`)) return ready();
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("The guided camera couldn't load."));
    };
    document.body.appendChild(script);
  }).catch((e) => {
    loading = undefined;
    throw e;
  });
  return loading;
}

async function toBlob(image: unknown): Promise<Blob> {
  if (image instanceof Blob) return image;
  if (typeof image === "string") return (await fetch(image)).blob();
  throw new Error("Unexpected image from the camera");
}

const CAMERA_ERRORS: Record<string, string> = {
  error_permission_denied: "Camera permission was denied. Allow camera access, or upload photos instead.",
  error_access_failed: "The camera couldn't be opened. Close other apps using it, or upload photos instead.",
  error_resolution_unsupported: "This camera's resolution isn't supported. Upload photos instead.",
};

/**
 * Opens YouCam's guided camera in `mode` (full screen) and resolves with the
 * captured phases — only after the SDK has fully closed, so its `closed` event
 * can't leak into the next session and cancel it.
 */
export async function captureWithCameraKit(mode: CameraMode, ui: { step: string; label: string }): Promise<Captured[]> {
  const ymk = await loadCameraKit();
  // Let any previous session finish tearing down before opening a new one.
  await new Promise((r) => setTimeout(r, 250));
  return new Promise<Captured[]>((resolve, reject) => {
    const ids: number[] = [];
    let settled = false;
    let captured: Captured[] | undefined;
    let closeTimer: number | undefined;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(closeTimer);
      ids.splice(0).forEach((id) => ymk.removeEventListener(id));
      hideOverlay();
      fn();
    };
    // Resolve once the camera has closed (or after a safety timeout).
    const closeThenResolve = () => {
      ymk.close();
      closeTimer = window.setTimeout(() => finish(() => resolve(captured ?? [])), 1500);
    };
    ids.push(
      ymk.addEventListener("faceDetectionCaptured", async (payload) => {
        try {
          const images = (payload as { images?: { phase?: number; image: unknown; width?: number; height?: number }[] }).images ?? [];
          captured = (
            await Promise.all(
              images.map(async (img, i) => ({ phase: img.phase ?? i, blob: await toBlob(img.image), width: img.width ?? 0, height: img.height ?? 0 })),
            )
          ).sort((a, b) => a.phase - b.phase);
          closeThenResolve();
        } catch (e) {
          ymk.close();
          finish(() => reject(e));
        }
      }),
    );
    ids.push(
      ymk.addEventListener("cameraFailed", (code) => {
        ymk.close();
        finish(() => reject(new Error(CAMERA_ERRORS[String(code)] ?? "The camera couldn't start. Upload photos instead.")));
      }),
    );
    ids.push(
      ymk.addEventListener("closed", () =>
        // A close after a capture is the normal end of a step; otherwise the user cancelled.
        finish(() => (captured ? resolve(captured) : reject(new Error("closed")))),
      ),
    );

    showOverlay(ui.step, ui.label, () => {
      ymk.close();
      finish(() => reject(new Error("closed")));
    });
    // Size the live view to the overlay (the SDK accepts 300–1920 px).
    const width = Math.max(300, Math.min(520, window.innerWidth));
    const height = Math.max(300, Math.min(900, window.innerHeight - 140));
    ymk.init({ faceDetectionMode: mode, imageFormat: "base64", language: "enu", qualityLevel: "moderate", width, height });
    ymk.openCameraKit();
  });
}
