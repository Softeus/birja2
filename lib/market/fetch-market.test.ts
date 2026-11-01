import { describe, expect, it } from "vitest";
import { delaySecFrom } from "./fetch-market";

describe("delaySecFrom", () => {
  it("null/непарсимое → номинал 900", () => {
    expect(delaySecFrom(null)).toBe(900);
    expect(delaySecFrom("no-time")).toBe(900);
  });

  it("время среза сегодня → неотрицательная задержка", () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    expect(delaySecFrom(`${hh}:${mm}:${ss}`)).toBeGreaterThanOrEqual(0);
    expect(delaySecFrom(`${hh}:${mm}:${ss}`)).toBeLessThan(5);
  });
});
