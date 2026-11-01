// Эксперимент: как заставить текст в инстансе занять ширину контейнера.
const page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");
pixso.currentPage = page;
const frame = page.children.find((c) => c.name === "CompanySuccess");
const inst = frame.children.find((c) => c.type === "INSTANCE" && c.name === "Text");
const t = inst.findOne((n) => n.type === "TEXT");

const before = { instW: inst.width, instLayout: inst.layoutMode, tW: t.width, tAuto: t.textAutoResize, tAlign: t.layoutAlign };

const steps = {};
const attempt = (name, fn) => {
  try {
    fn();
    steps[name] = { ok: true, instW: inst.width, tW: t.width, tAlign: t.layoutAlign, tAuto: t.textAutoResize };
  } catch (e) {
    steps[name] = { error: String(e && e.message ? e.message : e) };
  }
};

attempt("resize", () => inst.resize(frame.width - 48, inst.height));
attempt("t-stretch", () => { t.layoutAlign = "STRETCH"; });
attempt("t-autoresize", () => { t.textAutoResize = "HEIGHT"; });
attempt("t-fill", () => { t.textAutoResize = "NONE"; t.resize(inst.width, t.height); });
attempt("t-auto-width", () => { t.textAutoResize = "WIDTH_AND_HEIGHT"; });

return { before, after: { instW: inst.width, tW: t.width, tAlign: t.layoutAlign, tAuto: t.textAutoResize }, steps };
