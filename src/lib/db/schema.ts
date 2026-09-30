import { boolean, integer, jsonb, pgTable, real, serial, text, timestamp, index } from "drizzle-orm/pg-core";


import type { Measurements } from "@/lib/hair/measurements";
import type { Quote, QuoteOptions, Service } from "@/lib/pricing/types";

export const studios = pgTable("studios", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull().default(""),
  currency: text("currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("America/New_York"),
  hourlyRate: integer("hourly_rate").notNull(),
  depositPct: real("deposit_pct").notNull().default(0.25),
  priceByTime: boolean("price_by_time").notNull().default(true),
  services: jsonb("services").$type<Service[]>().notNull(),
  adminTokenHash: text("admin_token_hash").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AnalysisSource = "live" | "replay" | "sample";

export const analyses = pgTable("analyses", {
  id: text("id").primaryKey(),
  studioId: text("studio_id").notNull(),
  source: text("source").$type<AnalysisSource>().notNull(),
  status: text("status").$type<"running" | "done" | "failed">().notNull(),
  /** sha256 per capture view (front/right/left/down). */
  imageHashes: jsonb("image_hashes").$type<Record<string, string>>().notNull(),
  /** YouCam file ids per view, kept only so a failed task can be retried. */
  fileIds: jsonb("file_ids").$type<Record<string, string>>().notNull().default({}),
  measurements: jsonb("measurements").$type<Measurements>().notNull().default({}),
  demoClientId: text("demo_client_id"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analysisTasks = pgTable(
  "analysis_tasks",
  {
    id: serial("id").primaryKey(),
    analysisId: text("analysis_id").notNull(),
    feature: text("feature").notNull(),
    youcamTaskId: text("youcam_task_id"),
    status: text("status").$type<"running" | "success" | "error">().notNull(),
    raw: jsonb("raw"),
    errorCode: text("error_code"),
    units: integer("units").notNull().default(0),
    attempts: integer("attempts").notNull().default(1),
    cached: boolean("cached").notNull().default(false),
    upstreamDeleted: boolean("upstream_deleted").notNull().default(false),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("analysis_tasks_analysis_idx").on(t.analysisId)],
);

export const quotes = pgTable("quotes", {
  id: text("id").primaryKey(),
  studioId: text("studio_id").notNull(),
  serviceId: text("service_id").notNull(),
  analysisId: text("analysis_id"),
  clientName: text("client_name").notNull().default(""),
  options: jsonb("options").$type<QuoteOptions>().notNull(),
  measurements: jsonb("measurements").$type<Measurements>().notNull(),
  result: jsonb("result").$type<Quote>().notNull(),
  source: text("source").$type<AnalysisSource>().notNull(),
  receiptHash: text("receipt_hash").notNull(),
  status: text("status").$type<"quoted" | "booked" | "completed">().notNull().default("quoted"),
  startAt: timestamp("start_at", { withTimezone: true }),
  actualMinutes: integer("actual_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const resultCache = pgTable("result_cache", {
  key: text("key").primaryKey(),
  raw: jsonb("raw").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usageLedger = pgTable("usage_ledger", {
  id: serial("id").primaryKey(),
  feature: text("feature").notNull(),
  units: integer("units").notNull(),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  studioId: text("studio_id"),
  props: jsonb("props").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Small images owned by a studio (portfolio photos used as try-on references). */
export const assets = pgTable(
  "assets",
  {
    id: text("id").primaryKey(),
    studioId: text("studio_id").notNull(),
    contentType: text("content_type").notNull(),
    /** Image bytes, base64 (portable across the Neon HTTP and PGlite drivers). */
    data: text("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("assets_studio_idx").on(t.studioId)],
);

/** Hair-extension stores using the "Find my match" widget. */
export const shops = pgTable("shops", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  platform: text("platform").$type<"shopify" | "demo">().notNull(),
  /** Storefront domain used for cart permalinks. */
  domain: text("domain").notNull(),
  productUrl: text("product_url").notNull(),
  product: jsonb("product").$type<import("@/lib/matching/extensions").Product>().notNull(),
  settings: jsonb("settings").$type<import("@/lib/matching/extensions").MatchSettings>().notNull(),
  adminTokenHash: text("admin_token_hash").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
