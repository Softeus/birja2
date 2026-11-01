#!/usr/bin/env node
// tokens.json → Pixso: коллекция Primitive (палитра), коллекция Semantic (значения),
// затем алиасы semantic → primitive через Plugin API (MCP write_variables алиасы не умеет).
import { readFile, writeFile } from "node:fs/promises";
import { withPixso } from "../lib/mcp.mjs";

const TOKENS_PATH = process.argv[2] ?? "tokens.json";
const tokens = JSON.parse(await readFile(TOKENS_PATH, "utf8"));

const alpha = (hex, a) => {
  if (a === undefined || a === 255) return hex;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
};

// 1. Примитивы (мастер-палитра).
const primitives = tokens.primitives ?? [];
const primitivePayload = {
  variableSets: { Primitive: { name: "Primitive", modes: ["Default"] } },
  variables: {},
};
for (const p of primitives) {
  primitivePayload.variables[p.name] = {
    type: "color",
    variableSet: "Primitive",
    values: { Default: alpha(p.values.Default, p.alpha?.Default) },
  };
}

// 2. Семантика (значения; алиасы поставим отдельным шагом).
const semanticPayload = {
  variableSets: { [tokens.collection]: { name: tokens.collection, modes: tokens.modes } },
  variables: {},
};
for (const v of tokens.variables) {
  const values = {};
  for (const mode of tokens.modes) {
    const raw = v.values[mode];
    if (raw === undefined) throw new Error(`токен ${v.name}: нет значения для режима ${mode}`);
    values[mode] = v.type === "color" ? alpha(raw, v.alpha?.[mode]) : raw;
  }
  semanticPayload.variables[v.name] = { type: v.type, variableSet: tokens.collection, values };
}

// 3. Алиасы: у каждой semantic-переменной с alias ставим ссылку по режимам.
const aliasSpec = tokens.variables
  .filter((v) => v.alias)
  .map((v) => ({ name: v.name, modes: v.alias }));

const ALIAS_SCRIPT = `
const spec = ${JSON.stringify(aliasSpec)};
const vars = await pixso.variables.getLocalVariablesAsync();
const byName = new Map(vars.map((v) => [v.name, v]));
const colls = await pixso.variables.getLocalVariableCollectionsAsync();
const semantic = colls.find((c) => c.name === ${JSON.stringify(tokens.collection)});
if (!semantic) return { error: "нет коллекции Semantic" };
const modeIds = new Map(semantic.modes.map((m) => [m.name, m.modeId]));

const report = { aliased: 0, missing: [], errors: [] };
for (const item of spec) {
  const target = byName.get(item.name);
  if (!target) { report.missing.push(item.name); continue; }
  try {
    const perMode = {};
    for (const [modeName, primitiveName] of Object.entries(item.modes)) {
      const source = byName.get(primitiveName);
      if (!source) { report.missing.push(primitiveName); continue; }
      perMode[modeName] = pixso.variables.createVariableAlias(source);
    }
    for (const [modeName, alias] of Object.entries(perMode)) {
      const modeId = modeIds.get(modeName);
      if (modeId) target.setValueForMode(modeId, alias);
    }
    report.aliased++;
  } catch (e) {
    report.errors.push(item.name + ": " + String(e && e.message ? e.message : e));
  }
}
return report;
`;

const report = await withPixso(async (pixso) => {
  const primRes = await pixso.callJson("write_variables", primitivePayload);
  const primFailures = primRes?.result?.variables?.failures ?? [];

  const semRes = await pixso.callJson("write_variables", semanticPayload);
  const semFailures = semRes?.result?.variables?.failures ?? [];

  const aliasRes = await pixso.callJson("eval_script", { script: ALIAS_SCRIPT });

  return { primitives: primitives.length, primFailures, semantic: tokens.variables.length, semFailures, alias: aliasRes };
});

console.log(JSON.stringify(report, null, 2));

await writeFile("_meta/push-tokens.report.json", `${JSON.stringify({ at: new Date().toISOString(), report }, null, 2)}\n`, "utf8");

const failed =
  (report.primFailures?.length ?? 0) + (report.semFailures?.length ?? 0) + (report.alias?.errors?.length ?? 0) + (report.alias?.missing?.length ?? 0);
if (failed) process.exit(1);
