// Контракт ответа BFF и внутренние типы слоя данных.
// Источник истины — docs/04-technical-spec.md §2.5.

export type SessionState = "open" | "closed" | "unknown";
export type SourceState = "live" | "mock";
export type TradingStatus = "T" | "N" | null;
export type Zone = "fear" | "caution" | "neutral" | "optimism" | "greed" | null;
export type FactorId = "index" | "volatility" | "breadth" | "turnover";

export type Quote = {
  secId: string;
  name: string;
  sector: string;
  /** LAST */
  price: number | null;
  /** LASTTOPREVPRICE, % */
  changePct: number | null;
  /** securities.PREVPRICE */
  prevClose: number | null;
  /** ISSUECAPITALIZATION */
  cap: number | null;
  /** вес в индексе (аналитика), для широты; может быть null на этапе до подгрузки весов */
  weight: number | null;
  lot: number;
  minStep: number;
  decimals: number;
  high: number | null;
  low: number | null;
  /** VALTODAY */
  turnover: number | null;
  tradingStatus: TradingStatus;
  /** UPDATETIME */
  updatedAt: string | null;
};

export type Factor = {
  id: FactorId;
  label: string;
  raw: number | null;
  /** "%" | "пункты" */
  rawUnit: string;
  /** нормированная оценка 0..100 */
  score: number | null;
  available: boolean;
  note: string;
};

export type MarketResponse = {
  asOf: string;
  delaySec: number;
  session: SessionState;
  source: SourceState;
  quotes: Quote[];
  index: {
    value: number | null;
    changePct: number | null;
    updatedAt: string | null;
  };
  rvi: {
    value: number | null;
    updatedAt: string | null;
    annualHigh: number | null;
    annualLow: number | null;
  };
  pulse: {
    value: number | null;
    zone: Zone;
    diverged: boolean;
    methodVersion: "pulse-1";
    factors: Factor[];
    missing: string[];
  };
};
