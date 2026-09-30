// Client-side photo preparation: decode, orient, downscale (≤1600 px long
// side) and re-encode as JPEG. Re-encoding strips EXIF metadata (including
// location) before anything leaves the phone. YouCam's multi-angle hair
// detectors require every view to be the same size, so side views can be
// cover-fitted to the front photo's exact dimensions.

export type Prepared = { blob: Blob; width: number; height: number };

export async function prepareImage(file: File, opts: { maxSide?: number; size?: { width: number; height: number } } = {}): Promise<Prepared> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("We couldn't open that photo. Try a JPG or PNG from your camera.");
  }
  let width: number;
  let height: number;
  if (opts.size) {
    ({ width, height } = opts.size);
  } else {
    const scale = Math.min(1, (opts.maxSide ?? 1600) / Math.max(bitmap.width, bitmap.height));
    width = Math.round(bitmap.width * scale);
    height = Math.round(bitmap.height * scale);
  }
  if (Math.min(width, height) < 480) {
    bitmap.close();
    throw new Error("That photo is too small. Use your phone's main camera.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  // Cover-fit: fill the target size, cropping the overflow evenly.
  const s = Math.max(width / bitmap.width, height / bitmap.height);
  const dw = bitmap.width * s;
  const dh = bitmap.height * s;
  canvas.getContext("2d")!.drawImage(bitmap, (width - dw) / 2, (height - dh) / 2, dw, dh);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new Error("We couldn't process that photo.");
  return { blob, width, height };
}
