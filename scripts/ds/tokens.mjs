#!/usr/bin/env node
// app/globals.css → tokens.json (коллекция Semantic, режимы Light/Dark).
// Правила: берём только объявления внутри :root и .dark; var()-ссылки и шрифты пропускаем.
import { readFile, writeFile } from "node:fs/promises";
import { parseCssColor } from "../lib/color.mjs";

const CSS_PATH = process.argv[2] ?? "app/globals.css";
const OUT_PATH = process.argv[3] ?? "tokens.json";

const css = await readFile(CSS_PATH, "utf8");

function block(selector) {
  const re = new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "m");
  const m = css.match(re);
  if (!m) throw new Error(`не найден блок ${selector} в ${CSS_PATH}`);
  const map = new Map();
  for (const line of m[1].split(";")) {
    const decl = line.match(/(--[\w-]+)\s*:\s*(.+)/s);
    if (!decl) continue;
    const name = decl[1].trim();
    const value = decl[2].trim();
    if (value.startsWith("var(")) continue;
    map.set(name, value);
  }
  return map;
}

const light = block(":root");
const dark = block(".dark");

const variables = [];
const skipped = [];

for (const [cssVar, value] of light) {
  if (cssVar.startsWith("--font")) continue;

  if (cssVar === "--radius") {
    const px = toPx(value);
    const scale = {
      "radius/sm": Math.max(0, px - 4),
      "radius/md": Math.max(0, px - 2),
      "radius/default": px,
      "radius/lg": px,
      "radius/xl": px + 4,
    };
    for (const [name, v] of Object.entries(scale)) {
      variables.push({ name, type: "number", values: { Light: v, Dark: v } });
    }
    continue;
  }

  const name = tokenName(cssVar);
  const lightColor = parseCssColor(value);
  const darkValue = dark.get(cssVar);
  const darkColor = darkValue ? parseCssColor(darkValue) : null;

  if (!lightColor || !darkColor) {
    skipped.push({ cssVar, value, reason: "не цвет или нет значения в .dark" });
    continue;
  }

  variables.push({
    name,
    type: "color",
    values: { Light: lightColor.hex, Dark: darkColor.hex },
    alpha: {
      Light: lightColor.rgba.a,
      Dark: darkColor.rgba.a,
    },
  });
}

for (const [cssVar] of dark) {
  if (!light.has(cssVar)) skipped.push({ cssVar, reason: "есть только в .dark" });
}

function tokenName(cssVar) {
  const bare = cssVar.replace(/^--/, "");
  return `color/${bare}`;
}

function toPx(value) {
  const m = value.match(/^([\d.]+)(px|rem)?$/);
  if (!m) throw new Error(`не разобрал размер: ${value}`);
  const num = parseFloat(m[1]);
  if (m[2] === "rem") return Math.round(num * 16 * 100) / 100;
  return num;
}

const tokens = {
  collection: "Semantic",
  modes: ["Light", "Dark"],
  source: CSS_PATH,
  variables,
};

// Числовая шкала: производные Tailwind (4px-шаг) и размеры шрифта. Одна шкала на код и макет.
const NUMERIC = {
  "space/2": 2,
  "space/4": 4,
  "space/6": 6,
  "space/8": 8,
  "space/10": 10,
  "space/12": 12,
  "space/16": 16,
  "space/24": 24,
  "space/32": 32,
  "font/12": 12,
  "font/13": 13,
  "font/14": 14,
  "font/16": 16,
  "font/18": 18,
  "font/22": 22,
  "font/28": 28,
  "stroke/1": 1,
};

for (const [name, value] of Object.entries(NUMERIC)) {
  tokens.variables.push({ name, type: "number", values: { Light: value, Dark: value } });
}

await writeFile(OUT_PATH, `${JSON.stringify(tokens, null, 2)}\n`, "utf8");

console.log(`tokens: ${variables.length} (${variables.filter((v) => v.type === "color").length} color, число)`);
if (skipped.length) {
  console.log(`пропущено: ${skipped.length}`);
  for (const s of skipped) console.log(`  - ${s.cssVar}: ${s.reason}`);
}
