// Проверка каскада: primitive → semantic → компонент.
const vars = await pixso.variables.getLocalVariablesAsync();
const byName = new Map(vars.map((v) => [v.name, v]));
const out = { aliasCount: 0, borderAlias: null };

for (const v of vars) {
  const values = v.valuesByMode ?? {};
  for (const value of Object.values(values)) {
    if (value && value.type === "VARIABLE_ALIAS") out.aliasCount++;
  }
}

const border = byName.get("color/border");
out.borderAlias = border ? JSON.parse(JSON.stringify(border.valuesByMode ?? {})) : null;

// Компонент Outline-кнопки: берём штрих
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "2 Atoms");
const set = page.children.find((c) => c.name === "Button");
const outline = set.children.find((c) => c.name.includes("variant=outline") && c.name.includes("size=default"));
const stroke = outline?.strokes?.find((s) => s.type === "SOLID");
out.outlineStroke = stroke
  ? { rgb: [stroke.color.r, stroke.color.g, stroke.color.b].map((v) => Math.round(v * 255)), bound: stroke.boundVariables?.color?.id ?? null }
  : null;

const input = page.children.find((c) => c.name === "Input");
const inputState = input?.children?.find((c) => c.name.includes("state=default"));
const inputStroke = inputState?.strokes?.find((s) => s.type === "SOLID");
out.inputStroke = inputStroke
  ? [inputStroke.color.r, inputStroke.color.g, inputStroke.color.b].map((v) => Math.round(v * 255))
  : null;

return out;
