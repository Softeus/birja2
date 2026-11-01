"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/heatmap/DetailPanel";
import { FactorCard } from "@/components/heatmap/FactorCard";
import { HeatmapCanvas } from "@/components/heatmap/HeatmapCanvas";
import { PulseGauge } from "@/components/heatmap/PulseGauge";
import { SkeletonBlock } from "@/components/heatmap/SkeletonBlock";
import { StateLab } from "@/components/heatmap/StateLab";
import { StatusBar } from "@/components/heatmap/StatusBar";
import { useMarketData } from "@/components/heatmap/useMarketData";
import { computePulse } from "@/lib/market/pulse";
import { formatDecimal, formatDelta, formatTime } from "@/lib/market/format";

export default function HeatmapPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number> | null>(null);

  const simulated = overrides !== null;
  const { data, state, source, setSource, override, setOverride, retry } =
    useMarketData(simulated);

  // Esc сбрасывает выбор и возвращает фокус на плитку (FR-27).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedId) {
        setSelectedId(null);
        document.querySelector<HTMLElement>(`[data-secid="${selectedId}"]`)?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const quotes = data?.quotes ?? [];
  const selected = quotes.find((q) => q.secId === selectedId) ?? null;

  // Пульс: в режиме моделирования — пересчёт из замёрзших факторов с переопределениями.
  const pulse = useMemo(() => {
    if (!data) return null;
    if (!overrides) return data.pulse;
    const factors = data.pulse.factors.map((f) => ({
      ...f,
      score: overrides[f.id] ?? f.score,
      available: true,
    }));
    return { ...computePulse(factors), methodVersion: "pulse-1" as const, factors };
  }, [data, overrides]);

  const originalValue = data?.pulse.value ?? null;

  function handleSlider(id: string, value: number) {
    setOverrides((prev) => ({ ...(prev ?? {}), [id]: value }));
  }

  function resetSim() {
    setOverrides(null);
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="shrink-0 border-b px-6 py-3">
        <div className="flex items-center gap-5">
          <PulseGauge value={pulse?.value ?? null} zone={pulse?.zone ?? null} />
          <div className="flex flex-col gap-1">
            {data ? (
              <>
                <div className="flex items-baseline gap-4 text-sm">
                  <span>
                    IMOEX{" "}
                    <b className="font-semibold tabular-nums">
                      {formatDecimal(data.index.value)}
                    </b>{" "}
                    <span className="text-muted-foreground tabular-nums">
                      {formatDelta(data.index.changePct)}
                    </span>
                  </span>
                  <span>
                    RVI{" "}
                    <b className="font-semibold tabular-nums">
                      {formatDecimal(data.rvi.value)}
                    </b>
                  </span>
                  {state === "closed" && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      Торги закрыты
                    </span>
                  )}
                  {state === "stale" && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      Данные от {formatTime(data.index.updatedAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  методика {data.pulse.methodVersion} · веса равные · данные{" "}
                  {formatTime(data.index.updatedAt)} · {source === "live" ? "ISS" : "mock"}
                </p>
                {!simulated &&
                  data.pulse.value === null &&
                  data.pulse.missing.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Индекс не рассчитан: нет {data.pulse.missing.join(", ")}
                    </p>
                  )}
              </>
            ) : (
              <SkeletonBlock w={220} h={16} />
            )}
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBreakdown((v) => !v)}
            >
              Разобрать индекс
            </Button>
          </div>
        </div>

        {simulated && (
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-primary/40 px-3 py-1.5 text-xs">
            <span className="font-medium text-primary">Моделирование</span>
            <span className="text-muted-foreground tabular-nums">
              Исходное {originalValue === null ? "—" : Math.round(originalValue)} → Сценарий{" "}
              {pulse && pulse.value !== null ? Math.round(pulse.value) : "—"}
            </span>
            <button
              type="button"
              onClick={resetSim}
              className="ml-auto rounded-md border px-2 py-0.5 hover:bg-accent"
            >
              Вернуться к данным
            </button>
          </div>
        )}

        {showBreakdown && data && data.pulse.factors.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.pulse.factors.map((f) => (
              <FactorCard
                key={f.id}
                factor={f}
                override={overrides?.[f.id] ?? null}
                onOverride={(v) => handleSlider(f.id, v)}
              />
            ))}
          </div>
        )}
      </header>

      {state === "error" && (
        <div className="flex items-center gap-3 border-b bg-muted/40 px-6 py-2 text-sm">
          <span className="text-muted-foreground">Данные не обновлены</span>
          <button
            type="button"
            onClick={retry}
            className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
          >
            Повторить
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 p-4">
          {state === "loading" ? (
            <div className="grid h-full grid-cols-3 grid-rows-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonBlock key={i} h="100%" className="min-h-[110px]" />
              ))}
            </div>
          ) : state === "empty" ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Нет бумаг под фильтр
            </div>
          ) : (
            <HeatmapCanvas
              quotes={quotes}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </main>
        <DetailPanel quote={selected} onClose={() => setSelectedId(null)} />
      </div>

      <StatusBar
        asOf={data?.index.updatedAt ?? null}
        delaySec={data?.delaySec ?? 900}
        source={source}
        count={quotes.length}
      />

      <StateLab
        state={state}
        source={source}
        onSource={setSource}
        override={override}
        onOverride={setOverride}
      />
    </div>
  );
}
