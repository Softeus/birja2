#!/usr/bin/env node
// Обратная проверка: tokens.json ↔ Pixso. Ненулевой код выхода при любом расхождении.
import { readFile } from "node:fs/promises";
import { withPixso } from "../lib/mcp.mjs";
import { hexToRgba } from "../lib/color.mjs";

const TOKENS_PATH = process.argv[2] ?? "tokens.json";
const tokens = JSON.parse(await readFile(TOKENS_PATH, "utf8"));

const COLLECTIONS_SCRIPT = `
const collections = await pixso.variables.getLocalVariableCollectionsAsync();
return collections.map((c) => ({ id: c.id, name: c.name, modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })) }));
`;

const result = await withPixso(async (pixso) => {
  const collections = JSON.parse(await pixso.call("eval_script", { script: COLLECTIONS_SCRIPT }));
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
      const expected = token.values[mode];
      const got = actual.modeValues?.[modeId]?.value;
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

console.log(JSON.stringify(result, null, 2));
if (result.diffs.length || result.extra.length) process.exit(1);
