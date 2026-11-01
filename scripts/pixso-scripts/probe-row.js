// Почему строка с чекбоксом сжата.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");
pixso.currentPage = page;
const frame = page.children.find((c) => c.name === "CompanyStep1");
const row = frame.findOne((n) => n.name === "stack/HORIZONTAL" && n.children?.some((c) => c.name === "Checkbox"));
if (!row) return { error: "строка не найдена", names: frame.findAll((n) => n.name.startsWith("stack")).map((n) => n.name) };

const textInst = row.children.find((c) => c.name === "Text");
const t = textInst?.findOne((n) => n.type === "TEXT");

return {
  row: { w: Math.round(row.width), mode: row.layoutMode, primary: row.primaryAxisSizingMode, counter: row.counterAxisSizingMode, align: row.layoutAlign },
  children: row.children.map((c) => ({ name: c.name, type: c.type, w: Math.round(c.width), mode: c.layoutMode })),
  textInst: textInst ? { w: Math.round(textInst.width), primary: textInst.primaryAxisSizingMode, grow: textInst.layoutGrow } : null,
  text: t ? { w: Math.round(t.width), auto: t.textAutoResize, grow: t.layoutGrow, chars: t.characters } : null,
};
