// A fictional tape-in extension product in the exact shape of Shopify's public
// product JSON (/products/<handle>.js), used for the demo store. Real stores
// are read live from their own storefront.

const TEXTURES = ["Silky Straight", "Body Wave", "Kinky Straight", "Kinky Curly"];
const LENGTHS = ['16"', '20"', '24"'];
const COLOURS = ["#1 Jet Black", "#1B Off Black", "#2 Darkest Brown", "#4 Dark Brown", "#27 Honey Blonde", "#613 Blonde", "#30 Auburn"];
const PRICE: Record<string, string> = { '16"': "89.00", '20"': "109.00", '24"': "129.00" };

let n = 0;
export const DEMO_SHOP_PRODUCT_JSON = {
  handle: "tape-in-extensions",
  title: "Tape-in Extensions (10 pieces / pack)",
  options: [
    { name: "Texture", position: 1, values: TEXTURES },
    { name: "Length", position: 2, values: LENGTHS },
    { name: "Color", position: 3, values: COLOURS },
  ],
  variants: TEXTURES.flatMap((t) =>
    LENGTHS.flatMap((l) =>
      COLOURS.map((c) => ({
        id: 900000 + n++,
        title: `${t} / ${l} / ${c}`,
        option1: t,
        option2: l,
        option3: c,
        price: PRICE[l],
        available: !(t === "Kinky Curly" && c === "#613 Blonde"),
      })),
    ),
  ),
};

export const DEMO_SHOP = {
  slug: "demo-extensions",
  name: "Demo Extensions Store",
  domain: "demo-extensions.example",
};
