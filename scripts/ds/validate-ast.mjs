#!/usr/bin/env node
// Валидатор UI-AST против ds-manifest.json. Ошибка → код выхода 1.
// usage: node scripts/ds/validate-ast.mjs ds/screens/*.ast.json
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const manifest = JSON.parse(await readFile("ds-manifest.json", "utf8"));
const schema = JSON.parse(await readFile("schemas/ui-ast.schema.json", "utf8"));

const targets = process.argv.slice(2);
const files = targets.length
  ? targets
  : (await readdir("ds/screens")).filter((f) => f.endsWith(".ast.json")).map((f) => resolve("ds/screens", f));

const problems = [];

for (const file of files) {
  const ast = JSON.parse(await readFile(file, "utf8"));
  const where = (path) => `${file} ${path}`;

  // 1. Структурная проверка по схеме (упрощённый валидатор под эту схему).
  if (!ast.screen || !/^[A-Za-z0-9_-]+$/.test(ast.screen)) problems.push(`${where("")}: неверный screen`);
  if (!ast.frame?.width) problems.push(`${where("frame")}: нет width`);
  if (!Array.isArray(ast.elements) || !ast.elements.length) problems.push(`${where("elements")}: пусто`);

  const walk = (node, path) => {
    if (!node || typeof node !== "object") {
      problems.push(`${where(path)}: узел не объект`);
      return;
    }

    if (node.type === "stack") {
      if (!["VERTICAL", "HORIZONTAL"].includes(node.direction ?? "VERTICAL")) {
        problems.push(`${where(path)}: неверный direction`);
      }
      if (!Array.isArray(node.children) || !node.children.length) {
        problems.push(`${where(path)}: stack без children`);
        return;
      }
      node.children.forEach((child, i) => walk(child, `${path}.children[${i}]`));
      return;
    }

    if (node.type === "heatmap") {
      if (typeof node.width !== "number" || typeof node.height !== "number") {
        problems.push(`${where(path)}: heatmap без width/height`);
      }
      if (!Array.isArray(node.sectors) || !node.sectors.length) {
        problems.push(`${where(path)}: heatmap без sectors`);
        return;
      }
      node.sectors.forEach((s, i) => {
        const p = `${path}.sectors[${i}]`;
        if (!s.sector || typeof s.x !== "number" || typeof s.y !== "number" || typeof s.width !== "number" || typeof s.height !== "number") {
          problems.push(`${where(p)}: неполные поля сектора`);
        }
        if (Array.isArray(s.tiles)) {
          s.tiles.forEach((t, j) => {
            if (!t.secId || typeof t.x !== "number" || typeof t.y !== "number" || typeof t.width !== "number" || typeof t.height !== "number" || typeof t.level !== "string") {
              problems.push(`${where(p)}.tiles[${j}]: неполные поля плитки`);
            }
          });
        }
      });
      return;
    }

    if (!node.component) {
      problems.push(`${where(path)}: нет component`);
      return;
    }

    const meta = manifest.components[node.component];
    if (!meta) {
      problems.push(`${where(path)}: компонент «${node.component}» отсутствует в ds-manifest.json`);
      return;
    }

    for (const [key, value] of Object.entries(node.props ?? {})) {
      const allowed = meta.props?.[key];
      if (!allowed) {
        problems.push(`${where(path)}: пропс «${key}» не объявлен у ${node.component}`);
      } else if (!allowed.includes(value)) {
        problems.push(`${where(path)}: ${node.component}.${key}="${value}" вне [${allowed.join(", ")}]`);
      }
    }

    for (const [key, value] of Object.entries(node.slots ?? {})) {
      const slotType = meta.slots?.[key];
      if (!slotType) {
        problems.push(`${where(path)}: слот «${key}» не объявлен у ${node.component}`);
      } else if (slotType === "TEXT" && (typeof value !== "string" || !value.trim())) {
        problems.push(`${where(path)}: слот «${key}» должен быть непустой строкой`);
      }
    }

    for (const [key, type] of Object.entries(meta.slots ?? {})) {
      if (type === "TEXT" && !(key in (node.slots ?? {}))) {
        problems.push(`${where(path)}: у ${node.component} не заполнен обязательный слот «${key}»`);
      }
    }
  };

  ast.elements.forEach((el, i) => walk(el, `elements[${i}]`));
}

if (problems.length) {
  console.error(`FAIL: ${problems.length}`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`OK: ${files.length} файл(ов) валидны против манифеста (${Object.keys(manifest.components).length} компонентов)`);
