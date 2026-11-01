// Проверка: можно ли записать переменную как ALIAS на другую переменную.
const vars = await pixso.variables.getLocalVariablesAsync();
const base = vars.find((v) => v.name === "color/primary");
const floatBase = vars.find((v) => v.resolvedType === "FLOAT" || v.type === "FLOAT");

const shape = {
  baseId: base?.id,
  baseKeys: base ? Object.keys(base) : null,
  baseResolvedType: base?.resolvedType,
  floatId: floatBase?.id,
};

// смотрим, что вообще есть в ответе getLocalVariablesAsync
const raw = JSON.parse(JSON.stringify(vars.filter((v) => v.name === "color/primary")));
shape.rawSample = raw[0];
shape.valuesByModeSample = base?.valuesByMode ?? base?.value ?? null;
return shape;
