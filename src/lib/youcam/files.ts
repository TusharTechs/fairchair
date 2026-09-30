import "server-only";
import { YouCamError } from "./errors";
import { youcamFetch } from "./http";

type FileInitResponse = {
  data?: {
    files?: {
      file_id?: string;
      requests?: { url?: string; method?: string; headers?: Record<string, string> }[];
    }[];
  };
};

// Official upload flow: register the file, PUT the bytes to the presigned
// URL with the exact headers returned, then reference it by file_id.
export async function uploadImage(bytes: Uint8Array, contentType: "image/jpeg" | "image/png", fileName: string) {
  const init = await youcamFetch<FileInitResponse>("/s2s/v2.0/file", {
    method: "POST",
    body: { files: [{ content_type: contentType, file_name: fileName, file_size: bytes.byteLength }] },
  });
  const file = init.data?.files?.[0];
  const req = file?.requests?.[0];
  if (!file?.file_id || !req?.url) {
    throw new YouCamError({ code: "malformed_response", message: "Upload init missing file_id or URL" });
  }

  const put = await fetch(req.url, {
    method: req.method ?? "PUT",
    headers: req.headers ?? { "Content-Type": contentType },
    body: Buffer.from(bytes),
  });
  if (!put.ok) {
    throw new YouCamError({
      code: "request_failed",
      status: put.status,
      message: `Presigned upload failed (${put.status})`,
      retryable: put.status >= 500,
    });
  }
  return file.file_id;
}
