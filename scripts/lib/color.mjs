// oklch()/oklab()/hex → sRGB. Без зависимостей: формула Oklab из CSS Color 4.

const clamp01 = (v) => Math.min(1, Math.max(0, v));

function srgbFromLinear(v) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function linearFromSrgb(v) {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Oklab → линейный sRGB (может выйти за 0..1 при насыщенных цветах). */
function oklabToLinearRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** true, если цвет после перевода в sRGB выходит за пределы гаммы. */
function isOutOfGamut(rgb) {
  return rgb.some((v) => v < -0.0005 || v > 1.0005);
}

/** Снижаем chroma, пока цвет не попадёт в гамму (стандартный CSS-подход). */
function clipToGamut(L, C, H) {
  const rad = (H * Math.PI) / 180;
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const rgb = oklabToLinearRgb(L, mid * Math.cos(rad), mid * Math.sin(rad));
    if (isOutOfGamut(rgb)) hi = mid;
    else lo = mid;
  }
  return oklabToLinearRgb(L, lo * Math.cos(rad), lo * Math.sin(rad));
}

/**
 * @param {string} input css-значение цвета
 * @returns {{hex: string, rgba: {r:number,g:number,b:number,a:number}} | null}
 */
export function parseCssColor(input) {
  const src = String(input).trim();

  const hex = src.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 6) h += "ff";
    if (h.length !== 8) return null;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = parseInt(h.slice(6, 8), 16);
    return { hex: `#${h.slice(0, 6).toUpperCase()}`, rgba: { r, g, b, a } };
  }

  const fn = src.match(/^(oklch|oklab)\(\s*([^)]+)\)$/i);
  if (!fn) return null;

  const [main, alphaPart] = fn[2].split("/");
  const parts = main.trim().split(/\s+/);

  let L;
  let C;
  let H = 0;

  if (fn[1].toLowerCase() === "oklch") {
    L = parsePercentOrNumber(parts[0]);
    C = parseFloat(parts[1]);
    H = parts[2] === "none" ? 0 : parseFloat(parts[2]);
  } else {
    L = parsePercentOrNumber(parts[0]);
    const a = parseFloat(parts[1]);
    const b = parseFloat(parts[2]);
    C = Math.hypot(a, b);
    H = (Math.atan2(b, a) * 180) / Math.PI;
  }

  if ([L, C, H].some((v) => Number.isNaN(v))) return null;

  const alpha = alphaPart ? parseAlpha(alphaPart) : 1;
  const lin = isOutOfGamut(oklabToLinearRgb(L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)))
    ? clipToGamut(L, C, H)
    : oklabToLinearRgb(L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180));

  const [r, g, b] = lin.map((v) => Math.round(clamp01(srgbFromLinear(clamp01(v))) * 255));
  const a = Math.round(clamp01(alpha) * 255);

  return { hex: rgbToHex(r, g, b), rgba: { r, g, b, a } };
}

function parsePercentOrNumber(v) {
  if (v?.endsWith("%")) return parseFloat(v) / 100;
  return parseFloat(v);
}

function parseAlpha(v) {
  const t = v.trim();
  return t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t);
}

export function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** '#AABBCC' → {r,g,b,a:255} */
export function hexToRgba(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255,
  };
}
