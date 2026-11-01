#!/usr/bin/env node
// Снять скриншоты всех собранных экранов по отчёту сборки.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { withPixso } from "../lib/mcp.mjs";

const report = JSON.parse(await readFile("_meta/assemble.report.json", "utf8"));
await mkdir("_meta/shots", { recursive: true });

const rows = [];

await withPixso(async (pixso) => {
  for (const item of report.results) {
    if (!item.frameId) continue;
    const result = await pixso.callResult("get_screenshot", { guid: item.frameId });
    const image = (result?.content ?? []).find((b) => b.type === "image" || b.type === "image_url");
    if (!image) {
      rows.push({ screen: item.screen, ok: false });
      continue;
    }
    const data = image.data ?? image.image_url?.url ?? "";
    const file = `_meta/shots/${item.screen.replace(/^Company/, "").toLowerCase() || item.screen.toLowerCase()}.png`;
    await writeFile(file, Buffer.from(String(data).replace(/^data:[^;]+;base64,/, ""), "base64"));
    rows.push({ screen: item.screen, ok: true, file });
  }
});

console.log(rows.map((r) => `${r.screen}: ${r.ok ? r.file : "FAILED"}`).join("\n"));
if (rows.some((r) => !r.ok)) process.exit(1);
