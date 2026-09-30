// Verifies YOUCAM_API_KEY without spending units: reads the credit balance
// and the per-feature cost table. Never prints the key.
const key = process.env.YOUCAM_API_KEY;
const base = process.env.YOUCAM_BASE_URL || "https://yce-api-01.makeupar.com";
if (!key) {
  console.error("YOUCAM_API_KEY is not set in .env.local");
  process.exit(1);
}
const headers = { Authorization: `Bearer ${key}` };

const credit = await fetch(`${base}/s2s/v1.0/client/credit`, { headers });
console.log("credit endpoint:", credit.status);
if (!credit.ok) {
  console.error((await credit.text()).slice(0, 300));
  process.exit(1);
}
const c = (await credit.json()) as { results?: { type?: string; amount_dec?: number; amount?: number; expiry?: number }[] };
for (const r of c.results ?? []) {
  console.log(`  ${r.type ?? "units"}: ${r.amount_dec ?? r.amount} (expires ${r.expiry ? new Date(r.expiry).toISOString().slice(0, 10) : "n/a"})`);
}

const cost = await fetch(`${base}/s2s/v2.0/credit/feature-cost?page_size=200`, { headers });
if (cost.ok) {
  const j = (await cost.json()) as { result?: { skus?: { description?: string; amount?: number; run_task_url?: string }[] } };
  const wanted = /hair|skin-tone/;
  for (const s of j.result?.skus ?? []) if (wanted.test(s.run_task_url ?? "")) console.log(`  ${s.amount} units  ${s.run_task_url}`);
}
