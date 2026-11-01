import { describe, expect, it } from "vitest";
import {
  breadthScore,
  buildFactors,
  computePulse,
  diverged,
  percentile,
  turnoverBalance,
  turnoverScore,
  zone,
} from "./pulse";
import type { Factor, Quote } from "./types";

const factor = (id: Factor["id"], label: string, score: number | null, available = score !== null): Factor => ({
  id,
  label,
  raw: null,
  rawUnit: "%",
  score,
  available,
  note: "",
});

describe("zone", () => {
  it("границы зон", () => {
    expect(zone(24)).toBe("fear");
    expect(zone(25)).toBe("caution");
    expect(zone(44)).toBe("caution");
    expect(zone(45)).toBe("neutral");
    expect(zone(55)).toBe("neutral");
    expect(zone(56)).toBe("optimism");
    expect(zone(75)).toBe("optimism");
    expect(zone(76)).toBe("greed");
    expect(zone(null)).toBeNull();
  });
});

describe("diverged", () => {
  it("разброс ≥ 40", () => {
    expect(diverged([50, 50, 50, 50])).toBe(false);
    expect(diverged([90, 10, 90, 10])).toBe(true);
  });
});

describe("percentile", () => {
  it("монотонный ряд", () => {
    const s = [1, 2, 3, 4, 5];
    expect(percentile(s, 1)).toBe(20);
    expect(percentile(s, 3)).toBe(60);
    expect(percentile(s, 5)).toBe(100);
  });
});

describe("turnover", () => {
  it("баланс и оценка (10.22 млрд против 1.74 млрд → ≈86)", () => {
    const quotes = [
      { changePct: 1, turnover: 1022 },
      { changePct: -1, turnover: 174 },
    ] as Pick<Quote, "changePct" | "turnover">[];
    expect(turnoverBalance(quotes)).toBeCloseTo(0.709, 3);
    expect(turnoverScore(quotes)).toBeCloseTo(85.45, 2);
  });

  it("нет данных → null", () => {
    expect(turnoverBalance([])).toBeNull();
    expect(turnoverScore([])).toBeNull();
  });
});

describe("breadthScore", () => {
  it("взвешенная широта", () => {
    const quotes = [
      { secId: "A", changePct: 1 },
      { secId: "B", changePct: -1 },
      { secId: "C", changePct: 0 },
    ] as Pick<Quote, "secId" | "changePct">[];
    const weights = new Map([
      ["A", 60],
      ["B", 40],
    ]);
    expect(breadthScore(quotes, weights)).toBe(60);
  });
});

describe("computePulse", () => {
  it("среднее четырёх → 67, оптимизм (T-06)", () => {
    const r = computePulse([
      factor("index", "Динамика IMOEX", 48),
      factor("volatility", "Волатильность RVI", 63),
      factor("breadth", "Широта рынка", 71),
      factor("turnover", "Баланс оборота", 86),
    ]);
    expect(r.value).toBe(67);
    expect(r.zone).toBe("optimism");
    expect(r.diverged).toBe(false);
  });

  it("отсутствие фактора → null + missing (T-07)", () => {
    const r = computePulse([
      factor("index", "Динамика IMOEX", 48),
      factor("volatility", "Волатильность RVI", null, false),
      factor("breadth", "Широта рынка", 71),
      factor("turnover", "Баланс оборота", 86),
    ]);
    expect(r.value).toBeNull();
    expect(r.missing).toContain("Волатильность RVI");
  });

  it("разнонаправленность (T-09)", () => {
    const r = computePulse([90, 10, 90, 10].map((s) => factor("index", "f", s)));
    expect(r.value).toBe(50);
    expect(r.diverged).toBe(true);
  });

  it("сдвиг фактора на N меняет индекс на N/4 (T-10)", () => {
    const base = [50, 50, 50, 50].map((s) => factor("index", "f", s));
    const shifted = [50, 10, 50, 50].map((s) => factor("index", "f", s));
    expect(computePulse(base).value).toBe(50);
    expect(computePulse(shifted).value).toBe(40);
  });
});

describe("buildFactors", () => {
  it("строит 4 фактора; пропуски помечаются unavailable", () => {
    const quotes = [
      { secId: "A", changePct: 1, turnover: 1022 },
      { secId: "B", changePct: -1, turnover: 174 },
    ] as unknown as Quote[];
    const factors = buildFactors({
      indexChangePct: -0.18,
      imoexChanges: [-1, -0.5, -0.18, 0.2, 0.8],
      rviValue: 30.44,
      rviCloses: [17, 25, 30, 40, 53],
      quotes,
      weights: new Map([
        ["A", 60],
        ["B", 40],
      ]),
    });
    expect(factors).toHaveLength(4);
    expect(factors.every((f) => f.available)).toBe(true);
  });
});
