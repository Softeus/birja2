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

// --- Primitive-слой: мастер-палитра. Semantic ссылается на неё алиасами. ---
const PALETTE = {
  "neutral-0": { hex: "#FFFFFF", alpha: 255 },
  "neutral-0a10": { hex: "#FFFFFF", alpha: 26 },
  "neutral-0a15": { hex: "#FFFFFF", alpha: 38 },
  "neutral-50": { hex: "#FAFAFA", alpha: 255 },
  "neutral-100": { hex: "#F5F5F5", alpha: 255 },
  "neutral-200": { hex: "#E5E5E5", alpha: 255 },
  "neutral-400": { hex: "#A1A1A1", alpha: 255 },
  "neutral-500": { hex: "#737373", alpha: 255 },
  "neutral-800": { hex: "#262626", alpha: 255 },
  "neutral-900": { hex: "#171717", alpha: 255 },
  "neutral-950": { hex: "#0A0A0A", alpha: 255 },
  "red-600": { hex: "#E40016", alpha: 255 },
  "red-300": { hex: "#FF6568", alpha: 255 },
};

const PRIMITIVE_MAP = {
  "color/background": { Light: "neutral-0", Dark: "neutral-950" },
  "color/foreground": { Light: "neutral-950", Dark: "neutral-50" },
  "color/card": { Light: "neutral-0", Dark: "neutral-900" },
  "color/card-foreground": { Light: "neutral-950", Dark: "neutral-50" },
  "color/popover": { Light: "neutral-0", Dark: "neutral-900" },
  "color/popover-foreground": { Light: "neutral-950", Dark: "neutral-50" },
  "color/primary": { Light: "neutral-900", Dark: "neutral-200" },
  "color/primary-foreground": { Light: "neutral-50", Dark: "neutral-900" },
  "color/secondary": { Light: "neutral-100", Dark: "neutral-800" },
  "color/secondary-foreground": { Light: "neutral-900", Dark: "neutral-50" },
  "color/muted": { Light: "neutral-100", Dark: "neutral-800" },
  "color/muted-foreground": { Light: "neutral-500", Dark: "neutral-400" },
  "color/accent": { Light: "neutral-100", Dark: "neutral-800" },
  "color/accent-foreground": { Light: "neutral-900", Dark: "neutral-50" },
  "color/destructive": { Light: "red-600", Dark: "red-300" },
  "color/destructive-foreground": { Light: "neutral-50", Dark: "neutral-50" },
  "color/border": { Light: "neutral-200", Dark: "neutral-0a10" },
  "color/input": { Light: "neutral-200", Dark: "neutral-0a15" },
  "color/ring": { Light: "neutral-400", Dark: "neutral-500" },
  "color/sidebar": { Light: "neutral-50", Dark: "neutral-900" },
  "color/sidebar-foreground": { Light: "neutral-950", Dark: "neutral-50" },
  "color/sidebar-primary-foreground": { Light: "neutral-50", Dark: "neutral-50" },
  "color/sidebar-accent": { Light: "neutral-100", Dark: "neutral-800" },
  "color/sidebar-accent-foreground": { Light: "neutral-900", Dark: "neutral-50" },
  "color/sidebar-border": { Light: "neutral-200", Dark: "neutral-0a10" },
  "color/sidebar-ring": { Light: "neutral-400", Dark: "neutral-500" },
};

const primitiveWarnings = [];
for (const variable of variables) {
  const map = PRIMITIVE_MAP[variable.name];
  if (!map) continue;

  variable.alias = {};
  for (const mode of tokens.modes) {
    const primitiveName = map[mode];
    const primitive = PALETTE[primitiveName];
    if (!primitive) {
      primitiveWarnings.push(`${variable.name}/${mode}: нет primitive ${primitiveName}`);
      continue;
    }
    const expectedAlpha = variable.alpha?.[mode] ?? 255;
    if (primitive.hex !== variable.values[mode] || primitive.alpha !== expectedAlpha) {
      primitiveWarnings.push(
        `${variable.name}/${mode}: ${variable.values[mode]}/${expectedAlpha} ≠ ${primitiveName} ${primitive.hex}/${primitive.alpha}`,
      );
    }
    variable.alias[mode] = `primitive/${primitiveName}`;
  }
}

tokens.primitives = Object.entries(PALETTE).map(([name, value]) => ({
  name: `primitive/${name}`,
  type: "color",
  values: { Default: value.hex },
  alpha: { Default: value.alpha },
}));


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
