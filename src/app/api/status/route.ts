import { liveStatus } from "@/lib/analysis/service";
import { clientIpHash, json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const status = await liveStatus(clientIpHash(req));
  return json({ live: status.available, reason: status.available ? null : status.reason });
}
