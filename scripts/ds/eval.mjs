#!/usr/bin/env node
// Запустить JS-файл в Pixso через eval_script и напечатать JSON-результат.
// usage: node scripts/ds/eval.mjs scripts/pixso-scripts/foo.js [--raw]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { withPixso } from "../lib/mcp.mjs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/ds/eval.mjs <script.js>");
  process.exit(2);
}

const script = await readFile(resolve(file), "utf8");

const out = await withPixso(async (pixso) => {
  const raw = await pixso.call("eval_script", { script });
  return raw;
});

await mkdir("_meta/eval", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
await writeFile(`_meta/eval/${stamp}-${basename(file)}.json`, out, "utf8");

console.log(out.slice(0, 4000));
