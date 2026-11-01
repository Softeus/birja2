// Комбинация: instance FIXED по главной оси + текст STRETCH.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");
pixso.currentPage = page;
const frame = page.children.find((c) => c.name === "CompanySuccess");
const inst = frame.children.find((c) => c.type === "INSTANCE" && c.name === "Text");
const t = inst.findOne((n) => n.type === "TEXT");

const log = [];
const attempt = (name, fn) => {
  try {
    fn();
    log.push({ name, ok: true, instW: Math.round(inst.width), tW: Math.round(t.width), tAlign: t.layoutAlign, tAuto: t.textAutoResize, prim: inst.primaryAxisSizingMode });
  } catch (e) {
    log.push({ name, error: String(e && e.message ? e.message : e) });
  }
};

attempt("size-fixed", () => { inst.primaryAxisSizingMode = "FIXED"; });
attempt("text-stretch", () => { t.layoutAlign = "STRETCH"; });
attempt("text-height", () => { t.textAutoResize = "HEIGHT"; });
attempt("refit", () => { inst.resize(432, inst.height); t.resize(432, t.height); });

return { frameW: frame.width, log, final: { instW: Math.round(inst.width), instH: Math.round(inst.height), tW: Math.round(t.width), tH: Math.round(t.height) } };
