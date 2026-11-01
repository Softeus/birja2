#!/usr/bin/env node
// lucide-static SVG → ds/icons.json (пути в системе 24×24) + масштабирование путей.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const NAMES = ["check", "x", "search", "chevron-down", "arrow-right", "plus", "eye", "info"];
const DIR = "node_modules/lucide-static/icons";

const ARITY = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };

/**
 * Масштабирует SVG-путь с поддержкой неявного повторения команд (M → L).
 * Флаги дуг (large-arc, sweep) и поворот не масштабируются.
 */
export function scalePath(d, k) {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const out = [];
  let i = 0;
  let cmd = null;

  const nextNumber = () => {
    while (i < tokens.length && /[A-Za-z]/.test(tokens[i])) i++;
    return i < tokens.length ? parseFloat(tokens[i++]) : NaN;
  };

  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    if (!cmd) break;

    const upper = cmd.toUpperCase();
    const relative = cmd !== upper;
    const arity = ARITY[upper];
    if (arity === undefined) continue;
    if (arity === 0) {
      out.push(cmd);
      continue;
    }

    let first = true;
    while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) {
      const params = [];
      for (let n = 0; n < arity; n++) params.push(nextNumber());

      // Неявное повторение: после M/m идут пары как L/l.
      const effective = upper === "M" && !first ? (relative ? "l" : "L") : cmd;
      const isArc = effective.toUpperCase() === "A";
      const scaled = params.map((v, idx) => {
        if (isArc && (idx === 2 || idx === 3 || idx === 4)) return v;
        return Math.round(v * k * 1000) / 1000;
      });

      out.push(effective, ...scaled.map(String));
      first = false;
    }
  }

  return out.join(" ");
}

const icons = {};
for (const name of NAMES) {
  const svg = await readFile(join(DIR, `${name}.svg`), "utf8");
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);

  // Круги (например, info) переводим в путь из двух дуг.
  for (const [, cx, cy, r] of svg.matchAll(/<circle[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"[^>]*r="([\d.]+)"/g)) {
    const x = Number(cx);
    const y = Number(cy);
    const rad = Number(r);
    paths.push(`M ${x - rad} ${y} A ${rad} ${rad} 0 1 0 ${x + rad} ${y} A ${rad} ${rad} 0 1 0 ${x - rad} ${y}`);
  }

  if (!paths.length) {
    console.warn(`пропущен ${name}: нет путей`);
    continue;
  }
  icons[name] = { viewBox: 24, stroke: 2, paths };
}

await writeFile("ds/icons.json", `${JSON.stringify(icons, null, 2)}\n`, "utf8");
console.log(`icons: ${Object.keys(icons).length} — ${Object.keys(icons).join(", ")}`);
console.log(`check@16: ${scalePath(icons.check.paths[0], 16 / 24)}`);
