// Краткая карта страниц: имя, id, сколько узлов и сколько из них компоненты.
return pixso.root.children
  .filter((c) => c.type === "PAGE")
  .map((p) => ({
    name: p.name,
    id: p.id,
    nodes: p.children.length,
    components: p.children.filter((c) => c.type === "COMPONENT" || c.type === "COMPONENT_SET").map((c) => c.name),
  }));
