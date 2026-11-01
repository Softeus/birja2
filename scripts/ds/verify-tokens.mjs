#!/usr/bin/env node
// Обратная проверка: tokens.json ↔ Pixso. Проверяет значения, наличие примитивов и алиасы.
import { readFile } from "node:fs/promises";
import { withPixso } from "../lib/mcp.mjs";
import { hexToRgba } from "../lib/color.mjs";

const TOKENS_PATH = process.argv[2] ?? "tokens.json";
const tokens = JSON.parse(await readFile(TOKENS_PATH, "utf8"));

const aliased = tokens.variables.filter((v) => v.alias);

const ALIAS_SCRIPT = `
const expected = ${JSON.stringify(aliased.map((v) => ({ name: v.name, modes: v.alias })))};
const vars = await pixso.variables.getLocalVariablesAsync();
const byName = new Map(vars.map((v) => [v.name, v]));
const byId = new Map(vars.map((v) => [v.id, v.name]));
const colls = await pixso.variables.getLocalVariableCollectionsAsync();
const semantic = colls.find((c) => c.name === ${JSON.stringify(tokens.collection)});
const modeIds = semantic ? new Map(semantic.modes.map((m) => [m.name, m.modeId])) : new Map();

const mapping = {};
const missing = [];
const notAliased = [];
for (const item of expected) {
  const v = byName.get(item.name);
  if (!v) { missing.push(item.name); continue; }
  mapping[item.name] = {};
  for (const [modeName, expectedPrimitive] of Object.entries(item.modes)) {
    const modeId = modeIds.get(modeName);
    const value = v.valuesByMode?.[modeId];
    if (!value || value.type !== "VARIABLE_ALIAS") { notAliased.push(item.name + "/" + modeName); continue; }
    mapping[item.name][modeName] = byId.get(value.id) ?? value.id;
    if (expectedPrimitive && mapping[item.name][modeName] !== expectedPrimitive) {
      notAliased.push(item.name + "/" + modeName + " → " + mapping[item.name][modeName]);
    }
  }
}

const primitives = vars.filter((v) => v.name.startsWith("primitive/")).length;
return { expected: expected.length, primitives, mapping, missing, notAliased };
`;

const aliasResult = await withPixso(async (pixso) => pixso.callJson("eval_script", { script: ALIAS_SCRIPT }));

const result = await withPixso(async (pixso) => {
  const collections = await pixso.callJson("eval_script", {
    script: `
const collections = await pixso.variables.getLocalVariableCollectionsAsync();
return collections.map((c) => ({ id: c.id, name: c.name, modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })) }));
`,
  });

  const set = collections.find((c) => c.name === tokens.collection);
  if (!set) throw new Error(`коллекция ${tokens.collection} не найдена: ${JSON.stringify(collections)}`);

  const vars = await pixso.callJson("get_variables", { variableSetId: set.id });
  const varList = (Array.isArray(vars) ? vars : Object.values(vars ?? {})).filter((v) => !v.isSoftDeleted);
  const byName = new Map(varList.map((v) => [v.name, v]));

  const modeIds = new Map(set.modes.map((m) => [m.name, m.modeId]));
  const diffs = [];

  for (const token of tokens.variables) {
    const actual = byName.get(token.name);
    if (!actual) {
      diffs.push({ name: token.name, issue: "MISSING_IN_PIXSO" });
      continue;
    }

    for (const mode of tokens.modes) {
      const modeId = modeIds.get(mode);
      if (!modeId) {
        diffs.push({ name: token.name, issue: `NO_MODE_${mode}` });
        continue;
      }

      const got = actual.modeValues?.[modeId]?.value;

      // Алиасные токены сверяем по имени примитива, а не по сырому значению.
      if (token.alias?.[mode]) {
        const actualAlias = aliasResult.mapping?.[token.name]?.[mode];
        if (actualAlias !== token.alias[mode]) {
          diffs.push({ name: token.name, mode, expectedAlias: token.alias[mode], gotAlias: actualAlias ?? "raw" });
        }
        continue;
      }

      const expected = token.values[mode];
      if (token.type === "color") {
        const exp = hexToRgba(expected);
        const expAlpha = token.alpha?.[mode] ?? 255;
        const alphaOk = got && Math.abs(got.a - expAlpha) <= 1.5;
        if (!got || got.r !== exp.r || got.g !== exp.g || got.b !== exp.b || !alphaOk) {
          diffs.push({ name: token.name, mode, expected: `${expected}/${expAlpha}`, got });
        }
      } else if (got !== expected) {
        diffs.push({ name: token.name, mode, expected, got });
      }
    }
  }

  const extra = varList.filter((v) => !tokens.variables.some((t) => t.name === v.name)).map((v) => v.name);

  return { setName: set.name, modes: [...modeIds.keys()], inPixso: varList.length, inJson: tokens.variables.length, extra, diffs };
});

console.log(JSON.stringify({ ...result, alias: aliasResult }, null, 2));

if (result.diffs.length || result.extra.length) process.exit(1);
if (aliasResult.missing.length || aliasResult.notAliased.length) process.exit(1);
