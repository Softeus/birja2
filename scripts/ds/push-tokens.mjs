#!/usr/bin/env node
// tokens.json → Pixso: коллекция Semantic с режимами Light/Dark через write_variables.
import { readFile, writeFile } from "node:fs/promises";
import { withPixso } from "../lib/mcp.mjs";

const TOKENS_PATH = process.argv[2] ?? "tokens.json";
const tokens = JSON.parse(await readFile(TOKENS_PATH, "utf8"));

const payload = {
  variableSets: {
    [tokens.collection]: { name: tokens.collection, modes: tokens.modes },
  },
  variables: {},
};

for (const v of tokens.variables) {
  const values = {};
  for (const mode of tokens.modes) {
    const raw = v.values[mode];
    if (raw === undefined) throw new Error(`токен ${v.name}: нет значения для режима ${mode}`);
    values[mode] = v.type === "color" ? withAlpha(raw, v.alpha?.[mode]) : raw;
  }
  payload.variables[v.name] = { type: v.type, variableSet: tokens.collection, values };
}

const report = await withPixso(async (pixso) => {
  const res = await pixso.callJson("write_variables", payload);
  const failures = [
    ...(res?.result?.variables?.failures ?? []).map((f) => ({ kind: "variable", ...f })),
    ...(res?.result?.variableSets?.failures ?? []).map((f) => ({ kind: "set", ...f })),
  ];
  return { ok: (res?.success ?? false) && failures.length === 0, failures, changedCount: Object.keys(res?.changed?.variables ?? {}).length };
});

console.log(JSON.stringify({ ok: report.ok, variables: tokens.variables.length, changed: report.changedCount, failures: report.failures }, null, 2));

await writeFile("_meta/push-tokens.report.json", `${JSON.stringify({ at: new Date().toISOString(), report }, null, 2)}\n`, "utf8");

if (!report.ok) process.exit(1);

function withAlpha(hex, alpha) {
  if (alpha === undefined || alpha === 255) return hex;
  // Pixso принимает RGBA-строку в CSS-формате.
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.round((alpha / 255) * 1000) / 1000})`;
}
