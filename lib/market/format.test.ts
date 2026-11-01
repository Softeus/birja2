import { describe, expect, it } from "vitest";
import {
  formatCap,
  formatDelta,
  formatDecimal,
  formatPlain,
  formatPrice,
  formatTime,
  formatTurnover,
} from "./format";

const NBSP = "\u00A0";
const MINUS = "\u2212";

describe("formatPrice", () => {
  it("цена с DECIMALS бумаги", () => {
    expect(formatPrice(296.05, 2)).toBe(`296,05${NBSP}₽`);
    expect(formatPrice(6254, 1)).toBe(`6${NBSP}254,0${NBSP}₽`);
    expect(formatPrice(18.065, 3)).toBe(`18,065${NBSP}₽`);
  });

  it("null → длинное тире", () => {
    expect(formatPrice(null, 2)).toBe("—");
  });
});

describe("formatDelta", () => {
  it("знак обязателен, минус U+2212", () => {
    expect(formatDelta(1.84)).toBe("+1,84%");
    expect(formatDelta(-1.84)).toBe(`${MINUS}1,84%`);
    expect(formatDelta(0)).toBe("0,00%");
    expect(formatDelta(null)).toBe("—");
  });
});

describe("formatCap", () => {
  it("сокращения и неразрывный пробел", () => {
    expect(formatCap(6.39e12)).toBe(`6,39${NBSP}трлн ₽`);
    expect(formatCap(4.33e12)).toBe(`4,33${NBSP}трлн ₽`);
    expect(formatCap(2.76e9)).toBe(`2,76${NBSP}млрд ₽`);
  });
});

describe("formatTurnover", () => {
  it("один знак начиная с млрд", () => {
    expect(formatTurnover(14.2e9)).toBe(`14,2${NBSP}млрд ₽`);
    expect(formatTurnover(174e6)).toBe(`174${NBSP}млн ₽`);
  });
});

describe("formatPlain", () => {
  it("лот и шаг цены без лишних нулей", () => {
    expect(formatPlain(0.0756897)).toBe("0,0756897");
    expect(formatPlain(0.01)).toBe("0,01");
    expect(formatPlain(1)).toBe("1");
  });
});

describe("formatTime", () => {
  it("извлекает HH:MM:SS", () => {
    expect(formatTime("2026-11-01 15:40:04")).toBe("15:40:04");
    expect(formatTime("15:40:04")).toBe("15:40:04");
    expect(formatTime("2026-11-01T15:40:04")).toBe("15:40:04");
    expect(formatTime(null)).toBe("—");
  });
});

describe("formatDecimal", () => {
  it("число без валюты", () => {
    expect(formatDecimal(2508.43, 2)).toBe(`2${NBSP}508,43`);
    expect(formatDecimal(null)).toBe("—");
  });
});
