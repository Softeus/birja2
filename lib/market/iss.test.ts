import { describe, expect, it } from "vitest";
import {
  buildQuote,
  detectSession,
  getField,
  getNumber,
  getString,
  parseIssBlock,
} from "./iss";

describe("parseIssBlock", () => {
  it("мапит по именам колонок, не по индексу", () => {
    const rows = parseIssBlock({ columns: ["SECID", "LAST"], data: [["SBER", 296.05]] });
    expect(rows).toEqual([{ SECID: "SBER", LAST: 296.05 }]);
  });

  it("перестановка колонок не ломает маппинг", () => {
    const rows = parseIssBlock({ columns: ["LAST", "SECID"], data: [[296.05, "SBER"]] });
    expect(getString(rows[0], "SECID")).toBe("SBER");
    expect(getNumber(rows[0], "LAST")).toBe(296.05);
  });

  it("пустой/битый блок → []", () => {
    expect(parseIssBlock(null)).toEqual([]);
    expect(parseIssBlock(undefined)).toEqual([]);
    expect(parseIssBlock({ columns: [], data: [] })).toEqual([]);
  });

  it("отсутствующая колонка даёт null, не падение (FR-02)", () => {
    const [row] = parseIssBlock({ columns: ["SECID"], data: [["SBER"]] });
    expect(getField(row, "LAST")).toBeNull();
    expect(getNumber(row, "LAST")).toBeNull();
  });
});

describe("getNumber", () => {
  it("число, строка с запятой, пусто, прочерк", () => {
    expect(getNumber({ A: 42 }, "A")).toBe(42);
    expect(getNumber({ A: "2513,79" }, "A")).toBeCloseTo(2513.79);
    expect(getNumber({ A: "" }, "A")).toBeNull();
    expect(getNumber({ A: null }, "A")).toBeNull();
    expect(getNumber({ A: "—" }, "A")).toBeNull();
  });
});

describe("buildQuote", () => {
  it("собирает Quote из объединённой строки securities+marketdata", () => {
    const q = buildQuote(
      {
        SECID: "SBER",
        SHORTNAME: "Сбербанк",
        PREVPRICE: 293.5,
        LOTSIZE: 1,
        MINSTEP: 0.01,
        DECIMALS: 2,
        LAST: 296.05,
        LASTTOPREVPRICE: 0.8,
        ISSUECAPITALIZATION: 6.39e12,
        HIGH: 297,
        LOW: 292,
        VALTODAY: 5e9,
        TRADINGSTATUS: "T",
        UPDATETIME: "15:40:04",
      },
      null,
    );
    expect(q.secId).toBe("SBER");
    expect(q.price).toBeCloseTo(296.05);
    expect(q.changePct).toBeCloseTo(0.8);
    expect(q.decimals).toBe(2);
    expect(q.tradingStatus).toBe("T");
    expect(q.sector).toBeTruthy();
  });
});

describe("detectSession", () => {
  it("большинство T → open, N → closed, пусто → unknown", () => {
    expect(detectSession([{ tradingStatus: "T" }, { tradingStatus: "T" }, { tradingStatus: "N" }])).toBe("open");
    expect(detectSession([{ tradingStatus: "N" }, { tradingStatus: "N" }])).toBe("closed");
    expect(detectSession([])).toBe("unknown");
  });
});
