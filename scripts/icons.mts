// Renders the FairChair mark to favicon.ico (16/32/48 px PNG entries) and
// apple-icon.png (180 px) from the same SVG as src/app/icon.svg.
//   node --import tsx scripts/icons.mts
import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

const svg = await readFile("src/app/icon.svg", "utf8");
const png = (size: number, source = svg) =>
  Buffer.from(new Resvg(source, { fitTo: { mode: "width", value: size } }).render().asPng());

// ICO container with embedded PNGs (supported by all current browsers).
function ico(images: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

await writeFile("src/app/favicon.ico", ico([16, 32, 48].map((size) => ({ size, data: png(size) }))));
// iOS applies its own rounded mask, so the touch icon is a full-bleed square.
await writeFile("src/app/apple-icon.png", png(180, svg.replace('rx="16"', 'rx="0"')));
console.log("wrote src/app/favicon.ico and src/app/apple-icon.png");
