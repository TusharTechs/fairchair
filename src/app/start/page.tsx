import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui";
import { StartForm } from "./start-form";

export const metadata: Metadata = { title: "Set up your studio" };

export default function StartPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-8 sm:px-6">
        <StartForm />
      </main>
    </>
  );
}
