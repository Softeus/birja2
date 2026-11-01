// Проверка: чем рисовать галочку — вектор или текстовый глиф.
const page = pixso.currentPage;
const out = { api: { createVector: typeof pixso.createVector, createLine: typeof pixso.createLine } };

// 1. Векторная галочка
try {
  const v = pixso.createVector();
  v.name = "probe/check-vector";
  v.vectorPaths = [{ windingRule: "NONE", data: "M 2 8 L 6 12 L 14 3" }];
  v.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  v.strokeWeight = 2;
  v.strokeCap = "ROUND";
  v.strokeJoin = "ROUND";
  v.fills = [];
  v.resize(16, 16);
  page.appendChild(v);
  out.vector = { ok: true, w: v.width, h: v.height };
  v.remove();
} catch (e) {
  out.vector = { ok: false, error: String(e && e.message ? e.message : e) };
}

// 2. Текстовый глиф
try {
  await pixso.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  const t = pixso.createText();
  t.name = "probe/check-glyph";
  t.fontName = { family: "Inter", style: "Semi Bold" };
  t.characters = "✓";
  t.fontSize = 12;
  t.textAutoResize = "WIDTH_AND_HEIGHT";
  page.appendChild(t);
  out.glyph = { ok: true, w: t.width, h: t.height, fonts: t.fontName };
  t.remove();
} catch (e) {
  out.glyph = { ok: false, error: String(e && e.message ? e.message : e) };
}

return out;
