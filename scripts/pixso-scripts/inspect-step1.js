// Дети шага 1: высоты и отступы — ищем источник больших зазоров.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");
const frame = page.children.find((c) => c.name === "CompanyStep1");
const kids = frame.children.map((c) => ({
  name: c.name,
  type: c.type,
  y: Math.round(c.y),
  h: Math.round(c.height),
  mode: c.layoutMode,
  prim: c.primaryAxisSizingMode,
  counter: c.counterAxisSizingMode,
  text: c.type === "TEXT" ? c.characters?.slice(0, 20) : undefined,
  inner: c.children?.map((k) => ({ n: k.name, h: Math.round(k.height), auto: k.textAutoResize })),
}));
return { frame: { gap: frame.itemSpacing, pad: frame.paddingTop }, kids: kids.slice(0, 5) };
