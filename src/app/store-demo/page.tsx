import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { DEMO_SHOP, DEMO_SHOP_PRODUCT_JSON } from "@/data/demo-shop";

export const metadata: Metadata = { title: "Demo store — Find my match" };

// A fictional storefront product page showing how an extension store embeds
// FairChair with one snippet (the same embed.js a Shopify Custom Liquid block uses).
export default function StoreDemoPage() {
  const options = DEMO_SHOP_PRODUCT_JSON.options;
  return (
    <div className="min-h-full bg-[#fbfaf8] text-[#1a1a1a] dark:bg-[#111] dark:text-[#eee]">
      <div className="bg-ink px-4 py-2 text-center text-xs text-surface">
        Demo storefront (fictional store) showing how a Shopify store embeds FairChair.{" "}
        <Link href="/shops/new" className="underline underline-offset-2">
          Add it to your store
        </Link>{" "}
        · <Link href="/" className="underline underline-offset-2">FairChair home</Link>
      </div>
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="font-serif text-lg tracking-wide">{DEMO_SHOP.name}</span>
          <nav className="flex gap-5 text-sm opacity-70">
            <span>Tape-ins</span>
            <span>Wefts</span>
            <span>Wigs</span>
          </nav>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/demo/store/product.jpg" alt="Tape-in hair extensions" className="aspect-square w-full rounded-lg object-cover" />
        <div>
          <h1 className="font-serif text-3xl">{DEMO_SHOP_PRODUCT_JSON.title}</h1>
          <p className="mt-2 text-lg">From $89.00</p>
          <div className="mt-6 space-y-4">
            {options.map((o) => (
              <div key={o.name}>
                <p className="text-sm font-medium">{o.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {o.values.map((v) => (
                    <span key={v} className="rounded-full border border-black/20 px-3 py-1 text-sm dark:border-white/20">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" disabled className="mt-6 h-12 w-full rounded-full bg-black/80 text-white opacity-60">
            Add to cart
          </button>
          <p className="mt-3 text-sm opacity-70">
            Not sure which texture, length or how many packs? <a href="#match" className="underline">Find your match below ↓</a>
          </p>
        </div>
      </main>
      <section id="match" className="mx-auto max-w-3xl scroll-mt-10 px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-black">
          <div data-fairchair-shop={DEMO_SHOP.slug} />
        </div>
      </section>
      <Script src="/embed.js" strategy="afterInteractive" />
    </div>
  );
}
