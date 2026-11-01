// Что реально привязано у варианта Button: fills/radius/размеры.
const set = pixso.currentPage.children.find((c) => c.name === "Button");
const child = set.children.find((c) => c.name.includes("variant=default") && c.name.includes("size=default"));
const text = child.children.find((c) => c.type === "TEXT");

return {
  node: { name: child.name, w: child.width, h: child.height, cornerRadius: child.cornerRadius },
  fills: child.fills,
  boundVariables: child.boundVariables,
  text: {
    characters: text?.characters,
    fontSize: text?.fontSize,
    fills: text?.fills,
    boundVariables: text?.boundVariables,
    width: text?.width,
    height: text?.height,
  },
  childrenCount: set.children.length,
};
