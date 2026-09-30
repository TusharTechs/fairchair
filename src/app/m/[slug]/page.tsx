import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/ui";
import { DEMO_CLIENTS } from "@/data/demo-clients";
import { shopBySlug } from "@/lib/shops";
import { MatchFlow } from "./match-flow";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/m/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const found = await shopBySlug(slug);
  return { title: found ? `Find your match — ${found.shop.name}` : "Store not found" };
}

export default async function MatchPage(props: PageProps<"/m/[slug]">) {
  const { slug } = await props.params;
  const found = await shopBySlug(slug);
  if (!found) notFound();
  const { shop } = found;
  const demos = DEMO_CLIENTS.map(({ id, name, blurb, photo, source, recordedAt }) => ({ id, name, blurb, photo, source, recordedAt }));
  return (
    <>
      <SiteHeader right={<span className="text-sm text-muted">{shop.name}</span>} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-6 sm:px-6">
        <MatchFlow
          shop={{ slug: shop.slug, name: shop.name, domain: shop.domain, isDemo: shop.isDemo, product: shop.product, settings: shop.settings }}
          demos={demos}
        />
      </main>
    </>
  );
}
