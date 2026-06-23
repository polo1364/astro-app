import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const source = path.resolve(process.cwd(), "../PWA.png");
const outDir = path.resolve(process.cwd(), "public/pwa");

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180 },
];

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const item of sizes) {
    const output = path.join(outDir, item.name);
    let pipeline = sharp(source).resize(item.size, item.size, {
      fit: "contain",
      background: { r: 5, g: 4, b: 11, alpha: 1 },
    });

    if ("maskable" in item && item.maskable) {
      const padding = Math.round(item.size * 0.1);
      const inner = item.size - padding * 2;
      pipeline = sharp(source)
        .resize(inner, inner, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 5, g: 4, b: 11, alpha: 1 },
        });
    }

    await pipeline.png().toFile(output);
    console.log(`wrote ${output}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
