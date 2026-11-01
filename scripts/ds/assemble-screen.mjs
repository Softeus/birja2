#!/usr/bin/env node
// UI-AST → экран(ы) в Pixso. usage: node scripts/ds/assemble-screen.mjs [file.ast.json ...]
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { withPixso } from "../lib/mcp.mjs";

const manifest = JSON.parse(await readFile("ds-manifest.json", "utf8"));
const template = await readFile("scripts/pixso-scripts/screen.template.js", "utf8");

const targets = process.argv.slice(2);
const files = targets.length
  ? targets
  : (await readdir("ds/screens")).filter((f) => f.endsWith(".ast.json")).sort().map((f) => resolve("ds/screens", f));

const results = [];

for (const file of files) {
  const ast = JSON.parse(await readFile(file, "utf8"));
  const script = template
    .replace("const AST = __AST__;", `const AST = ${JSON.stringify(ast)};`)
    .replace("const MANIFEST = __MANIFEST__;", `const MANIFEST = ${JSON.stringify(manifest)};`);

  const result = await withPixso(async (pixso) => {
    const raw = await pixso.call("eval_script", { script });
    try {
      return JSON.parse(raw);
    } catch {
      return { screen: ast.screen, raw };
    }
  });

  results.push(result);
  console.log(`${ast.screen}: instances=${result.instances?.length ?? 0} errors=${result.errors?.length ?? 0} frame=${result.frameId ?? "-"}`);
  if (result.errors?.length || result.missing?.length) console.log(JSON.stringify({ errors: result.errors, missing: result.missing }, null, 2));
}

await mkdir("_meta", { recursive: true });
await writeFile("_meta/assemble.report.json", JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
