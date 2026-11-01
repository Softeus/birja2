// Мастера текстовых атомов: размеры и отступы.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "2 Atoms");
const out = {};
for (const name of ["Label", "Text", "Heading", "Button", "Input"]) {
  const node = page.children.find((c) => c.name === name);
  if (!node) { out[name] = "нет"; continue; }
  const comp = node.type === "COMPONENT_SET" ? node.children[0] : node;
  out[name] = {
    type: node.type,
    w: Math.round(comp.width),
    h: Math.round(comp.height),
    pad: [comp.paddingLeft, comp.paddingTop],
    prim: comp.primaryAxisSizingMode,
    counter: comp.counterAxisSizingMode,
    textH: comp.children.find((c) => c.type === "TEXT")?.height,
  };
}
return out;
