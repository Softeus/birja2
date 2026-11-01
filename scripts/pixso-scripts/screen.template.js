// Сборщик экрана из UI-AST. Выполняется через eval_script.
// __AST__ / __MANIFEST__ подставляет scripts/ds/assemble-screen.mjs.
const AST = __AST__;
const MANIFEST = __MANIFEST__;
const POS = __POS__;

const vars = await pixso.variables.getLocalVariablesAsync();
const varByName = new Map(vars.map((v) => [v.name, v]));

function hexToRgb(hex) {
  const h = String(hex).replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
}

function paint(node, tokenName) {
  const v = varByName.get(tokenName);
  if (!v) return;
  const fallback = { type: "SOLID", color: { r: 1, g: 1, b: 1 } };
  try {
    node.fills = [pixso.variables.setBoundVariableForPaint(fallback, "color", v)];
  } catch {
    /* остаётся как есть */
  }
}

async function ensurePage(name) {
  let page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === name);
  if (!page) {
    page = pixso.createPage();
    page.name = name;
  }
  return page;
}

const page = await ensurePage("Screens");
pixso.currentPage = page;

const existing = page.children.find((c) => c.name === AST.screen);
if (existing) existing.remove();
// Pixso иногда оставляет дубли вида "Heatmap/черновик" — чистим их тоже.
for (const c of [...page.children]) {
  if (c.name === AST.screen || c.name.startsWith(`${AST.screen}/`)) c.remove();
}

const frame = pixso.createFrame();
frame.name = AST.screen;
page.appendChild(frame);
frame.layoutMode = "VERTICAL";
frame.resize(AST.frame.width, 10);
frame.primaryAxisSizingMode = "AUTO";
frame.counterAxisSizingMode = "FIXED";
frame.resize(AST.frame.width, frame.height);
frame.itemSpacing = AST.frame.gap ?? 16;
const pad = AST.frame.padding ?? 24;
frame.paddingTop = pad;
frame.paddingBottom = pad;
frame.paddingLeft = pad;
frame.paddingRight = pad;
frame.fills = [];
paint(frame, AST.frame.background ?? "color/background");

// Раскладка потока: строго слева направо, выравнивание по верхнему краю.
frame.x = POS?.x ?? 0;
frame.y = POS?.y ?? 0;

const HUG_COMPONENTS = new Set(["Badge", "Checkbox", "Radio", "Switch", "Label"]);

const report = { screen: AST.screen, frameId: frame.id, instances: [], errors: [], missing: [] };

function masterFor(componentName, props) {
  const meta = MANIFEST.components[componentName];
  if (!meta) throw new Error(`нет компонента ${componentName}`);
  const set = pixso.getNodeById(meta.nodeId);
  if (!set) throw new Error(`узел ${meta.nodeId} не найден (${componentName})`);

  if (set.type === "COMPONENT") return set;

  const candidates = set.children.filter((c) => c.type === "COMPONENT");
  const scored = candidates
    .map((c) => {
      const own = {};
      for (const part of c.name.split(",")) {
        const [k, v] = part.split("=").map((s) => s && s.trim());
        if (k && v) own[k] = v;
      }
      const matches = Object.entries(props ?? {}).every(([k, v]) => own[k] === v);
      return { node: c, matches, own };
    })
    .filter((c) => c.matches);

  return scored[0]?.node ?? candidates[0];
}

async function setSlotText(instance, slotName, value) {
  const text = instance.findOne((n) => n.type === "TEXT" && (n.name === slotName || n.name === "label" || n.name === "text"));
  const all = instance.findAll ? instance.findAll((n) => n.type === "TEXT") : [];
  const target = all.find((n) => n.name === slotName) ?? text ?? all[0];
  if (!target) {
    report.missing.push(`${instance.name}: нет текстового слоя для слота ${slotName}`);
    return;
  }
  try {
    await pixso.loadFontAsync(target.fontName);
  } catch {
    /* шрифт уже загружен */
  }
  target.characters = value;

  // Переносы: высота по контенту, ширина наследуется от мастера.
  try {
    target.textAutoResize = "HEIGHT";
  } catch {
    /* noop */
  }
}

