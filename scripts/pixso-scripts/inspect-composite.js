// Диагностика составных компонентов (Switch/Radio/Checkbox).
const out = {};
for (const name of ["Switch", "Radio", "Checkbox"]) {
  const set = pixso.currentPage.children.find((c) => c.name === name);
  if (!set) {
    out[name] = "нет";
    continue;
  }
  const comp = set.type === "COMPONENT_SET" ? set.children[0] : set;
  out[name] = {
    type: set.type,
    layout: comp.layoutMode,
    w: Math.round(comp.width),
    h: Math.round(comp.height),
    children: comp.children.map((c) => ({ name: c.name, type: c.type, x: Math.round(c.x), y: Math.round(c.y), w: Math.round(c.width), h: Math.round(c.height), fills: c.fills.length })),
  };
}
return out;
