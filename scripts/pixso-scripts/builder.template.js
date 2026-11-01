// Генератор компонентов ДС в Pixso. Выполняется через eval_script.
// Генератор подставляет спецификацию в строку "const SPEC = ..." ниже.
const SPEC = __SPEC__;
const TOKENS = __TOKENS__;

const report = { page: null, created: [], errors: [], skipped: [] };

const vars = await pixso.variables.getLocalVariablesAsync();
const varByName = new Map(vars.map((v) => [v.name, v]));

function hexToRgb(hex) {
  const h = String(hex).replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

/** Ставим конкретный цвет из токена и привязываем переменную к paint. */
function paint(node, tokenName, field = "fills") {
  const hex = TOKENS[tokenName];
  if (!hex) return false;

  const base = { type: "SOLID", color: hexToRgb(hex) };
  const v = varByName.get(tokenName);

  if (v) {
    try {
      node[field] = [pixso.variables.setBoundVariableForPaint(base, "color", v)];
      return true;
    } catch {
      /* откатываемся на несвязанный цвет */
    }
  }
  node[field] = [base];
  return false;
}

/** Числовое значение: либо число, либо имя FLOAT-токена (space/16, font/14). */
function numValue(v, fallback) {
  if (v === undefined || v === null) return fallback;
  if (typeof v === "number") return v;
  const token = TOKENS[v];
  return typeof token === "number" ? token : Number(v);
}

/** Имя токена, если значение задано строкой из шкалы. */
function numToken(v) {
  return typeof v === "string" && typeof TOKENS[v] === "number" ? v : null;
}

function bindNumber(node, field, tokenName) {  const value = TOKENS[tokenName];
  const v = varByName.get(tokenName);
  if (v) {
    try {
      node.setBoundVariable(field, v);
      return true;
    } catch {
      /* ниже поставим число */
    }
  }
  if (typeof value === "number" && field === "cornerRadius") node.cornerRadius = value;
  return false;
}
const varId = (name) => {
  const v = varByName.get(name);
  if (!v) throw new Error(`переменная не найдена: ${name}`);
  return v; // Pixso принимает объект переменной, не строковый id
};

function product(axes) {
  const keys = Object.keys(axes ?? {});
  if (!keys.length) return [{}];
  let acc = [{}];
  for (const key of keys) {
    const next = [];
    for (const partial of acc) {
      for (const value of axes[key]) next.push({ ...partial, [key]: value });
    }
    acc = next;
  }
  return acc;
}

function comboName(combo) {
  return Object.entries(combo)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

function solid(color) {
  return { type: "SOLID", color };
}

async function ensurePage(name) {
  let page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === name);
  if (!page) {
    page = pixso.createPage();
    page.name = name;
  }
  return page;
}

function findByPath(root, path) {
  let node = root;
  for (const name of path) {
    node = node.children.find((c) => c.name === name);
    if (!node) return null;
  }
  return node;
}

// Страницы уровней: страница = уровень ДС. «Components» переименовываем в «2 Atoms».
const legacyComponents = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Components");
const pageSpecs = SPEC.pages ?? [{ name: SPEC.page }];
const pages = new Map();

for (const p of pageSpecs) {
  let page = pixso.root.children.find((c) => c.type === "PAGE" && c.name === p.name);
  if (!page && legacyComponents && p.name === "2 Atoms") {
    legacyComponents.name = p.name;
    page = legacyComponents;
  }
  if (!page) {
    page = pixso.createPage();
    page.name = p.name;
  }
  pages.set(p.name, page);
}

const defaultPage = pages.get(SPEC.page) ?? pages.values().next().value;

// Чистка и сетка считаются отдельно для каждой страницы уровня.
const GRID_GAP = 80;
const GRID_MAX_WIDTH = 1600;
const pageState = new Map();
for (const [name, page] of pages) {
  const keep = new Set(SPEC.components.filter((c) => (c.page ?? SPEC.page) === name).map((c) => c.name));
  pageState.set(name, { page, keep, x: 0, y: 0, rowHeight: 0, removed: [] });

  for (const child of [...page.children]) {
    if ((child.type === "COMPONENT" || child.type === "COMPONENT_SET") && !keep.has(child.name)) {
      pageState.get(name).removed.push(child.name);
      child.remove();
    }
  }
}

report.pages = [...pages].map(([name, page]) => ({ name, id: page.id, removed: pageState.get(name).removed }));

// Заголовок-подпись уровня на каждой странице (идемпотентно, обычные тексты).
for (const p of pageSpecs) {
  const page = pages.get(p.name);
  for (const old of [...page.children]) {
    if (old.name === "_level_note" || old.name === "_level_title") old.remove();
  }

  try {
    await pixso.loadFontAsync({ family: "Inter", style: "Semi Bold" });
    const title = pixso.createText();
    title.name = "_level_title";
    title.fontName = { family: "Inter", style: "Semi Bold" };
    title.characters = `Уровень ${p.level ?? ""} · ${p.name.replace(/^\d+\s*/, "")}`.trim();
    title.fontSize = 22;
    title.textAutoResize = "WIDTH_AND_HEIGHT";
    page.appendChild(title);
    paint(title, "color/foreground", "fills");
    title.x = 0;
    title.y = -140;

    await pixso.loadFontAsync({ family: "Inter", style: "Regular" });
    const note = pixso.createText();
    note.name = "_level_note";
    note.fontName = { family: "Inter", style: "Regular" };
    note.characters = p.note ?? "";
    note.fontSize = 13;
    note.textAutoResize = "WIDTH_AND_HEIGHT";
    page.appendChild(note);
    paint(note, "color/muted-foreground", "fills");
    note.x = 0;
    note.y = -108;
  } catch {
    /* подпись не критична */
  }
}

// Порядок страниц: 1…7, затем Screens, затем пользовательские страницы.
try {
  const order = [...pageSpecs.map((p) => pages.get(p.name))];
  const screensPage = pixso.root.children.find((c) => c.type === "PAGE" && c.name === "Screens");
  if (screensPage) order.push(screensPage);
  for (const page of pixso.root.children.filter((c) => c.type === "PAGE")) {
    if (!order.includes(page)) order.push(page);
  }
  order.forEach((page, index) => pixso.root.insertChild(index, page));
} catch {
  /* порядок страниц не критичен */
}

function applyBox(node, box, combo, sizeDef) {
  if (!box) return;

  if (box.width) node.resize(box.width, node.height);
  if (box.height) node.resize(node.width, box.height);
  if (box.paddingX !== undefined) {
    const px = numValue(box.paddingX, 0);
    node.paddingLeft = px;
    node.paddingRight = px;
    const t = numToken(box.paddingX);
    if (t) {
      bindNumber(node, "paddingLeft", t);
      bindNumber(node, "paddingRight", t);
    }
  }
  if (box.paddingY !== undefined) {
    const py = numValue(box.paddingY, 0);
    node.paddingTop = py;
    node.paddingBottom = py;
    const t = numToken(box.paddingY);
    if (t) {
      bindNumber(node, "paddingTop", t);
      bindNumber(node, "paddingBottom", t);
    }
  }

  if (box.fill !== undefined) {
    if (box.fill === null) node.fills = [];
    else paint(node, box.fill, "fills");
  }

  if (box.border) {
    paint(node, box.border, "strokes");
    node.strokeWeight = 1;
    node.strokeAlign = "INSIDE";
  } else if (box.border === null) {
    node.strokes = [];
  }

  if (box.radius) bindNumber(node, "cornerRadius", box.radius);
  if (box.radiusPx) node.cornerRadius = box.radiusPx;
}

for (const comp of SPEC.components) {
  const pageStateForComp = pageState.get(comp.page ?? SPEC.page) ?? pageState.get(SPEC.page);
  const page = pageStateForComp.page;
  pixso.currentPage = page;
  try {
    const existing = page.children.find((c) => (c.type === "COMPONENT_SET" || c.type === "COMPONENT") && c.name === comp.name);
    if (existing) {
      existing.remove();
      report.created.push({ name: comp.name, replaced: true });
    }

    const combos = product(comp.axes);
    const components = [];
    const axisKeys = Object.keys(comp.axes ?? {});
    const gridIndex = (combo, axis) => {
      const values = comp.axes?.[axis] ?? [];
      const idx = values.indexOf(combo[axis]);
      return idx < 0 ? 0 : idx;
    };
    const colAxis = axisKeys[0];
    const rowAxis = axisKeys[1];

    for (const combo of combos) {
      const variantKey = comp.variantAxis ?? "variant";
      const sizeDef = comp.sizes?.[combo.size] ?? comp.sizes?.[combo[variantKey]] ?? comp.sizes?.default ?? {};
      const variantDef = comp.variants?.[combo[variantKey]] ?? comp.variants?.default ?? {};
      const dims = comp.dimsByVariant?.[combo[variantKey]] ?? {};
      const explicitWidth = dims.width ?? comp.width;
      const width = explicitWidth ?? 120;
      const height = dims.height ?? sizeDef.height ?? comp.height;

      const node = pixso.createComponent();
      node.name = comboName(combo) || comp.name;
      page.appendChild(node);

      const colStep = Math.max(200, (comp.width ?? 120) + 60);
      if (colAxis) node.x = 32 + gridIndex(combo, colAxis) * colStep;
      if (rowAxis) node.y = 32 + gridIndex(combo, rowAxis) * 64;

      const layout = comp.layout ?? {};
      const isAbsolute = (layout.mode ?? "HORIZONTAL") === "NONE";

      if (isAbsolute) {
        node.layoutMode = "NONE";
      } else {
        node.layoutMode = layout.mode ?? "HORIZONTAL";
        node.primaryAxisAlignItems = layout.justify ?? "CENTER";
        node.counterAxisAlignItems = layout.align ?? "CENTER";
        node.itemSpacing = layout.gap ?? 8;
      }

      const isVertical = (layout.mode ?? "HORIZONTAL") === "VERTICAL";

      if (isAbsolute) {
        node.resize(width, height ?? node.height);
      } else if (isVertical) {
        node.counterAxisSizingMode = "FIXED";
        node.resize(width, node.height);
        // resize() сбрасывает sizing modes: высота по контенту, ширина фиксирована.
        node.primaryAxisSizingMode = "AUTO";
        node.counterAxisSizingMode = "FIXED";
      } else if (height) {
        node.counterAxisSizingMode = "FIXED";
        node.resize(width, height);
        // resize() сбрасывает sizing modes — возвращаем автo-ширину после него.
        node.primaryAxisSizingMode = comp.autoWidth === false ? "FIXED" : "AUTO";
      } else if (explicitWidth) {
        node.counterAxisSizingMode = "AUTO";
        node.resize(width, node.height);
      } else {
        // Компоненты без фиксированных размеров (Text, Heading, Label) — hug по контенту.
        node.primaryAxisSizingMode = "AUTO";
        node.counterAxisSizingMode = "AUTO";
      }

      if (!isAbsolute) {
        const padXsrc = comp.paddingX ?? sizeDef.paddingX ?? 12;
        const padYsrc = comp.paddingY ?? sizeDef.paddingY ?? 8;
        const padX = numValue(padXsrc, 12);
        const padY = numValue(padYsrc, 8);

        node.paddingLeft = padX;
        node.paddingRight = padX;
        node.paddingTop = padY;
        node.paddingBottom = padY;

        const padXtoken = numToken(padXsrc);
        if (padXtoken) {
          bindNumber(node, "paddingLeft", padXtoken);
          bindNumber(node, "paddingRight", padXtoken);
        }
        const padYtoken = numToken(padYsrc);
        if (padYtoken) {
          bindNumber(node, "paddingTop", padYtoken);
          bindNumber(node, "paddingBottom", padYtoken);
        }
      }

      applyBox(node, comp.box, combo, sizeDef);

      if (variantDef.fill !== undefined) {
        if (variantDef.fill === null) node.fills = [];
        else paint(node, variantDef.fill, "fills");
      }
      if (variantDef.border) {
        paint(node, variantDef.border, "strokes");
        node.strokeWeight = 1;
        node.strokeAlign = "INSIDE";
      }
      if (comp.radius) bindNumber(node, "cornerRadius", comp.radius);

      for (const child of comp.children ?? []) {
        if (child.when && !Object.entries(child.when).every(([k, v]) => combo[k] === v)) continue;
        const childNode = await buildChild(child, combo, sizeDef, variantDef, variantKey);
        node.appendChild(childNode);
        if (child.x !== undefined) childNode.x = child.x;
        if (child.y !== undefined) childNode.y = child.y;

        // Для узлов без автолейаута заливка надёжнее применяется после appendChild.
        if (child.type === "rect") {
          const token = child.colorByVariant?.[combo[variantKey]] ?? child.color;
          if (token) paint(childNode, token, "fills");
          if (child.border) paint(childNode, child.border, "strokes");
          if (child.radiusPx) childNode.cornerRadius = child.radiusPx;
        }
      }

      components.push(node);
    }

    let setNode = components[0];
    if (components.length > 1) {
      setNode = pixso.combineAsVariants(components, page);
      setNode.name = comp.name;
    } else {
      components[0].name = comp.name;
    }

    report.created.push({
      component: comp.name,
      id: setNode.id,
      key: setNode.key,
      type: setNode.type,
      variants: components.length,
      variantProperties: Object.keys(comp.axes ?? {}),
    });

    // Ставим набор в сетку своей страницы: слева направо, при переполнении — новая строка.
    setNode.x = pageStateForComp.x;
    setNode.y = pageStateForComp.y;
    pageStateForComp.x += Math.ceil(setNode.width) + GRID_GAP;
    pageStateForComp.rowHeight = Math.max(pageStateForComp.rowHeight, Math.ceil(setNode.height));
    if (pageStateForComp.x > GRID_MAX_WIDTH) {
      pageStateForComp.x = 0;
      pageStateForComp.y += pageStateForComp.rowHeight + GRID_GAP;
      pageStateForComp.rowHeight = 0;
    }
  } catch (err) {
    report.errors.push({ component: comp.name, error: String(err && err.message ? err.message : err) });
  }
}

async function buildChild(child, combo, sizeDef, variantDef, variantKey) {
  if (child.type === "text") {
    const fontFamily = child.fontFamily ?? "Inter";
    let fontStyle = child.fontStyleFromSize ? sizeDef.fontStyle ?? "Regular" : child.fontStyle ?? "Regular";
    try {
      await pixso.loadFontAsync({ family: fontFamily, style: fontStyle });
    } catch {
      fontStyle = "Regular";
      await pixso.loadFontAsync({ family: fontFamily, style: fontStyle });
    }

    const text = pixso.createText();
    text.name = child.name ?? "text";
    text.fontName = { family: fontFamily, style: fontStyle };
    text.characters = child.value ?? "Text";
    const fontSource = child.fontSizeFromSize ? sizeDef.fontSize ?? 14 : child.fontSize ?? 14;
    text.fontSize = numValue(fontSource, 14);
    const fontToken = numToken(fontSource);
    if (fontToken) bindNumber(text, "fontSize", fontToken);

    let colorToken = child.color;
    if (child.colorFromVariant) colorToken = variantDef.text;
    if (child.colorByVariant?.[combo[variantKey]]) colorToken = child.colorByVariant[combo[variantKey]];

    if (colorToken) paint(text, colorToken, "fills");
    if (child.width === "FILL") text.layoutGrow = 1;
    if (child.stretch) {
      text.textAutoResize = "HEIGHT";
      text.layoutAlign = "STRETCH";
    } else {
      // Текст в кнопках/подписях должен сам менять ширину под содержимое.
      text.textAutoResize = "WIDTH_AND_HEIGHT";
    }
    return text;
  }

  if (child.type === "rect") {
    const rect = pixso.createRectangle();
    rect.name = child.name ?? "rect";
    rect.resize(child.width ?? 16, child.height ?? 16);
    if (child.color) paint(rect, child.color, "fills");
    else rect.fills = [];
    if (child.border) {
      paint(rect, child.border, "strokes");
      rect.strokeWeight = 1;
      rect.strokeAlign = "INSIDE";
    }
    if (child.radius) bindNumber(rect, "cornerRadius", child.radius);
    if (child.radiusPx) rect.cornerRadius = child.radiusPx;
    return rect;
  }

  throw new Error(`неизвестный тип узла: ${child.type}`);
}

return report;
