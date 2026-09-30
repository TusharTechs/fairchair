import "server-only";

export type YouCamConfig = {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  creditReserve: number;
  liveDailyCapPerIp: number;
};

export function youcamConfigured(): boolean {
  return Boolean(process.env.YOUCAM_API_KEY);
}

export function getYouCamConfig(): YouCamConfig {
  const apiKey = process.env.YOUCAM_API_KEY;
  if (!apiKey) throw new Error("YOUCAM_API_KEY is not set");
  return {
    apiKey,
    baseUrl: process.env.YOUCAM_BASE_URL || "https://yce-api-01.makeupar.com",
    timeoutMs: Number(process.env.YOUCAM_TIMEOUT_MS || 30_000),
    creditReserve: Number(process.env.CREDIT_RESERVE || 200),
    liveDailyCapPerIp: Number(process.env.LIVE_DAILY_CAP_PER_IP || 3),
  };
}
