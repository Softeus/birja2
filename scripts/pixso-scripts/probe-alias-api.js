// Проверка алиасов через Plugin API (не через MCP write_variables).
const vars = await pixso.variables.getLocalVariablesAsync();
const base = vars.find((v) => v.name === "color/primary");
const out = { api: { createVariableAlias: typeof pixso.variables.createVariableAlias } };

if (!base) return { error: "нет color/primary" };

// создаём временную переменную в той же коллекции
const colls = await pixso.variables.getLocalVariableCollectionsAsync();
const semantic = colls.find((c) => c.name === "Semantic");
const modeLight = semantic.modes.find((m) => m.name === "Light");
const modeDark = semantic.modes.find((m) => m.name === "Dark");

let tmp;
try {
  tmp = pixso.variables.createVariable("probe/aliasViaApi", semantic, "COLOR");
  out.created = true;
} catch (e) {
  return { ...out, createError: String(e && e.message ? e.message : e) };
}

try {
  const alias = pixso.variables.createVariableAlias(base);
  out.aliasShape = JSON.parse(JSON.stringify(alias));
  tmp.setValueForMode(modeLight.modeId, alias);
  tmp.setValueForMode(modeDark.modeId, alias);
  out.setOk = true;
} catch (e) {
  out.setError = String(e && e.message ? e.message : e);
}

// читаем обратно
const fresh = (await pixso.variables.getLocalVariablesAsync()).find((v) => v.name === "probe/aliasViaApi");
out.resolved = fresh ? JSON.parse(JSON.stringify(fresh.valuesByMode ?? {})) : null;

if (fresh) fresh.remove();
return out;
