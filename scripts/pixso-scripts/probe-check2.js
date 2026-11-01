// Сравнение двух способов: вектор без resize vs текстовый глиф.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Page 1");
pixso.currentPage = page;

const frame = pixso.createFrame();
frame.name = "probe/check-compare";
frame.resize(240, 80);
frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
page.appendChild(frame);

const out = { frameId: frame.id };

// A: вектор как есть, без resize
try {
  const v = pixso.createVector();
  v.name = "vector";
  v.vectorPaths = [{ windingRule: "NONE", data: "M 4 10 L 9 15 L 18 3" }];
  v.fills = [];
  v.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  v.strokeWeight = 2;
  v.strokeCap = "ROUND";
  v.strokeJoin = "ROUND";
  frame.appendChild(v);
  v.x = 20;
  v.y = 20;
  out.vector = { w: Math.round(v.width), h: Math.round(v.height) };
} catch (e) {
  out.vector = { error: String(e && e.message ? e.message : e) };
}

// B: текстовый глиф
try {
  await pixso.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  const t = pixso.createText();
  t.name = "glyph";
  t.fontName = { family: "Inter", style: "Semi Bold" };
  t.characters = "✓";
  t.fontSize = 16;
  t.textAutoResize = "WIDTH_AND_HEIGHT";
  t.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  frame.appendChild(t);
  t.x = 80;
  t.y = 20;
  out.glyph = { w: Math.round(t.width), h: Math.round(t.height) };
} catch (e) {
  out.glyph = { error: String(e && e.message ? e.message : e) };
}

// C: вектор в квадрате 16x16 на чёрном фоне (как чекбокс)
const box = pixso.createRectangle();
box.name = "box";
box.resize(16, 16);
box.cornerRadius = 4;
box.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
frame.appendChild(box);
box.x = 160;
box.y = 20;

const v2 = pixso.createVector();
v2.name = "vector-in-box";
v2.vectorPaths = [{ windingRule: "NONE", data: "M 3 8 L 7 12 L 13 4" }];
v2.fills = [];
v2.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
v2.strokeWeight = 2;
v2.strokeCap = "ROUND";
v2.strokeJoin = "ROUND";
frame.appendChild(v2);
v2.x = 160;
v2.y = 20;
out.vectorInBox = { w: Math.round(v2.width), h: Math.round(v2.height), x: Math.round(v2.x), y: Math.round(v2.y) };

return out;
