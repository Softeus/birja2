// Проверка переключения темы: рамка + прямоугольник с привязанным цветом.
const colls = await pixso.variables.getLocalVariableCollectionsAsync();
const semantic = colls.find((c) => c.name === "Semantic");
const modeLight = semantic.modes.find((m) => m.name === "Light");
const modeDark = semantic.modes.find((m) => m.name === "Dark");

const vars = await pixso.variables.getLocalVariablesAsync();
const primary = vars.find((v) => v.name === "color/primary");

const scratch = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Page 1");
pixso.currentPage = scratch;

const makeBox = (name) => {
  const frame = pixso.createFrame();
  frame.name = name;
  frame.resize(120, 60);
  frame.fills = [];
  scratch.appendChild(frame);

  const rect = pixso.createRectangle();
  rect.name = "swatch";
  rect.resize(80, 40);
  frame.appendChild(rect);
  rect.x = 10;
  rect.y = 10;
  rect.fills = [pixso.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", primary)];
  return { frame, rect };
};

const read = (rect) => {
  const solid = (rect.fills ?? []).find((f) => f.type === "SOLID");
  return solid ? [solid.color.r, solid.color.g, solid.color.b].map((v) => Math.round(v * 255)) : null;
};

const attempts = {};
const light = makeBox("probe/theme-light");
attempts.lightRaw = read(light.rect);

const setMode = (frame, a, b) => {
  try {
    frame.setExplicitVariableModeForCollection(a, b);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
};

// вариант 1: (collectionId, modeId)
attempts.v1_collectionId_modeId = setMode(light.frame, semantic.id, modeDark.modeId);
attempts.afterV1 = read(light.rect);

// вариант 2: (collectionObject, modeObject)
attempts.v2_collectionObj_modeObj = setMode(light.frame, semantic, modeDark);
attempts.afterV2 = read(light.rect);

// вариант 3: (collectionId, modeObject)
attempts.v3_collectionId_modeObj = setMode(light.frame, semantic.id, modeDark);
attempts.afterV3 = read(light.rect);

// вариант 4: (collectionObject, modeId)
attempts.v4_collectionObj_modeId = setMode(light.frame, semantic, modeDark.modeId);
attempts.afterV4 = read(light.rect);

attempts.primaryValue = primary && vars.length ? "bound" : "no var";
attempts.explicitModes = light.frame.explicitVariableModes ?? null;

light.frame.remove();
return attempts;