async function build(node, parent) {
  if (node.type === "stack") {
    const box = pixso.createFrame();
    box.name = `stack/${node.direction}`;
    parent.appendChild(box);
    box.layoutMode = node.direction ?? "VERTICAL";
    box.primaryAxisSizingMode = "AUTO";
    box.counterAxisSizingMode = node.direction === "HORIZONTAL" ? "AUTO" : "FIXED";
    box.itemSpacing = node.gap ?? 12;
    const p = node.padding ?? 0;
    box.paddingTop = p;
    box.paddingBottom = p;
    box.paddingLeft = p;
    box.paddingRight = p;
    box.fills = [];
    if (node.grow && box.parent?.layoutMode === "HORIZONTAL") {
      box.layoutGrow = Number(node.grow);
      box.primaryAxisSizingMode = "AUTO";
    } else if ((node.stretch ?? !HUG_COMPONENTS.has(node.component)) !== false && box.parent?.layoutMode) {
      box.layoutAlign = "STRETCH";
    }

    for (const child of node.children) await build(child, box);
    return;
  }

  if (node.type === "heatmap") {
    const box = pixso.createFrame();
    box.name = "heatmap";
    parent.appendChild(box);
    box.layoutMode = "NONE";
    box.resize(node.width, node.height);
    box.fills = [];
    if (parent.layoutMode === "VERTICAL") {
      const w = parent.width - (parent.paddingLeft ?? 0) - (parent.paddingRight ?? 0);
      if (w > 0) box.resize(w, node.height);
    }

    for (const s of node.sectors ?? []) {
      const sframe = pixso.createFrame();
      box.appendChild(sframe);
      sframe.layoutMode = "NONE";
      sframe.resize(s.width, s.height);
      sframe.x = s.x;
      sframe.y = s.y;
      sframe.fills = [];
      sframe.strokes = [];
      const borderVar = varByName.get("color/border");
      if (borderVar) {
        try {
          sframe.strokes = [pixso.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 1, g: 1, b: 1 } }, "color", borderVar)];
        } catch { /* noop */ }
      }
      sframe.strokeWeight = 1;

      if (s.sector) {
        const label = pixso.createText();
        box.appendChild(label);
        label.characters = s.sector;
        try { await pixso.loadFontAsync({ family: "Inter", style: "Medium" }); } catch { /* ok */ }
        label.fontName = { family: "Inter", style: "Medium" };
        label.fontSize = 12;
        paint(label, "color/muted-foreground", "fills");
        label.x = s.x + 4;
        label.y = s.y + 2;
      }

      for (const t of s.tiles ?? []) {
        const tile = pixso.createRectangle();
        box.appendChild(tile);
        tile.resize(t.width, t.height);
        tile.x = t.x;
        tile.y = t.y;
        tile.cornerRadius = 3;
        paint(tile, `color/${t.level}`, "fills");

        const tt = pixso.createText();
        box.appendChild(tt);
        tt.characters = t.label ?? t.secId;
        try { await pixso.loadFontAsync({ family: "Inter", style: "Medium" }); } catch { /* ok */ }
        tt.fontName = { family: "Inter", style: "Medium" };
        tt.fontSize = 12;
        const font12 = varByName.get("font/12");
        if (font12) {
          try { tt.setBoundVariable("fontSize", font12); } catch { /* ok */ }
        }
        tt.x = t.x + 4;
        tt.y = t.y + 3;
        const strong = t.level.endsWith("-2") || t.level.endsWith("-3");
        paint(tt, strong ? "color/background" : "color/foreground", "fills");
      }
    }

    report.instances.push({ component: "heatmap", id: box.id });
    return;
  }

  const master = masterFor(node.component, node.props);
  if (!master) {
    report.errors.push(`не найден мастер для ${node.component}`);
    return;
  }

  const instance = master.createInstance();
  parent.appendChild(instance);
  if ((node.stretch ?? !HUG_COMPONENTS.has(node.component)) !== false) {
    try {
      instance.layoutAlign = "STRETCH";
    } catch {
      /* вне автолейаута */
    }
  }

  for (const [slot, value] of Object.entries(node.slots ?? {})) {
    await setSlotText(instance, slot, value);
  }

  // В автолейауте ширина не наследуется инстансом: растягиваем либо по главной
  // оси (layoutGrow), либо по поперечной (layoutAlign), в зависимости от макета.
  try {
    const hasText = instance.findAll && instance.findAll((n) => n.type === "TEXT").length > 0;
    const stretch = (node.stretch ?? !HUG_COMPONENTS.has(node.component)) !== false;

    if (!stretch) {
      // Компактные компоненты (Badge, Label, Checkbox, Switch) — по содержимому.
      if (instance.layoutMode === "HORIZONTAL" || instance.layoutMode === "VERTICAL") {
        instance.primaryAxisSizingMode = "AUTO";
        instance.counterAxisSizingMode = "AUTO";
      }
      for (const t of instance.findAll((n) => n.type === "TEXT")) {
        t.textAutoResize = "WIDTH_AND_HEIGHT";
      }
    } else if (node.grow && parent.layoutMode === "HORIZONTAL") {
      instance.layoutGrow = Number(node.grow);
      instance.primaryAxisSizingMode = "AUTO";
    } else if (parent.layoutMode === "HORIZONTAL" && hasText) {
      instance.primaryAxisSizingMode = "AUTO";
      for (const t of instance.findAll((n) => n.type === "TEXT")) {
        t.textAutoResize = "WIDTH_AND_HEIGHT";
      }
    }

    if (stretch && parent.layoutMode === "VERTICAL" && instance.layoutMode) {
      const width = parent.width - (parent.paddingLeft ?? 0) - (parent.paddingRight ?? 0);
      if (width > 0) {
        const vertical = instance.layoutMode === "VERTICAL";
        if (vertical) {
          // Вертикальные компоненты (Card, Dialog) тянутся по ширине, высота — по контенту.
          instance.counterAxisSizingMode = "FIXED";
          instance.resize(width, instance.height);
          instance.primaryAxisSizingMode = "AUTO";
          instance.counterAxisSizingMode = "FIXED";
        } else {
          // Горизонтальные инстансы: ширина из контейнера, высота — как в мастере.
          const masterCounter = master.counterAxisSizingMode;
          instance.primaryAxisSizingMode = "FIXED";
          instance.resize(width, instance.height);
          instance.counterAxisSizingMode = masterCounter ?? "AUTO";
        }

        const inner = width - (instance.paddingLeft ?? 0) - (instance.paddingRight ?? 0);
        for (const t of instance.findAll((n) => n.type === "TEXT")) {
          if (!vertical) {
            t.layoutGrow = 1;
            t.textAutoResize = "HEIGHT";
          } else {
            t.layoutAlign = "STRETCH";
            t.textAutoResize = "HEIGHT";
            t.resize(Math.max(inner, 24), t.height);
          }
        }
      }
    }
  } catch {
    /* noop */
  }

  report.instances.push({ component: node.component, id: instance.id, master: master.name });
}

for (const el of AST.elements) await build(el, frame);

pixso.currentPage.selection = [frame];
return report;
