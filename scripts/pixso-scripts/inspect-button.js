// Что привязано у варианта Button: fills/radius/padding/fontSize.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "2 Atoms");
const set = page.children.find((c) => c.name === "Button");
const child = set.children.find((c) => c.name.includes("variant=default") && c.name.includes("size=default"));
const text = child.children.find((c) => c.type === "TEXT");

const names = await pixso.variables.getLocalVariablesAsync();
const byId = new Map(names.map((v) => [v.id, v.name]));
const pretty = (bv) =>
  Object.fromEntries(
    Object.entries(bv ?? {}).map(([k, arr]) => [k, (Array.isArray(arr) ? arr : [arr]).map((a) => byId.get(a.id) ?? a.id)]),
  );

return {
  node: { w: child.width, h: child.height, padding: [child.paddingLeft, child.paddingTop] },
  bound: pretty(child.boundVariables),
  text: { fontSize: text.fontSize, bound: pretty(text.boundVariables) },
};
