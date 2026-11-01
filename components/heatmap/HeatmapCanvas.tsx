"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { layoutHeatmap } from "@/lib/heatmap/layout";
import type { Quote } from "@/lib/market/types";
import { SectorGroup } from "./SectorGroup";
import { StockTile } from "./StockTile";

export function HeatmapCanvas({
  quotes,
  selectedId,
  onSelect,
}: {
  quotes: Quote[];
  selectedId: string | null;
  onSelect: (secId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const byId = new Map(quotes.map((q) => [q.secId, q]));
  const layout =
    size.width > 0 && size.height > 0
      ? layoutHeatmap(quotes, size.width, size.height)
      : null;

  // DOM-порядок — по капитализации убыв. (FR-20: порядок табуляции).
  const tiles = layout
    ? layout.sectors
        .flatMap((s) => s.tiles)
        .sort((a, b) => (byId.get(b.secId)?.cap ?? 0) - (byId.get(a.secId)?.cap ?? 0))
    : [];

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">
      {layout &&
        layout.sectors.map((s) => (
          <SectorGroup
            key={s.sector}
            sector={s.sector}
            x={s.x}
            y={s.y}
            width={s.width}
            height={s.height}
          />
        ))}
      {tiles.map((t) => {
        const q = byId.get(t.secId);
        if (!q) return null;
        return (
          <StockTile
            key={t.secId}
            quote={q}
            rect={t}
            selected={selectedId === t.secId}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
