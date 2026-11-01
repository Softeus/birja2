import { describe, expect, it } from "vitest";
import snapshot from "./fixtures/market.snapshot.json";
import { IMOEX_SECIDS } from "./sectors";

describe("market.snapshot.json", () => {
  it("44 бумаги IMOEX, все с ценой", () => {
    expect(snapshot.quotes.length).toBe(44);
    const ids = new Set(snapshot.quotes.map((q) => q.secId));
    expect(ids.size).toBe(44);
    for (const q of snapshot.quotes) {
      expect(q.price).not.toBeNull();
      expect(q.sector).toBeTruthy();
      expect(IMOEX_SECIDS).toContain(q.secId);
    }
  });

  it("индекс и RVI есть", () => {
    expect(snapshot.index.value).not.toBeNull();
    expect(snapshot.rvi.value).not.toBeNull();
    expect(snapshot.source).toBe("live");
  });
});
