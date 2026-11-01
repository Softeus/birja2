import { describe, expect, it } from "vitest";
import { layoutHeatmap } from "./layout";
import snapshot from "../market/fixtures/market.snapshot.json";

const rectsOverlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );

describe("layoutHeatmap", () => {
  it("44 плитки без пересечений, внутри своих секторов", () => {
    const quotes = snapshot.quotes.map((q) => ({
      secId: q.secId,
      sector: q.sector,
      cap: q.cap,
      weight: q.weight,
    }));

    const { width, height, sectors } = layoutHeatmap(quotes, 1280, 720);
    const tiles = sectors.flatMap((s) => s.tiles);

    expect(sectors.length).toBe(9);
    expect(tiles.length).toBe(44);
    expect(new Set(tiles.map((t) => t.secId)).size).toBe(44);

    // Покрытие контейнера (с учётом отступов — не менее 60%).
    const area = tiles.reduce((a, t) => a + t.width * t.height, 0);
    expect(area / (width * height)).toBeGreaterThan(0.6);

    // Плитки положительные и в границах контейнера.
    for (const t of tiles) {
      expect(t.width).toBeGreaterThan(0);
      expect(t.height).toBeGreaterThan(0);
      expect(t.x).toBeGreaterThanOrEqual(-0.01);
      expect(t.y).toBeGreaterThanOrEqual(-0.01);
      expect(t.x + t.width).toBeLessThanOrEqual(width + 0.01);
      expect(t.y + t.height).toBeLessThanOrEqual(height + 0.01);
    }

    // Нет пересечений.
    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        expect(rectsOverlap(tiles[i], tiles[j])).toBe(false);
      }
    }

    // Плитка внутри своего сектора.
    for (const s of sectors) {
      for (const t of s.tiles) {
        expect(t.x).toBeGreaterThanOrEqual(s.x - 0.01);
        expect(t.y).toBeGreaterThanOrEqual(s.y - 0.01);
        expect(t.x + t.width).toBeLessThanOrEqual(s.x + s.width + 0.01);
        expect(t.y + t.height).toBeLessThanOrEqual(s.y + s.height + 0.01);
      }
    }
  });
});
