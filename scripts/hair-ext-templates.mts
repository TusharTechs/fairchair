// Lists YouCam hair-extension try-on templates (free; no units).
import { api } from "./lib/youcam.mjs";
let token: string | undefined;
const all: unknown[] = [];
do {
  const r = await api<{ data?: { templates?: unknown[]; next_token?: string } }>(
    `/s2s/v2.0/task/template/hair-ext?page_size=20${token ? `&starting_token=${encodeURIComponent(token)}` : ""}`,
  );
  all.push(...(r.data?.templates ?? []));
  token = r.data?.next_token || undefined;
} while (token && all.length < 200);
console.log(JSON.stringify(all, null, 1));
