// Аудит собранных экранов: привязки токенов, detached-инстансы, "сырые" заливки.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");
if (!page) return { error: "нет страницы Screens" };
pixso.currentPage = page;

const frames = page.children.filter((c) => c.type === "FRAME");
const report = { screens: [], totals: { instances: 0, detached: 0, rawFills: 0, unboundText: 0 } };

for (const frame of frames) {
  const row = { name: frame.name, instances: 0, detached: 0, rawFills: 0, unboundText: 0, rawExamples: [] };

  const walk = (node) => {
    if (node.type === "INSTANCE") {
      row.instances++;
      if (node.isDetached) row.detached++;
    }

    const paints = [];
    if (Array.isArray(node.fills)) paints.push(...node.fills);
    if (Array.isArray(node.strokes)) paints.push(...node.strokes);

    for (const p of paints) {
      if (p.type !== "SOLID" || p.visible === false) continue;
      const bound = p.boundVariables?.color || node.boundVariables?.fills || node.boundVariables?.strokes;
      if (!bound) {
        row.rawFills++;
        if (row.rawExamples.length < 3) row.rawExamples.push({ name: node.name, type: node.type });
      }
    }

    for (const child of node.children ?? []) walk(child);
  };

  walk(frame);
  report.totals.instances += row.instances;
  report.totals.detached += row.detached;
  report.totals.rawFills += row.rawFills;
  report.totals.unboundText += row.unboundText;
  report.screens.push(row);
}

return report;
