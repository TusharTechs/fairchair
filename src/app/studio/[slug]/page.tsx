import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, SiteHeader } from "@/components/ui";
import { listQuotes } from "@/lib/quotes";
import { authorizeStudio } from "@/lib/studios";
import { Dashboard } from "./dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio", robots: { index: false } };

export default async function StudioPage(props: PageProps<"/studio/[slug]">) {
  const { slug } = await props.params;
  const { key } = await props.searchParams;
  const token = typeof key === "string" ? key : undefined;
  const studio = await authorizeStudio(slug, token);
  if (!studio) notFound();
  const quotes = await listQuotes(studio.id);

  return (
    <>
      <SiteHeader
        right={
          <ButtonLink href={`/s/${studio.slug}`} variant="secondary" target="_blank">
            Open client link ↗
          </ButtonLink>
        }
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6 sm:px-6">
        <Dashboard
          studio={studio}
          token={token!}
          isDemo={(studio as { isDemo?: boolean }).isDemo ?? false}
          quotes={quotes.map((q) => ({
            id: q.id,
            clientName: q.clientName,
            serviceId: q.serviceId,
            options: q.options,
            measurements: q.measurements,
            result: q.result,
            source: q.source,
            status: q.status,
            startAt: q.startAt ? q.startAt.toISOString() : null,
            actualMinutes: q.actualMinutes,
            createdAt: q.createdAt.toISOString(),
            receiptHash: q.receiptHash,
          }))}
        />
      </main>
    </>
  );
}
