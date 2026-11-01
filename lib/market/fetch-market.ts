// Живой срез MOEX ISS → MarketResponse. Используется BFF /api/market.
import {
  buildIndex,
  buildQuote,
  buildRvi,
  detectSession,
  getNumber,
  getString,
  parseIssBlock,
} from "./iss";
import { buildFactors, computePulse } from "./pulse";
import { IMOEX_SECIDS } from "./sectors";
import type { MarketResponse, Quote } from "./types";

const BASE = "https://iss.moex.com/iss";
const TIMEOUT_MS = 5000;
const CANDLES_TTL_MS = 60 * 60 * 1000; // 1 ч
const WEIGHTS_TTL_MS = 60 * 60 * 1000; // 1 ч (консервативно; по спекам — на торг. день)

type IssBlock = { columns: string[]; data: unknown[][] } | undefined;
type IssPayload = Record<string, IssBlock>;

async function getJson(url: string): Promise<IssPayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`ISS ${res.status}: ${url}`);
    return (await res.json()) as IssPayload;
  } finally {
    clearTimeout(timer);
  }
}

function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function fetchDailyCloses(secid: string, board: string): Promise<number[]> {
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const url = `${BASE}/engines/stock/markets/index/boards/${board}/securities/${secid}/candles.json?interval=24&from=${localDate(from)}`;
  const payload = await getJson(url);
  return parseIssBlock(payload.candles)
    .map((r) => getNumber(r, "close"))
    .filter((v): v is number => v !== null);
}

function dailyChanges(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] === 0) continue;
    out.push(((closes[i] - closes[i - 1]) / closes[i - 1]) * 100);
  }
  return out;
}

async function fetchWeightsMap(date: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const start of [0, 20, 40]) {
    const url = `${BASE}/statistics/engines/stock/markets/index/analytics/IMOEX.json?date=${date}&start=${start}`;
    const payload = await getJson(url);
    for (const row of parseIssBlock(payload.analytics)) {
      if (String(row.tradingsession) !== "3") continue;
      const secid = getString(row, "secids");
      const w = getNumber(row, "weight");
      if (secid && w !== null) map.set(secid, w);
    }
  }
  return map;
}

async function fetchWeightsLatest(): Promise<Map<string, number>> {
  const d = new Date();
  for (let i = 0; i < 10; i++) {
    const map = await fetchWeightsMap(localDate(d));
    if (map.size > 0) return map;
    d.setDate(d.getDate() - 1);
  }
  return new Map();
}

let candlesCache: { at: number; imoexChanges: number[]; rviCloses: number[] } | null = null;
let weightsCache: { at: number; map: Map<string, number> } | null = null;

async function getMeta() {
  if (!candlesCache || Date.now() - candlesCache.at > CANDLES_TTL_MS) {
    const [imoexCloses, rviCloses] = await Promise.all([
      fetchDailyCloses("IMOEX", "SNDX"),
      fetchDailyCloses("RVI", "RTSI"),
    ]);
    candlesCache = {
      at: Date.now(),
      imoexChanges: dailyChanges(imoexCloses),
      rviCloses,
    };
  }
  if (!weightsCache || Date.now() - weightsCache.at > WEIGHTS_TTL_MS) {
    weightsCache = { at: Date.now(), map: await fetchWeightsLatest() };
  }
  return { ...candlesCache, weights: weightsCache.map };
}

export async function fetchMarketResponse(): Promise<MarketResponse> {
  const [tqbr, imoex, rvi] = await Promise.all([
    getJson(
      `${BASE}/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities,marketdata`,
    ),
    getJson(
      `${BASE}/engines/stock/markets/index/boards/SNDX/securities/IMOEX.json?iss.meta=off&iss.only=marketdata`,
    ),
    getJson(
      `${BASE}/engines/stock/markets/index/boards/RTSI/securities/RVI.json?iss.meta=off&iss.only=securities,marketdata`,
    ),
  ]);

  const meta = await getMeta();

  const securities = parseIssBlock(tqbr.securities);
  const marketdata = parseIssBlock(tqbr.marketdata);
  const secById = new Map(securities.map((r) => [String(r.SECID), r]));
  const mdById = new Map(marketdata.map((r) => [String(r.SECID), r]));

  const quotes: Quote[] = [];
  for (const secId of IMOEX_SECIDS) {
    const s = secById.get(secId);
    const m = mdById.get(secId);
    if (!s || !m) continue;
    const q = buildQuote({ ...s, ...m }, meta.weights.get(secId) ?? null);
    if (q.price === null) continue; // FR-03: бумаги без LAST исключаем
    quotes.push(q);
  }

  const index = buildIndex(parseIssBlock(imoex.marketdata)[0] ?? null);
  const rviData = buildRvi(
    parseIssBlock(rvi.securities)[0] ?? null,
    parseIssBlock(rvi.marketdata)[0] ?? null,
  );

  const session = detectSession(quotes);

  const factors = buildFactors({
    indexChangePct: index.changePct,
    imoexChanges: meta.imoexChanges,
    rviValue: rviData.value,
    rviCloses: meta.rviCloses,
    quotes,
    weights: meta.weights,
  });
  const pulse = { ...computePulse(factors), methodVersion: "pulse-1" as const, factors };

  return {
    asOf: new Date().toISOString(),
    delaySec: delaySecFrom(index.updatedAt),
    session,
    source: "live",
    quotes,
    index,
    rvi: rviData,
    pulse,
  };
}

/** Задержка по времени среза (HH:MM:SS сегодня). Не парсится — номинал 900 с. */
export function delaySecFrom(updatedAt: string | null): number {
  if (!updatedAt) return 900;
  const m = updatedAt.match(/(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return 900;
  const now = new Date();
  const t = new Date(now);
  t.setHours(Number(m[1]), Number(m[2]), Number(m[3]), 0);
  return Math.max(0, Math.round((now.getTime() - t.getTime()) / 1000));
}
