// Диагностика Label/Input внутри шага 1: отступы мастера и позиции в макете.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");
const frame = page.children.find((c) => c.name === "CompanyStep1");

const label = frame.findOne((n) => n.type === "INSTANCE" && n.name === "Label");
const input = frame.findOne((n) => n.type === "INSTANCE" && n.name === "Input");

const labelMaster = pixso.root.children
  .find((c) => c.name === "2 Atoms").children.find((c) => c.name === "Label");

const text = label?.findOne((n) => n.type === "TEXT");

return {
  labelInstance: label ? {
    x: Math.round(label.x), y: Math.round(label.y),
    w: Math.round(label.width), h: Math.round(label.height),
    pad: [label.paddingLeft, label.paddingRight, label.paddingTop, label.paddingBottom],
    mode: label.layoutMode,
  } : null,
  labelMaster: labelMaster ? {
    type: labelMaster.type,
    pad: [labelMaster.paddingLeft, labelMaster.paddingRight, labelMaster.paddingTop, labelMaster.paddingBottom],
    h: Math.round(labelMaster.height),
  } : null,
  labelText: text ? { chars: text.characters, x: Math.round(text.x), y: Math.round(text.y), fs: text.fontSize } : null,
  inputInstance: input ? {
    x: Math.round(input.x), y: Math.round(input.y), w: Math.round(input.width), h: Math.round(input.height),
    pad: [input.paddingLeft, input.paddingTop],
  } : null,
};
