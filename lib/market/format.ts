// Единственный форматтер чисел приложения. Правила — docs/05-design-system.md §4.
// Всегда ru-RU: запятая-разделитель, неразрывный пробел в тысячах, минус U+2212.

const NBSP = "\u00A0";
const MINUS = "\u2212";
const EMDASH = "\u2014";

function formatFixed(value: number, decimals: number): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const [int, frac] = abs.toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const fracPart = decimals > 0 ? "," + frac : "";
  return (negative ? MINUS : "") + grouped + fracPart;
}

function isMissing(value: number | null | undefined): value is null | undefined {
  return value === null || value === undefined || !Number.isFinite(value);
}

export function formatPrice(value: number | null, decimals: number): string {
  if (isMissing(value)) return EMDASH;
  return formatFixed(value, decimals) + NBSP + "₽";
}

export function formatDelta(value: number | null, decimals = 2): string {
  if (isMissing(value)) return EMDASH;
  const sign = value > 0 ? "+" : value < 0 ? MINUS : "";
  return sign + formatFixed(Math.abs(value), decimals) + "%";
}

export function formatDecimal(value: number | null, decimals = 2): string {
  if (isMissing(value)) return EMDASH;
  return formatFixed(value, decimals);
}

export function formatCap(value: number | null): string {
  if (isMissing(value)) return EMDASH;
  const abs = Math.abs(value);
  if (abs >= 1e12) return formatFixed(value / 1e12, 2) + NBSP + "трлн ₽";
  if (abs >= 1e9) return formatFixed(value / 1e9, 2) + NBSP + "млрд ₽";
  if (abs >= 1e6) return formatFixed(value / 1e6, 2) + NBSP + "млн ₽";
  if (abs >= 1e3) return formatFixed(value / 1e3, 2) + NBSP + "тыс. ₽";
  return formatFixed(value, 0) + NBSP + "₽";
}

export function formatTurnover(value: number | null): string {
  if (isMissing(value)) return EMDASH;
  const abs = Math.abs(value);
  if (abs >= 1e9) return formatFixed(value / 1e9, 1) + NBSP + "млрд ₽";
  if (abs >= 1e6) return formatFixed(value / 1e6, 0) + NBSP + "млн ₽";
  if (abs >= 1e3) return formatFixed(value / 1e3, 0) + NBSP + "тыс. ₽";
  return formatFixed(value, 0) + NBSP + "₽";
}

/** Лот, шаг цены: без лишних нулей. */
export function formatPlain(value: number | null): string {
  if (isMissing(value)) return EMDASH;
  const rounded = Number.parseFloat(value.toPrecision(12));
  return String(rounded).replace(".", ",");
}

/** Время среза: HH:MM:SS, местное. */
export function formatTime(value: string | null): string {
  if (!value) return EMDASH;
  const timePart = value.includes("T")
    ? value.split("T")[1]
    : value.split(" ").pop() ?? value;
  const m = timePart.match(/^(\d{2}:\d{2}:\d{2})/);
  return m ? m[1] : value;
}
