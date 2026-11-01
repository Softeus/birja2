import { XIcon } from "lucide-react";
import {
  formatCap,
  formatDelta,
  formatPlain,
  formatPrice,
  formatTurnover,
} from "@/lib/market/format";
import type { Quote } from "@/lib/market/types";
import { SparklineCard } from "./SparklineCard";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}

export function DetailPanel({
  quote,
  onClose,
}: {
  quote: Quote | null;
  onClose: () => void;
}) {
  return (
    <aside className="w-[360px] shrink-0 border-l p-5">
      {!quote ? (
        <p className="text-sm text-muted-foreground">Выберите бумагу</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-semibold">{quote.secId}</h2>
                <span className="truncate text-sm text-muted-foreground">{quote.name}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {formatPrice(quote.price, quote.decimals)}
                </span>
                <span className="text-sm tabular-nums">{formatDelta(quote.changePct)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <SparklineCard secId={quote.secId} />

          <dl className="space-y-2 text-sm">
            <Row label="Капитализация" value={formatCap(quote.cap)} />
            <Row
              label="Лот / шаг цены"
              value={`${formatPlain(quote.lot)} / ${formatPlain(quote.minStep)}`}
            />
            <Row
              label="Диапазон дня"
              value={
                quote.high !== null && quote.low !== null
                  ? `${formatPrice(quote.low, quote.decimals)} – ${formatPrice(quote.high, quote.decimals)}`
                  : "—"
              }
            />
            <Row label="Оборот" value={formatTurnover(quote.turnover)} />
          </dl>
        </div>
      )}
    </aside>
  );
}
