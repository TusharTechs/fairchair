import { describe, expect, it } from "vitest";
import { DEMO_SHOP_PRODUCT_JSON } from "@/data/demo-shop";
import { densityFromResult, hairTypeFromMapping, lengthFromTerm, type Measurements } from "@/lib/hair/measurements";
import { cartPermalink, matchExtensions, productFromShopifyJson, tryOnTemplateFor } from "../extensions";

const product = productFromShopifyJson(DEMO_SHOP_PRODUCT_JSON);
const coily: Measurements = {
  type: hairTypeFromMapping("4B to 4C"),
  density: densityFromResult("2.71", "High Density"),
  length: lengthFromTerm("short hair"),
  color: { kind: "color", hex: "#000000" },
};

describe("Shopify product JSON", () => {
  it("parses option objects and option1..3 variants", () => {
    expect(product.optionNames).toEqual(["Texture", "Length", "Color"]);
    expect(product.variants).toHaveLength(84);
    expect(product.variants[0]).toMatchObject({ options: ["Silky Straight", '16"', "#1 Jet Black"], price: 8900 });
  });
  it("also parses string option names and variant.options arrays", () => {
    const p = productFromShopifyJson({ title: "X", options: ["Length"], variants: [{ id: 1, options: ['18"'], price: 5000 }] });
    expect(p.variants[0]).toMatchObject({ id: "1", options: ['18"'], price: 5000, available: true });
  });
  it("rejects things that aren't products", () => {
    expect(() => productFromShopifyJson({ hello: "world" })).toThrow();
  });
});

describe("matching", () => {
  it("matches texture, length (with shrinkage) and packs to measurements, shade to the shopper's choice", () => {
    const m = matchExtensions(product, { ...coily, color: undefined }, 18, undefined, "black");
    expect(m.variant?.options).toEqual(["Kinky Straight", '20"', "#1 Jet Black"]);
    expect(m.quantity).toBe(7);
    expect(m.shadeOptions).toEqual(["#1 Jet Black", "#1B Off Black"]);
    expect(m.reasons.filter((r) => r.measured).map((r) => r.what)).toEqual(["Texture", "Length", "Packs"]);
    expect(m.reasons.find((r) => r.what === "Shade")?.because).toMatch(/^You chose: Black/);
    expect(m.tryOnTemplate).toBe("all_length_2_");
  });

  it("adds no shrinkage allowance for straight hair", () => {
    const straight = { ...coily, type: hairTypeFromMapping("1 to 2a") };
    expect(matchExtensions(product, straight, 18).variant?.options.slice(0, 2)).toEqual(["Silky Straight", '20"']);
    expect(matchExtensions(product, straight, 16).variant?.options[1]).toBe('16"');
  });

  it("does not claim a shade it can't measure", () => {
    const m = matchExtensions(product, { ...coily, color: undefined }, 18);
    expect(m.reasons.some((r) => r.what === "Shade")).toBe(false);
    expect(m.warnings.join(" ")).toMatch(/swatch/);
  });

  it("skips sold-out variants", () => {
    const blonde = { ...coily, type: hairTypeFromMapping("3b to 3c"), color: { kind: "color" as const, hex: "#FAF0BE" } };
    const m = matchExtensions(product, blonde, 20, undefined, "blonde");
    expect(m.variant?.available).toBe(true);
    expect(m.variant?.options[2]).not.toBe("#613 Blonde"); // Kinky Curly #613 is sold out
  });

  it("builds Shopify cart permalinks and try-on templates", () => {
    expect(cartPermalink("shop.example.com", "123", 6)).toBe("https://shop.example.com/cart/123:6");
    expect([16, 20, 24].map(tryOnTemplateFor)).toEqual(["all_length_1", "all_length_2_", "all_length_3"]);
  });
});
