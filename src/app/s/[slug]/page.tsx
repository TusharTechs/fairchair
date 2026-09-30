import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_CLIENTS } from "@/data/demo-clients";
import { SiteHeader } from "@/components/ui";
import { studioBySlug } from "@/lib/studios";
import { QuoteFlow } from "./quote-flow";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const found = await studioBySlug(slug);
  return { title: found ? `Get a quote — ${found.studio.name}` : "Studio not found" };
}

export default async function StudioQuotePage(props: PageProps<"/s/[slug]">) {
  const { slug } = await props.params;
  const found = await studioBySlug(slug);
  if (!found) notFound();
  const demos = DEMO_CLIENTS.map(({ id, name, blurb, photo, source, recordedAt }) => ({ id, name, blurb, photo, source, recordedAt }));
  return (
    <>
      <SiteHeader right={<span className="text-sm text-muted">Quote for {found.studio.name}</span>} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-6 sm:px-6">
        <QuoteFlow studio={found.studio} demos={demos} />
      </main>
    </>
  );
}
