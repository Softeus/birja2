// Методика «pulse-1» (docs/04-technical-spec.md §3). Чистые функции, без сети.
import type { Factor, Quote, Zone } from "./types";

/** Доля (0..100) элементов series, не превышающих value. */
export function percentile(series: readonly number[], value: number): number {
  if (series.length === 0) return 0;
  const count = series.reduce((acc, x) => (x <= value ? acc + 1 : acc), 0);
  return (count / series.length) * 100;
}

export function zone(score: number | null): Zone {
  if (score === null || !Number.isFinite(score)) return null;
  if (score <= 24) return "fear";
  if (score <= 44) return "caution";
  if (score <= 55) return "neutral";
  if (score <= 75) return "optimism";
  return "greed";
}

/** Разброс оценок ≥ 40 — факторы разнонаправлены. */
export function diverged(scores: readonly (number | null)[]): boolean {
  const nums = scores.filter((s): s is number => s !== null && Number.isFinite(s));
  if (nums.length < 2) return false;
  return Math.max(...nums) - Math.min(...nums) >= 40;
}

/** Баланс оборота B = (V↑ − V↓)/(V↑ + V↓) ∈ [−1, 1]. */
export function turnoverBalance(
  quotes: readonly Pick<Quote, "changePct" | "turnover">[],
): number | null {
  let up = 0;
  let down = 0;
  for (const q of quotes) {
    if (q.changePct === null || q.turnover === null) continue;
    if (q.changePct > 0) up += q.turnover;
    else if (q.changePct < 0) down += q.turnover;
  }
  const total = up + down;
  if (total <= 0) return null;
  return (up - down) / total;
}

/** Оценка баланса оборота: 50·(1 + B). */
export function turnoverScore(
  quotes: readonly Pick<Quote, "changePct" | "turnover">[],
): number | null {
  const b = turnoverBalance(quotes);
  return b === null ? null : 50 * (1 + b);
}

/** Взвешенная широта: 100·Σw↑/(Σw↑+Σw↓). */
export function breadthScore(
  quotes: readonly Pick<Quote, "secId" | "changePct">[],
  weights: ReadonlyMap<string, number>,
): number | null {
  let up = 0;
  let down = 0;
  for (const q of quotes) {
    if (q.changePct === null) continue;
    const w = weights.get(q.secId);
    if (w === undefined) continue;
    if (q.changePct > 0) up += w;
    else if (q.changePct < 0) down += w;
  }
  const total = up + down;
  if (total <= 0) return null;
  return (up / total) * 100;
}

export type PulseInputs = {
  indexChangePct: number | null;
  imoexChanges: readonly number[];
  rviValue: number | null;
  rviCloses: readonly number[];
  quotes: readonly Quote[];
  weights: ReadonlyMap<string, number>;
};

export function buildFactors(inputs: PulseInputs): Factor[] {
  const { indexChangePct, imoexChanges, rviValue, rviCloses, quotes, weights } = inputs;

  const indexScore =
    indexChangePct !== null && imoexChanges.length > 0
      ? percentile(imoexChanges, indexChangePct)
      : null;

  const volScore =
    rviValue !== null && rviCloses.length > 0
      ? 100 - percentile(rviCloses, rviValue)
      : null;

  const breadth = breadthScore(quotes, weights);
  const balance = turnoverBalance(quotes);
  const turnover = balance === null ? null : 50 * (1 + balance);

  return [
    {
      id: "index",
      label: "Динамика IMOEX",
      raw: indexChangePct,
      rawUnit: "%",
      score: indexScore,
      available: indexScore !== null,
      note: indexScore === null ? "нет истории" : "",
    },
    {
      id: "volatility",
      label: "Волатильность RVI",
      raw: rviValue,
      rawUnit: "пункты",
      score: volScore,
      available: volScore !== null,
      note: volScore === null ? "нет истории" : "",
    },
    {
      id: "breadth",
      label: "Широта рынка",
      raw: breadth,
      rawUnit: "%",
      score: breadth,
      available: breadth !== null,
      note: breadth === null ? "нет весов" : "",
    },
    {
      id: "turnover",
      label: "Баланс оборота",
      raw: balance === null ? null : balance * 100,
      rawUnit: "%",
      score: turnover,
      available: turnover !== null,
      note: turnover === null ? "нет оборота" : "",
    },
  ];
}

export function computePulse(factors: readonly Factor[]): {
  value: number | null;
  zone: Zone;
  diverged: boolean;
  missing: string[];
} {
  const missing = factors
    .filter((f) => !f.available || f.score === null)
    .map((f) => f.label);

  if (missing.length > 0) {
    return { value: null, zone: null, diverged: false, missing };
  }

  const scores = factors.map((f) => f.score as number);
  const value = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return { value, zone: zone(value), diverged: diverged(scores), missing: [] };
}
