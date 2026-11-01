// Парсер ISS. Читает блоки {columns, data} ТОЛЬКО по именам колонок:
// отсутствующая колонка даёт null, а не падение (FR-02).
import type { Quote, SessionState, TradingStatus } from "./types";
import { sectorOf } from "./sectors";

export type IssBlock = { columns: string[]; data: unknown[][] } | null | undefined;
export type IssRow = Record<string, unknown>;

export function parseIssBlock(block: IssBlock): IssRow[] {
  if (!block || !Array.isArray(block.columns) || !Array.isArray(block.data)) return [];
  const { columns, data } = block;
  return data.map((raw) => {
    const row: IssRow = {};
    for (let i = 0; i < columns.length; i++) {
      const v = i < raw.length ? raw[i] : null;
      row[columns[i]] = v === undefined ? null : v;
    }
    return row;
  });
}

export function getField(row: IssRow | null | undefined, column: string): unknown {
  if (!row) return null;
  return column in row ? row[column] : null;
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const s = String(value)
    .replace(/\u00A0/g, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  if (s === "" || s === "-" || s === "—" || s === "–") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function getNumber(row: IssRow | null | undefined, column: string): number | null {
  return toNumber(getField(row, column));
}

export function getString(row: IssRow | null | undefined, column: string): string | null {
  const v = getField(row, column);
  if (v === null || v === undefined) return null;
  const s = String(v);
  return s === "" ? null : s;
}

/**
 * Собирает Quote из уже объединённой строки (поля securities + marketdata).
 * Вызывающий код склеивает `{ ...securitiesRow, ...marketdataRow }` перед вызовом.
 */
export function buildQuote(row: IssRow, weight: number | null): Quote {
  const secId = getString(row, "SECID") ?? "";
  return {
    secId,
    name: getString(row, "SHORTNAME") ?? getString(row, "SECNAME") ?? secId,
    sector: sectorOf(secId),
    price: getNumber(row, "LAST"),
    changePct: getNumber(row, "LASTTOPREVPRICE"),
    prevClose: getNumber(row, "PREVPRICE"),
    cap: getNumber(row, "ISSUECAPITALIZATION"),
    weight,
    lot: getNumber(row, "LOTSIZE") ?? 1,
    minStep: getNumber(row, "MINSTEP") ?? 0.01,
    decimals: getNumber(row, "DECIMALS") ?? 2,
    high: getNumber(row, "HIGH"),
    low: getNumber(row, "LOW"),
    turnover: getNumber(row, "VALTODAY"),
    tradingStatus: normalizeStatus(getString(row, "TRADINGSTATUS")),
    updatedAt: getString(row, "UPDATETIME"),
  };
}

export function buildIndex(row: IssRow | null | undefined) {
  return {
    value: getNumber(row, "CURRENTVALUE"),
    changePct: getNumber(row, "LASTCHANGEPRC"),
    updatedAt: getString(row, "UPDATETIME") ?? getString(row, "TIME"),
  };
}

export function buildRvi(
  securitiesRow: IssRow | null | undefined,
  marketdataRow: IssRow | null | undefined,
) {
  return {
    value: getNumber(marketdataRow, "CURRENTVALUE"),
    updatedAt: getString(marketdataRow, "UPDATETIME"),
    annualHigh: getNumber(securitiesRow, "ANNUALHIGH"),
    annualLow: getNumber(securitiesRow, "ANNUALLOW"),
  };
}

export function detectSession(
  quotes: ReadonlyArray<{ tradingStatus: TradingStatus }>,
): SessionState {
  if (quotes.length === 0) return "unknown";
  let open = 0;
  let closed = 0;
  for (const q of quotes) {
    if (q.tradingStatus === "T") open++;
    else if (q.tradingStatus === "N") closed++;
  }
  if (open + closed === 0) return "unknown";
  return open >= closed ? "open" : "closed";
}

function normalizeStatus(v: string | null): TradingStatus {
  if (v === "T" || v === "N") return v;
  return null;
}
