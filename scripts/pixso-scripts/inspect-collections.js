// Вернуть коллекции переменных с режимами — источник истины для verify-tokens.
const collections = await pixso.variables.getLocalVariableCollectionsAsync();
const variables = await pixso.variables.getLocalVariablesAsync();

return collections.map((c) => ({
  id: c.id,
  name: c.name,
  modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
  variableCount: variables.filter((v) => v.variableCollectionId === c.id).length,
  sample: variables
    .filter((v) => v.variableCollectionId === c.id)
    .slice(0, 3)
    .map((v) => ({ name: v.name, resolvedType: v.resolvedType })),
}));
