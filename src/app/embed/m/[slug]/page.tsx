import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchFlow } from "@/app/m/[slug]/match-flow";
import { DEMO_CLIENTS } from "@/data/demo-clients";
import { shopBySlug } from "@/lib/shops";
import { EmbedResizer } from "../../[slug]/resizer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find your match", robots: { index: false } };

// Chrome-less match flow for a store's product page (Shopify Custom Liquid block, etc.).
export default async function EmbedMatchPage(props: PageProps<"/embed/m/[slug]">) {
  const { slug } = await props.params;
  const found = await shopBySlug(slug);
  if (!found) notFound();
  const { shop } = found;
  const demos = DEMO_CLIENTS.map(({ id, name, blurb, photo, source, recordedAt }) => ({ id, name, blurb, photo, source, recordedAt }));
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <EmbedResizer />
      <MatchFlow
        shop={{ slug: shop.slug, name: shop.name, domain: shop.domain, isDemo: shop.isDemo, product: shop.product, settings: shop.settings }}
        demos={demos}
      />
      <p className="mt-6 text-center text-[0.7rem] text-muted">
        Hair matching by{" "}
        <a href="/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          FairChair
        </a>{" "}
        · measured with YouCam
      </p>
    </main>
  );
}
