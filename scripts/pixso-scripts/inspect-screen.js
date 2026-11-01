// Диагностика собранного экрана.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");
if (!page) return { error: "нет страницы Screens" };
pixso.currentPage = page;
const frame = page.children.find((c) => c.name === "CompanyStep1");
if (!frame) return { error: "нет фрейма" };

const kids = frame.children.map((c) => ({
  name: c.name,
  type: c.type,
  w: Math.round(c.width),
  h: Math.round(c.height),
  x: Math.round(c.x),
  y: Math.round(c.y),
}));

return {
  frame: { w: frame.width, h: frame.height, mode: frame.layoutMode, primary: frame.primaryAxisSizingMode, counter: frame.counterAxisSizingMode, children: frame.children.length },
  kids: kids.slice(0, 8),
};
