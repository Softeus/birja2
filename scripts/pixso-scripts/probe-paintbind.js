// Привязка цвета через paint-bound API (Figma: variables.setBoundVariableForPaint).
const vars = await pixso.variables.getLocalVariablesAsync();
const colorVar = vars.find((v) => v.name === "color/primary");
const page = pixso.currentPage;
const node = pixso.createComponent();
node.name = "probe/paintbind";
page.appendChild(node);
node.resize(100, 40);
node.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];

const out = { api: {}, result: {} };
out.api.hasSetBoundVariableForPaint = typeof pixso.variables?.setBoundVariableForPaint;

try {
  const painted = pixso.variables.setBoundVariableForPaint(node.fills[0], "color", colorVar);
  node.fills = [painted];
  out.result.paintApi = "ok";
} catch (e) {
  out.result.paintApi = String(e && e.message ? e.message : e);
}

out.result.fills = node.fills;
out.result.boundVariables = node.boundVariables;

// Попытка через прямой объект paint
try {
  node.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 }, boundVariables: { color: { type: "VARIABLE_ALIAS", id: colorVar.id } } }];
  out.result.paintObjectAssign = "ok";
  out.result.fills2 = node.fills;
  out.result.boundVariables2 = node.boundVariables;
} catch (e) {
  out.result.paintObjectAssign = String(e && e.message ? e.message : e);
}

node.remove();
return out;
