// Пошаговый тест операций генератора: каждая в своём try/catch.
const vars = await pixso.variables.getLocalVariablesAsync();
const id = (n) => vars.find((v) => v.name === n)?.id;
const log = {};

const page = pixso.currentPage;

async function step(name, fn) {
  try {
    log[name] = { ok: true, value: await fn() };
  } catch (e) {
    log[name] = { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

let c1;
await step("createComponent", () => {
  c1 = pixso.createComponent();
  c1.name = "probe/button";
  page.appendChild(c1);
  return c1.id;
});

await step("layoutMode", () => {
  c1.layoutMode = "HORIZONTAL";
  return c1.layoutMode;
});

await step("align", () => {
  c1.primaryAxisAlignItems = "CENTER";
  c1.counterAxisAlignItems = "CENTER";
  return [c1.primaryAxisAlignItems, c1.counterAxisAlignItems];
});

await step("resize", () => {
  c1.resize(120, 36);
  return [c1.width, c1.height];
});

await step("padding", () => {
  c1.paddingLeft = 16;
  c1.paddingRight = 16;
  c1.paddingTop = 8;
  c1.paddingBottom = 8;
  return [c1.paddingLeft, c1.paddingTop];
});

await step("sizingModes", () => {
  c1.primaryAxisSizingMode = "AUTO";
  c1.counterAxisSizingMode = "FIXED";
  return [c1.primaryAxisSizingMode, c1.counterAxisSizingMode];
});

await step("fills", () => {
  c1.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  return c1.fills.length;
});

await step("bindFills", () => c1.setBoundVariable("fills", id("color/primary")));
await step("bindRadius", () => c1.setBoundVariable("cornerRadius", id("radius/default")));
await step("bindPadding", () => c1.setBoundVariable("paddingLeft", id("radius/default")));

let t1;
await step("createText", async () => {
  await pixso.loadFontAsync({ family: "Inter", style: "Medium" });
  t1 = pixso.createText();
  t1.fontName = { family: "Inter", style: "Medium" };
  t1.characters = "Button";
  t1.fontSize = 14;
  c1.appendChild(t1);
  return t1.id;
});

await step("textFillBind", () => {
  t1.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  t1.setBoundVariable("fills", id("color/primary-foreground"));
});

let c2;
await step("secondComponent", () => {
  c2 = c1.clone();
  c2.name = "variant=outline";
  page.appendChild(c2);
  return c2.id;
});

await step("combineAsVariants", () => {
  const set = pixso.combineAsVariants([c1, c2], page);
  set.name = "probe/set";
  return { id: set.id, key: set.key, type: set.type, children: set.children.length };
});

return log;
