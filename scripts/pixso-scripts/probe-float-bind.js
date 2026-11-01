// Проверка: к каким числовым свойствам Pixso даёт привязать FLOAT-переменную.
const vars = await pixso.variables.getLocalVariablesAsync();
const floatVar = vars.find((v) => v.resolvedType === "FLOAT" || v.type === "FLOAT");
if (!floatVar) return { error: "нет FLOAT-переменных" };

const page = pixso.currentPage;
const comp = pixso.createComponent();
comp.name = "probe/float-bind";
page.appendChild(comp);
comp.resize(120, 40);

await pixso.loadFontAsync({ family: "Inter", style: "Regular" });
const text = pixso.createText();
text.fontName = { family: "Inter", style: "Regular" };
text.characters = "12";
text.fontSize = 14;
comp.appendChild(text);

const results = {};
const tryBind = (target, field, label) => {
  try {
    target.setBoundVariable(field, floatVar);
    const bound = JSON.stringify(target.boundVariables?.[field] ?? null) !== "null";
    results[label] = { ok: true, bound };
  } catch (e) {
    results[label] = { ok: false, error: String(e && e.message ? e.message : e) };
  }
};

tryBind(comp, "paddingLeft", "paddingLeft");
tryBind(comp, "paddingRight", "paddingRight");
tryBind(comp, "paddingTop", "paddingTop");
tryBind(comp, "paddingBottom", "paddingBottom");
tryBind(comp, "itemSpacing", "itemSpacing");
tryBind(comp, "cornerRadius", "cornerRadius");
tryBind(comp, "strokeWeight", "strokeWeight");
tryBind(comp, "width", "width");
tryBind(comp, "height", "height");
tryBind(comp, "minWidth", "minWidth");
tryBind(text, "fontSize", "fontSize");
tryBind(text, "lineHeight", "lineHeight");
tryBind(text, "letterSpacing", "letterSpacing");

results.values = {
  paddingLeft: comp.paddingLeft,
  itemSpacing: comp.itemSpacing,
  fontSize: text.fontSize,
  floatVar: floatVar.name,
};
results.boundVariables = comp.boundVariables;
results.textBound = text.boundVariables;

comp.remove();
return results;
