// Проверка: 1) переключение режима коллекции на фрейме; 2) отображение токенов в макете.
const colls = await pixso.variables.getLocalVariableCollectionsAsync();
const semantic = colls.find((c) => c.name === "Semantic");
if (!semantic) return { error: "нет коллекции Semantic" };
const modeLight = semantic.modes.find((m) => m.name === "Light");
const modeDark = semantic.modes.find((m) => m.name === "Dark");

const compPage = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "2 Atoms");
const buttonSet = compPage.children.find((c) => c.name === "Button");
const master = buttonSet.children[0];

const scratch = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Page 1");
pixso.currentPage = scratch;

const wrap = (name, modeId) => {
  const frame = pixso.createFrame();
  frame.name = name;
  frame.resize(200, 80);
  scratch.appendChild(frame);
  const inst = master.createInstance();
  frame.appendChild(inst);
  inst.x = 16;
  inst.y = 16;
  if (modeId) {
    try {
      frame.setExplicitVariableModeForCollection(semantic.id, modeId);
    } catch (e) {
      return { frame, inst, error: String(e && e.message ? e.message : e) };
    }
  }
  return { frame, inst };
};

const light = wrap("probe/light", null);
const dark = wrap("probe/dark", modeDark.modeId);

const colorOf = (inst) => {
  const fills = inst.fills ?? [];
  const solid = fills.find((f) => f.type === "SOLID");
  if (!solid) return null;
  return {
    rgb: [solid.color.r, solid.color.g, solid.color.b].map((v) => Math.round(v * 255)),
    bound: solid.boundVariables?.color?.id ?? null,
  };
};

const result = {
  collection: { id: semantic.id, modes: semantic.modes.map((m) => m.name) },
  light: { fill: colorOf(light.inst), error: light.error ?? null },
  dark: { fill: colorOf(dark.inst), error: dark.error ?? null },
  api: {
    frameSetMode: typeof light.frame.setExplicitVariableModeForCollection,
    variablesSetMode: typeof pixso.variables?.setExplicitVariableModeForCollection,
  },
};

light.frame.remove();
dark.frame.remove();
return result;
