import type { Metadata } from "next";
import { TwoHeads } from "@/components/two-heads";
import { ButtonLink, Eyebrow, SiteHeader } from "@/components/ui";
import { DEMO_STUDIO_SLUG } from "@/lib/db/seed";
import { studioBySlug } from "@/lib/studios";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Same style, two heads" };

export default async function ComparePage() {
  const { studio } = (await studioBySlug(DEMO_STUDIO_SLUG))!;
  return (
    <>
      <SiteHeader right={<ButtonLink href={`/s/${DEMO_STUDIO_SLUG}`}>Get a quote</ButtonLink>} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-6">
        <Eyebrow>Amara Braids &amp; Co. · medium knotless, mid-back</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-normal leading-tight">Same style. Two heads. Two honest quotes.</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-2">
          Each head measured by YouCam Hair AI, priced with the stylist&apos;s own rules. Highlighted lines are where the two quotes differ.
        </p>
        <div className="mt-8">
          <TwoHeads studio={studio} serviceId="knotless" options={{ size: "medium", length: "mid-back" }} />
        </div>
      </main>
    </>
  );
}
