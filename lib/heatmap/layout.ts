// Вложенная укладка тепловой карты: сектор → плитка.
// Площадь — капитализация (fallback — вес в индексе). d3-hierarchy + squarify.
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";

export type AreaSource = {
  secId: string;
  sector: string;
  cap: number | null;
  weight: number | null;
};

export type TileRect = {
  secId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SectorLayout = {
  sector: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tiles: TileRect[];
};

export type HeatmapLayout = {
  width: number;
  height: number;
  sectors: SectorLayout[];
};

type NodeDatum = {
  name: string;
  secId?: string;
  value?: number;
  children?: NodeDatum[];
};

const LABEL_BAND = 20;
const PAD_OUTER = 6;
const PAD_INNER = 2;

export function layoutHeatmap(
  quotes: readonly AreaSource[],
  width: number,
  height: number,
): HeatmapLayout {
  if (width <= 0 || height <= 0 || quotes.length === 0) {
    return { width, height, sectors: [] };
  }

  // Площадь — капитализация; при её отсутствии — вес в индексе, масштабированный
  // к сумме капитализаций, чтобы не терялся на фоне триллионных значений.
  const totalCap = quotes.reduce((sum, q) => sum + (q.cap ?? 0), 0);

  const bySector = new Map<string, NodeDatum[]>();
  for (const q of quotes) {
    const value = q.cap ?? Math.max(1, (q.weight ?? 0) * (totalCap / 100));
    const list = bySector.get(q.sector) ?? [];
    list.push({ name: q.secId, secId: q.secId, value });
    bySector.set(q.sector, list);
  }

  const rootDatum: NodeDatum = {
    name: "root",
    children: [...bySector.entries()].map(([sector, tiles]) => ({ name: sector, children: tiles })),
  };

  const root = hierarchy<NodeDatum>(rootDatum)
    .sum((d) => (d.children ? 0 : d.value ?? 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const laidOut = treemap<NodeDatum>()
    .tile(treemapSquarify)
    .size([width, height])
    .paddingInner(PAD_INNER)
    .paddingOuter(PAD_OUTER)
    .paddingTop((d) => (d.depth === 1 ? LABEL_BAND : 0))(root);

  const sectors: SectorLayout[] = (laidOut.children ?? []).map((s) => ({
    sector: s.data.name,
    x: s.x0,
    y: s.y0,
    width: s.x1 - s.x0,
    height: s.y1 - s.y0,
    tiles: (s.children ?? []).map((t) => ({
      secId: t.data.secId ?? t.data.name,
      x: t.x0,
      y: t.y0,
      width: t.x1 - t.x0,
      height: t.y1 - t.y0,
    })),
  }));

  return { width, height, sectors };
}
