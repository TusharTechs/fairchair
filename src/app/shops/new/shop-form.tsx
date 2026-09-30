"use client";

import { useState, useSyncExternalStore } from "react";
import { Button, ButtonLink, Card, Eyebrow } from "@/components/ui";

type Created = { slug: string; token: string; product: { title: string; optionNames: string[]; variants: number } };

export function ShopForm() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<Created>();
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  if (created) {
    const snippet = `<div data-fairchair-shop="${created.slug}"></div>\n<script src="${origin}/embed.js" async></script>`;
    const detected = created.product.optionNames;
    const missing = ["texture", "length", "colou?r|shade"].filter((k) => !detected.some((n) => new RegExp(k, "i").test(n)));
    return (
      <section className="rise flex flex-col gap-5">
        <Eyebrow>Connected</Eyebrow>
        <h1 className="font-display text-3xl font-normal">{created.product.title}</h1>
        <p className="text-ink-2">
          Read {created.product.variants} variants with options <strong>{detected.join(" · ") || "none"}</strong> straight from your storefront.
          {missing.length ? ` Tip: an option named Texture, Length or Color lets FairChair match more precisely.` : ""}
        </p>
        <Card className="p-5">
          <p className="text-sm font-semibold">Add it to your product page</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-2">
            <li>Shopify admin → Online Store → Themes → Customize.</li>
            <li>Open this product&apos;s template → Add block → <strong>Custom Liquid</strong>.</li>
            <li>Paste the code below and save. No app to install.</li>
          </ol>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-2 px-3 py-2 font-mono text-xs">{snippet}</pre>
          <Button className="mt-3" variant="secondary" onClick={() => navigator.clipboard.writeText(snippet)}>
            Copy code
          </Button>
        </Card>
        <Card className="p-5 text-sm text-ink-2">
          <p className="font-semibold text-ink">How checkout works</p>
          <p className="mt-1">
            When a shopper accepts their match, FairChair opens your store&apos;s own Shopify cart link with the matched variant and pack count
            (<span className="font-mono">/cart/&lt;variant&gt;:&lt;packs&gt;</span>). Orders, payment and inventory stay in Shopify.
          </p>
        </Card>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/m/${created.slug}`} size="lg">
            Try your widget
          </ButtonLink>
        </div>
        <p className="text-xs text-muted">Private admin key (keep it safe): <span className="font-mono">{created.token}</span></p>
      </section>
    );
  }

  return (
    <section className="rise flex flex-col gap-6">
      <div>
        <Eyebrow>For hair-extension & wig stores</Eyebrow>
        <h1 className="mt-2 font-display text-3xl font-normal">Add “Find my match” to your store</h1>
        <p className="mt-2 text-ink-2">
          Shoppers take four selfies; YouCam Hair AI measures texture, fullness and length; FairChair picks the right variant and pack count from
          your own product and sends them to your Shopify checkout. Opened hair can&apos;t be returned — so fewer wrong orders matter.
        </p>
      </div>
      <Card className="flex flex-col gap-4 p-5">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Store name
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Kemi's Hair Studio Shop" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Shopify product link
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputCls}
            placeholder="https://yourstore.com/products/tape-in-extensions"
            inputMode="url"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button
          size="lg"
          disabled={busy || name.trim().length < 2 || !url.trim()}
          onClick={async () => {
            setBusy(true);
            setError(undefined);
            const res = await fetch("/api/shops", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, productUrl: url }),
            });
            const data = await res.json().catch(() => ({}));
            setBusy(false);
            if (!res.ok) return setError(data?.error?.message ?? "Couldn't connect that product.");
            setCreated(data);
          }}
        >
          {busy ? "Reading your product…" : "Connect product"}
        </Button>
      </Card>
      <p className="text-sm text-muted">
        Just looking? <a href="/store-demo" className="underline underline-offset-2">See it on a demo store</a>.
      </p>
    </section>
  );
}

const inputCls = "h-11 w-full rounded-xl border border-line-strong bg-bg px-3 text-[0.95rem] font-normal outline-none focus:border-ink";
