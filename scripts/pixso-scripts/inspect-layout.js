// Положение экранов и компонент-сетов на страницах + id страниц.
const out = {};
for (const page of pixso.root.children.filter((c) => c.type === "PAGE")) {
  out[page.name] = {
    id: page.id,
    children: page.children.map((c) => ({
      name: c.name,
      type: c.type,
      x: Math.round(c.x),
      y: Math.round(c.y),
      w: Math.round(c.width),
      h: Math.round(c.height),
    })),
  };
}
return out;
