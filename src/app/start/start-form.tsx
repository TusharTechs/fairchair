"use client";

import { useState, useSyncExternalStore } from "react";
import { Button, ButtonLink, Card, Eyebrow, cx } from "@/components/ui";
import { TEMPLATES } from "@/lib/pricing/templates";
import type { ServiceTemplateId } from "@/lib/pricing/types";

const TEMPLATE_IDS = Object.keys(TEMPLATES) as ServiceTemplateId[];
const ZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "Europe/London", "Africa/Lagos"];

export function StartForm() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rate, setRate] = useState(40);
  const [deposit, setDeposit] = useState(25);
  // Default to the browser's timezone (server render uses a fixed fallback).
  const browserZone = useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    () => "America/New_York",
  );
  const [chosenZone, setTimezone] = useState<string>();
  const timezone = chosenZone ?? browserZone;
  const [picked, setPicked] = useState<ServiceTemplateId[]>(["knotless"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<{ slug: string; token: string }>();

  if (created) {
    const origin = window.location.origin;
    return (
      <section className="rise flex flex-col gap-5">
        <Eyebrow>You&apos;re set up</Eyebrow>
        <h1 className="font-display text-3xl font-normal">{name} is ready for honest quotes.</h1>
        <Card className="p-5">
          <p className="text-sm font-semibold">Client link — put this in your bio</p>
          <p className="mt-2 break-all rounded-xl bg-surface-2 px-3 py-2 font-mono text-sm">{`${origin}/s/${created.slug}`}</p>
        </Card>
        <Card className="border-accent/40 p-5">
          <p className="text-sm font-semibold">Your private studio link — save it now</p>
          <p className="mt-1 text-sm text-ink-2">This is the only way back into your studio. Anyone with it can edit your prices.</p>
          <p className="mt-2 break-all rounded-xl bg-surface-2 px-3 py-2 font-mono text-sm">{`${origin}/studio/${created.slug}?key=${created.token}`}</p>
        </Card>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/studio/${created.slug}?key=${created.token}`} size="lg">
            Open my studio
          </ButtonLink>
          <ButtonLink href={`/s/${created.slug}`} size="lg" variant="secondary">
            Try my client link
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <section className="rise flex flex-col gap-6">
      <div>
        <Eyebrow>Three minutes</Eyebrow>
        <h1 className="mt-2 font-display text-3xl font-normal">Set up your studio</h1>
        <p className="mt-2 text-ink-2">Start from a template menu, then tune every price and minute to how you actually work.</p>
      </div>
      <Card className="flex flex-col gap-4 p-5">
        <Field label="Studio name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Crowned by Kemi" />
        </Field>
        <Field label="City">
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="e.g. Houston, TX" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Hourly rate ($)">
            <input type="number" min={10} max={500} value={rate} onChange={(e) => setRate(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Deposit (%)">
            <input type="number" min={0} max={100} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Timezone">
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
              {[...new Set([timezone, ...ZONES])].map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-xs text-muted">Your hourly rate turns measured extra time into price. Texture never adds a flat fee.</p>
      </Card>
      <div>
        <p className="mb-2 text-sm font-semibold">Services you offer</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMPLATE_IDS.map((id) => {
            const t = TEMPLATES[id]();
            const on = picked.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked((p) => (on ? p.filter((x) => x !== id) : [...p, id]))}
                className={cx("rounded-2xl border bg-surface p-4 text-left", on ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong")}
              >
                <p className="font-display font-normal">{t.name}</p>
                <p className="text-sm text-ink-2">{t.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button
        size="lg"
        disabled={busy || name.trim().length < 2 || !picked.length}
        onClick={async () => {
          setBusy(true);
          setError(undefined);
          const res = await fetch("/api/studios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, city, hourlyRate: rate, depositPct: deposit / 100, timezone, templates: picked }),
          });
          const data = await res.json().catch(() => ({}));
          setBusy(false);
          if (!res.ok) return setError(data?.error?.message ?? "Couldn't create the studio.");
          setCreated(data);
        }}
      >
        Create studio
      </Button>
    </section>
  );
}

const inputCls = "h-11 w-full rounded-xl border border-line-strong bg-bg px-3 text-[0.95rem] outline-none focus:border-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}
