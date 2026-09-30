import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_CLIENTS } from "@/data/demo-clients";
import { QuoteFlow } from "@/app/s/[slug]/quote-flow";
import { studioBySlug } from "@/lib/studios";
import { EmbedResizer } from "./resizer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Get a quote", robots: { index: false } };

// Chrome-less quote flow for embedding on a stylist's own website:
//   <iframe src="https://…/embed/<studio>" allow="camera" …>
export default async function EmbedPage(props: PageProps<"/embed/[slug]">) {
  const { slug } = await props.params;
  const found = await studioBySlug(slug);
  if (!found) notFound();
  const demos = DEMO_CLIENTS.map(({ id, name, blurb, photo, source, recordedAt }) => ({ id, name, blurb, photo, source, recordedAt }));
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <EmbedResizer />
      <QuoteFlow studio={found.studio} demos={demos} />
      <p className="mt-6 text-center text-[0.7rem] text-muted">
        Honest quotes by{" "}
        <a href="/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          FairChair
        </a>{" "}
        · hair measured with YouCam
      </p>
    </main>
  );
}
