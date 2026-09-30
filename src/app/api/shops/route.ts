import { z } from "zod";
import { track } from "@/lib/events";
import { json, problem } from "@/lib/http";
import { createShop } from "@/lib/shops";

export const runtime = "nodejs";

const Body = z.object({ name: z.string().trim().min(2).max(60), productUrl: z.string().trim().url().max(500) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return problem(400, "bad_request", "Enter your store name and a product link.");
  try {
    const { slug, token, product } = await createShop(parsed.data);
    await track("shop_created", null, { variants: product.variants.length });
    return json({
      slug,
      token,
      product: { title: product.title, optionNames: product.optionNames, variants: product.variants.length },
    });
  } catch (e) {
    return problem(422, "unreadable_product", (e as Error).message);
  }
}
