// YouCam JS Camera Kit (v2.5): guided capture with live face-quality checks.
// No API key is used in the browser; captured photos are uploaded through our
// server like any other photo. Docs: docs.perfectcorp.com → "JS Camera Kit".

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

export function loadCameraKit(): Promise<YMKApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("Camera Kit runs in the browser"));
  loading ??= new Promise<YMKApi>((resolve, reject) => {
    if (!document.getElementById("YMK-module")) {
      const mount = document.createElement("div");
      mount.id = "YMK-module";
      document.body.appendChild(mount);
    }
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

/** Opens YouCam's guided camera in `mode` and resolves with the captured phases. */
export async function captureWithCameraKit(mode: CameraMode): Promise<Captured[]> {
  const ymk = await loadCameraKit();
  return new Promise<Captured[]>((resolve, reject) => {
    const ids: number[] = [];
    const cleanup = () => ids.splice(0).forEach((id) => ymk.removeEventListener(id));
    ids.push(
      ymk.addEventListener("faceDetectionCaptured", async (payload) => {
        cleanup();
        ymk.close();
        try {
          const images = (payload as { images?: { phase?: number; image: unknown; width?: number; height?: number }[] }).images ?? [];
          const out = await Promise.all(
            images.map(async (img, i) => ({ phase: img.phase ?? i, blob: await toBlob(img.image), width: img.width ?? 0, height: img.height ?? 0 })),
          );
          resolve(out.sort((a, b) => a.phase - b.phase));
        } catch (e) {
          reject(e);
        }
      }),
    );
    ids.push(
      ymk.addEventListener("cameraFailed", (code) => {
        cleanup();
        ymk.close();
        reject(new Error(CAMERA_ERRORS[String(code)] ?? "The camera couldn't start. Upload photos instead."));
      }),
    );
    ids.push(
      ymk.addEventListener("closed", () => {
        cleanup();
        reject(new Error("closed"));
      }),
    );
    ymk.init({ faceDetectionMode: mode, imageFormat: "base64", language: "enu", qualityLevel: "moderate" });
    ymk.openCameraKit();
  });
}
