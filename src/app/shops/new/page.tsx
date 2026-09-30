import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/ui";
import { ShopForm } from "./shop-form";

export const metadata: Metadata = { title: "Add Find my match to your store" };

export default function NewShopPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-8 sm:px-6">
        <ShopForm />
      </main>
      <SiteFooter />
    </>
  );
}
