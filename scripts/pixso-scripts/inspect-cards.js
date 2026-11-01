// Диагностика Card/Dialog: мастер vs инстанс, отступы, размеры детей.
const compPage = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Components");
const screenPage = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");

const out = { masters: {}, instances: [] };

for (const name of ["Card", "Dialog"]) {
  const node = compPage.children.find((c) => c.name === name);
  if (!node) continue;
  const comp = node.type === "COMPONENT_SET" ? node.children[0] : node;
  out.masters[name] = {
    w: Math.round(comp.width),
    h: Math.round(comp.height),
    mode: comp.layoutMode,
    primary: comp.primaryAxisSizingMode,
    counter: comp.counterAxisSizingMode,
    pad: [comp.paddingTop, comp.paddingRight, comp.paddingBottom, comp.paddingLeft],
    gap: comp.itemSpacing,
    children: comp.children.map((c) => ({ name: c.name, type: c.type, h: Math.round(c.height), auto: c.textAutoResize, align: c.layoutAlign })),
  };
}

for (const frame of screenPage.children.filter((c) => c.type === "FRAME")) {
  for (const inst of frame.findAll((n) => n.type === "INSTANCE" && (n.name === "Card" || n.name === "Dialog"))) {
    out.instances.push({
      screen: frame.name,
      name: inst.name,
      w: Math.round(inst.width),
      h: Math.round(inst.height),
      mode: inst.layoutMode,
      children: inst.children.map((c) => ({ name: c.name, type: c.type, h: Math.round(c.height) })),
    });
  }
}

out.darkModeApi = {
  setExplicitVariableModeForCollection: typeof pixso.variables?.setExplicitVariableModeForCollection,
  frameApi: typeof compPage.children[0]?.setExplicitVariableModeForCollection,
};

return out;
