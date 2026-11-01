// Ищем рабочую сигнатуру привязки переменной.
const vars = await pixso.variables.getLocalVariablesAsync();
const colorVar = vars.find((v) => v.name === "color/primary");
const numberVar = vars.find((v) => v.name === "radius/default");

const page = pixso.currentPage;
const node = pixso.createComponent();
node.name = "probe/bind";
page.appendChild(node);
node.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];

const out = {
  varShape: colorVar ? Object.keys(colorVar) : null,
  varSample: colorVar ? { id: colorVar.id, name: colorVar.name, resolvedType: colorVar.resolvedType, type: colorVar.type } : null,
  attempts: {},
};

const attempts = {
  "id-string": () => node.setBoundVariable("fills", colorVar.id),
  "var-object": () => node.setBoundVariable("fills", colorVar),
  "array-field": () => node.setBoundVariable(["fills"], colorVar.id),
  "fill-singular": () => node.setBoundVariable("fill", colorVar.id),
  "radius-id": () => node.setBoundVariable("cornerRadius", numberVar.id),
  "props-object": () => node.setBoundVariable({ field: "fills", variableId: colorVar.id }),
};

for (const [name, fn] of Object.entries(attempts)) {
  try {
    fn();
    out.attempts[name] = { ok: true };
  } catch (e) {
    out.attempts[name] = { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

out.hasSetBoundVariableOnNode = typeof node.setBoundVariable;
out.boundVariables = node.boundVariables;
out.definition = node.getPluginData ? "has getPluginData" : "no getPluginData";

node.remove();
return out;
