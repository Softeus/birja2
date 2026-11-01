#!/usr/bin/env node
// Скриншот узла Pixso в файл. usage: node scripts/ds/shot.mjs <guid> [out.png]
import { writeFile, mkdir } from "node:fs/promises";
import { withPixso } from "../lib/mcp.mjs";

const guid = process.argv[2];
const out = process.argv[3] ?? `_meta/shots/${guid.replace(":", "-")}.png`;
if (!guid) {
  console.error("usage: node scripts/ds/shot.mjs <guid> [out.png]");
  process.exit(2);
}

const result = await withPixso(async (pixso) => pixso.callResult("get_screenshot", { guid }));

const blocks = result?.content ?? [];
const image = blocks.find((b) => b.type === "image" || b.type === "image_url");
if (!image) {
  console.error("нет изображения в ответе:", JSON.stringify(result).slice(0, 800));
  process.exit(1);
}

await mkdir("_meta/shots", { recursive: true });
const data = image.data ?? image.image_url?.url ?? "";
await writeFile(out, Buffer.from(String(data).replace(/^data:[^;]+;base64,/, ""), "base64"));
console.log(out);
