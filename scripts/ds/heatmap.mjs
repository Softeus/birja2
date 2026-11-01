#!/usr/bin/env node
// Генератор ds/screens/heatmap.ast.json: треемэп из фикстуры + плейсхолдерные данные.
// usage: node scripts/ds/heatmap.mjs
import { readFile, writeFile } from "node:fs/promises";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";

const snap = JSON.parse(await readFile("lib/market/fixtures/market.snapshot.json", "utf8"));

const MAP_W = 800;
const MAP_H = 520;

const r1 = (n) => Math.round(n * 10) / 10;
const fmtNum = (v, d = 2) => (v === null || v === undefined ? "—" : v.toFixed(d).replace(".", ","));
const fmtDelta = (v) => {
  if (v === null || v === undefined) return "";
  const sign = v > 0 ? "+" : v < 0 ? "\u2212" : "";
  return sign + Math.abs(v).toFixed(2).replace(".", ",") + "%";
};
const fmtPrice = (v, d) => (v === null || v === undefined ? "—" : v.toFixed(d ?? 0).replace(".", ",") + " ₽");
const fmtCap = (v) => {
  if (v === null || v === undefined) return "—";
  return (v >= 1e12 ? (v / 1e12).toFixed(2) : (v / 1e9).toFixed(2)).replace(".", ",") + (v >= 1e12 ? " трлн ₽" : " млрд ₽");
};
const fmtTurnover = (v) => (v === null || v === undefined ? "—" : (v / 1e9).toFixed(1).replace(".", ",") + " млрд ₽");

const ZONE_LABEL = {
  fear: "страх",
  caution: "осторожность",
  neutral: "нейтрально",
  optimism: "оптимизм",
  greed: "жадность",
};

function level(changePct) {
  if (changePct === null || changePct === undefined || changePct === 0) return "neutral";
  const abs = Math.abs(changePct);
  const dir = changePct > 0 ? "bullish" : "bearish";
  const l = abs >= 3 ? "3" : abs >= 1 ? "2" : "1";
  return `${dir}-${l}`;
}

// Адаптивная подпись плитки: тикер всегда, Δ% при 56×40, цена при ширине ≥ 76 (FR-19).
function tileLabel({ secId, changePct, price, decimals, width, height }) {
  const parts = [secId];
  if (width >= 56 && height >= 40) parts.push(fmtDelta(changePct));
  if (width >= 76) parts.push(fmtPrice(price, decimals));
  return parts.join("\n");
}

// Укладка — та же, что lib/heatmap/layout.ts (d3-hierarchy + squarify).
const totalCap = snap.quotes.reduce((s, q) => s + (q.cap ?? 0), 0);
const bySector = new Map();
for (const q of snap.quotes) {
  const value = q.cap ?? Math.max(1, (q.weight ?? 0) * (totalCap / 100));
  const list = bySector.get(q.sector) ?? [];
  list.push({ name: q.secId, secId: q.secId, value, changePct: q.changePct, price: q.price, decimals: q.decimals });
  bySector.set(q.sector, list);
}

const rootDatum = {
  name: "root",
  children: [...bySector.entries()].map(([sector, tiles]) => ({ name: sector, children: tiles })),
};
const root = hierarchy(rootDatum)
  .sum((d) => (d.children ? 0 : d.value ?? 0))
  .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
const laidOut = treemap()
  .tile(treemapSquarify)
  .size([MAP_W, MAP_H])
  .paddingInner(2)
  .paddingOuter(6)
  .paddingTop((d) => (d.depth === 1 ? 20 : 0))(root);

