import { formatDecimal, formatDelta } from "@/lib/market/format";
import type { Factor } from "@/lib/market/types";
import { FactorSlider } from "./FactorSlider";

function rawLabel(f: Factor): string {
  if (f.raw === null) return "нет данных";
  if (f.id === "index") return formatDelta(f.raw);
  if (f.id === "volatility") return `${formatDecimal(f.raw, 2)} п.`;
  if (f.id === "turnover") return formatDelta(f.raw, 1);
  return formatDecimal(f.raw, 1) + "%";
}

export function FactorCard({
  factor,
  override,
  onOverride,
}: {
  factor: Factor;
  override: number | null;
  onOverride: (value: number) => void;
}) {
  const score = override ?? factor.score;
  const shown = factor.available ? Math.round(score ?? 0) : "—";
  const changed =
    override !== null && factor.available && Math.round(override) !== Math.round(factor.score ?? 0);

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">{factor.label}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{rawLabel(factor)}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums">{shown}</span>
        {changed && (
          <span className="text-xs text-muted-foreground tabular-nums">
            исх. {Math.round(factor.score ?? 0)}
          </span>
        )}
      </div>
      <FactorSlider
        label={factor.label}
        value={Math.round(score ?? 50)}
        disabled={!factor.available}
        onChange={onOverride}
      />
    </div>
  );
}
