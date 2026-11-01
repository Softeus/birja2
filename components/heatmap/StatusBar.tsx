import { formatTime } from "@/lib/market/format";

export type StatusBarProps = {
  asOf: string | null;
  delaySec: number;
  source: "live" | "mock";
  count: number;
  noPriceCount?: number;
};

export function StatusBar({
  asOf,
  delaySec,
  source,
  count,
  noPriceCount = 0,
}: StatusBarProps) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-2 border-t px-4 text-xs text-muted-foreground">
      <span>{count} бумаг</span>
      {noPriceCount > 0 && <span>· {noPriceCount} без цены</span>}
      <span>· обновлено {formatTime(asOf)}</span>
      <span>· +{Math.max(1, Math.round(delaySec / 60))} мин</span>
      <span className="ml-auto">источник {source === "live" ? "ISS" : "mock"}</span>
    </div>
  );
}
