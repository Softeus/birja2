#!/usr/bin/env node
// ds/library.spec.json + builder.template.js → eval_script в Pixso → ds-manifest.json
import { readFile, writeFile } from "node:fs/promises";
import { withPixso } from "../lib/mcp.mjs";

const SPEC_PATH = process.argv[2] ?? "ds/library.spec.json";
const TEMPLATE_PATH = "scripts/pixso-scripts/builder.template.js";
const MANIFEST_PATH = process.argv[3] ?? "ds-manifest.json";

const spec = JSON.parse(await readFile(SPEC_PATH, "utf8"));
const tokens = JSON.parse(await readFile("tokens.json", "utf8"));
const template = await readFile(TEMPLATE_PATH, "utf8");

const tokenValues = {};
for (const v of tokens.variables) {
  if (v.type === "color") tokenValues[v.name] = v.values.Light;
  else tokenValues[v.name] = Number(v.values.Light);
}

const script = template
  .replace("const SPEC = __SPEC__;", `const SPEC = ${JSON.stringify(spec)};`)
  .replace("const TOKENS = __TOKENS__;", `const TOKENS = ${JSON.stringify(tokenValues)};`);

const result = await withPixso(async (pixso) => {
  const raw = await pixso.call("eval_script", { script });
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
});

if (!Array.isArray(result.created)) {
  console.error("unexpected eval_script result:");
  console.error(JSON.stringify(result).slice(0, 3000));
  process.exit(1);
}

if (result.errors?.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

const previous = await readFile(MANIFEST_PATH, "utf8").catch(() => null);
const prevManifest = previous ? JSON.parse(previous) : { components: {} };

const manifest = {
  $schema: "./schemas/ds-manifest.schema.json",
  system: "shadcn-pixso-core",
  version: new Date().toISOString().slice(0, 10),
  tokensCollection: "Semantic",
  components: { ...prevManifest.components },
};

for (const c of result.created) {
  if (!c.component) continue;
  manifest.components[c.component] = {
    key: c.key,
    nodeId: c.id,
    type: c.type,
    axes: c.variantProperties,
    props: buildProps(spec, c.component),
    slots: buildSlots(spec, c.component),
  };
}

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, created: result.created, errors: result.errors }, null, 2));

function buildProps(spec, name) {
  const comp = spec.components.find((c) => c.name === name);
  const props = {};
  for (const [axis, values] of Object.entries(comp.axes ?? {})) props[axis] = values;
  return props;
}

function buildSlots(spec, name) {
  const comp = spec.components.find((c) => c.name === name);
  const slots = {};
  for (const child of comp.children ?? []) {
    if (child.type === "text") slots[child.name ?? "text"] = "TEXT";
  }
  return slots;
}