const sectors = (laidOut.children ?? []).map((s) => ({
  sector: s.data.name,
  x: r1(s.x0),
  y: r1(s.y0),
  width: r1(s.x1 - s.x0),
  height: r1(s.y1 - s.y0),
  tiles: (s.children ?? []).map((t) => {
    const width = r1(t.x1 - t.x0);
    const height = r1(t.y1 - t.y0);
    const secId = t.data.secId ?? t.data.name;
    const changePct = t.data.changePct;
    return {
      secId,
      x: r1(t.x0),
      y: r1(t.y0),
      width,
      height,
      level: level(changePct),
      label: tileLabel({ secId, changePct, price: t.data.price, decimals: t.data.decimals, width, height }),
    };
  }),
}));

const sber = snap.quotes.find((q) => q.secId === "SBER") ?? snap.quotes[0];
const zone = snap.pulse?.zone ?? "neutral";
const tileCount = sectors.reduce((a, s) => a + s.tiles.length, 0);

const ast = {
  screen: "Heatmap",
  title: "Пульс рынка и тепловая карта MOEX",
  order: 7,
  frame: { width: 1200, padding: 24, gap: 16, background: "color/background" },
  elements: [
    {
      type: "stack",
      direction: "HORIZONTAL",
      gap: 16,
      children: [
        {
          type: "stack",
          direction: "VERTICAL",
          gap: 0,
          children: [
            { component: "PulseGauge", props: { zone }, slots: { value: "67" } },
            { component: "Text", props: { variant: "sm" }, slots: { text: ZONE_LABEL[zone] ?? "—" } },
          ],
        },
        {
          type: "stack",
          direction: "VERTICAL",
          gap: 4,
          children: [
            {
              component: "Text",
              slots: {
                text: `IMOEX ${fmtNum(snap.index?.value)} ${fmtDelta(snap.index?.changePct)} · RVI ${fmtNum(snap.rvi?.value)}`,
              },
            },
            {
              component: "Text",
              props: { variant: "sm" },
              slots: { text: "методика pulse-1 · веса равные · данные ISS" },
            },
          ],
        },
        {
          component: "Button",
          props: { variant: "outline", size: "default" },
          slots: { label: "Разобрать индекс" },
        },
      ],
    },
    {
      type: "stack",
      direction: "HORIZONTAL",
      gap: 16,
      children: [
        { type: "heatmap", width: MAP_W, height: MAP_H, sectors },
        {
          type: "stack",
          direction: "VERTICAL",
          gap: 8,
          children: [
            {
              type: "stack",
              direction: "HORIZONTAL",
              gap: 8,
              children: [
                { component: "Heading", props: { level: "h3" }, slots: { text: sber.secId } },
                { component: "Text", props: { variant: "muted" }, slots: { text: sber.name } },
              ],
            },
            {
              type: "stack",
              direction: "HORIZONTAL",
              gap: 8,
              children: [
                { component: "Text", props: { variant: "lg" }, slots: { text: fmtPrice(sber.price, sber.decimals) } },
                { component: "Text", slots: { text: fmtDelta(sber.changePct) } },
              ],
            },
            { component: "Sparkline", props: { direction: (sber.changePct ?? 0) >= 0 ? "up" : "down" } },
            { component: "Separator", props: { orientation: "horizontal" } },
            { component: "Text", props: { variant: "muted" }, slots: { text: `Капитализация · ${fmtCap(sber.cap)}` } },
            { component: "Text", props: { variant: "muted" }, slots: { text: `Лот / шаг · ${sber.lot} / ${fmtNum(sber.minStep)}` } },
            { component: "Text", props: { variant: "muted" }, slots: { text: `Оборот · ${fmtTurnover(sber.turnover)}` } },
          ],
        },
      ],
    },
    {
      component: "Text",
      props: { variant: "sm" },
      slots: { text: `${snap.quotes.length} бумаги · ${sectors.length} секторов · источник ISS · обновлено ${snap.index?.updatedAt ?? "—"}` },
    },
  ],
};

await writeFile("ds/screens/heatmap.ast.json", JSON.stringify(ast, null, 2) + "\n");
console.log(`heatmap.ast.json: ${sectors.length} секторов, ${tileCount} плиток, zone=${zone}`);
