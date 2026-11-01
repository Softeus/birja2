// Проверка возможностей Plugin API: страницы, компоненты, варианты, переменные, шрифты.
const out = {};

out.api = {
  createPage: typeof pixso.createPage,
  createComponent: typeof pixso.createComponent,
  createComponentSet: typeof pixso.combineAsVariants,
  createFrame: typeof pixso.createFrame,
  createText: typeof pixso.createText,
  createRectangle: typeof pixso.createRectangle,
  setCurrentPage: Object.getOwnPropertyDescriptor(pixso, "currentPage")?.set ? "setter" : "readonly",
  loadFontAsync: typeof pixso.loadFontAsync,
  listAvailableFontsAsync: typeof pixso.listAvailableFontsAsync,
  variables: typeof pixso.variables?.getLocalVariablesAsync,
};

out.pages = pixso.root.children.map((p) => ({ id: p.id, name: p.name, type: p.type }));
out.currentPage = { id: pixso.currentPage.id, name: pixso.currentPage.name };

try {
  const fonts = await pixso.listAvailableFontsAsync();
  out.fonts = { count: fonts.length, sample: fonts.slice(0, 8).map((f) => `${f.fontName.family}/${f.fontName.style}`) };
  out.hasInter = fonts.some((f) => f.fontName.family === "Inter");
} catch (e) {
  out.fonts = { error: String(e) };
}

return out;
