import { cn } from "@/lib/utils";
import { formatDelta, formatPrice } from "@/lib/market/format";
import type { TileRect } from "@/lib/heatmap/layout";
import type { Quote } from "@/lib/market/types";

const LEVEL_CLASS: Record<string, string> = {
  "bullish-1": "bg-bullish-1 text-foreground",
  "bullish-2": "bg-bullish-2 text-background",
  "bullish-3": "bg-bullish-3 text-background",
  "bearish-1": "bg-bearish-1 text-foreground",
  "bearish-2": "bg-bearish-2 text-background",
  "bearish-3": "bg-bearish-3 text-background",
  neutral: "bg-neutral text-foreground",
};

function levelClass(changePct: number | null): string {
  if (changePct === null || changePct === 0) return LEVEL_CLASS.neutral;
  const abs = Math.abs(changePct);
  const dir = changePct > 0 ? "bullish" : "bearish";
  const level = abs >= 3 ? "3" : abs >= 1 ? "2" : "1";
  return LEVEL_CLASS[`${dir}-${level}`] ?? LEVEL_CLASS.neutral;
}

export function StockTile({
  quote,
  rect,
  selected,
  onSelect,
}: {
  quote: Quote;
  rect: TileRect;
  selected: boolean;
  onSelect: (secId: string) => void;
}) {
  const showPct = rect.width >= 56 && rect.height >= 40;
  const showPrice = rect.width >= 76;

  return (
    <button
      type="button"
      data-secid={quote.secId}
      onClick={() => onSelect(quote.secId)}
      aria-label={`${quote.secId} ${quote.name}, изменение ${formatDelta(quote.changePct)}`}
      aria-pressed={selected}
      className={cn(
        "absolute flex flex-col justify-between gap-0.5 overflow-hidden rounded-[3px] p-1 text-left font-mono text-xs leading-none tabular-nums",
        "transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        levelClass(quote.changePct),
        selected && "ring-2 ring-ring",
      )}
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
    >
      <span className="font-medium">{quote.secId}</span>
      <span className="flex flex-col gap-0.5">
        {showPct && <span>{formatDelta(quote.changePct)}</span>}
        {showPrice && <span>{formatPrice(quote.price, quote.decimals)}</span>}
      </span>
    </button>
  );
}
