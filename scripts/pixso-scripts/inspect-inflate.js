// Почему инстансы текстовых атомов в макете выше мастеров.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");
const frame = page.children.find((c) => c.name === "CompanyStep1");
const inst = frame.children.find((c) => c.type === "INSTANCE" && c.name === "Text");
const inst2 = frame.children.find((c) => c.type === "INSTANCE" && c.name === "Heading");

const dump = (n) => ({
  name: n.name,
  h: Math.round(n.height),
  w: Math.round(n.width),
  pad: [n.paddingLeft, n.paddingRight, n.paddingTop, n.paddingBottom],
  mode: n.layoutMode,
  prim: n.primaryAxisSizingMode,
  counter: n.counterAxisSizingMode,
  align: n.layoutAlign,
  children: n.children.map((c) => ({ n: c.name, h: Math.round(c.height), auto: c.textAutoResize, grow: c.layoutGrow, align: c.layoutAlign })),
});

return { text: dump(inst), heading: dump(inst2) };
