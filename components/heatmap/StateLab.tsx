"use client";

import type { DataState } from "./useMarketData";

const STATES: DataState[] = ["loading", "live", "stale", "closed", "error", "empty"];

export function StateLab({
  state,
  source,
  onSource,
  override,
  onOverride,
}: {
  state: DataState;
  source: "live" | "mock";
  onSource: (s: "live" | "mock") => void;
  override: DataState | null;
  onOverride: (s: DataState | null) => void;
}) {
  return (
    <div className="fixed bottom-3 right-3 z-10 flex w-56 flex-col gap-2 rounded-lg border bg-card p-2 text-xs shadow-lg">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="font-medium">StateLab</span>
        <span className="rounded bg-muted px-1.5 py-0.5 tabular-nums">{override ?? state}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onOverride(override === s ? null : s)}
            className={`rounded-md border px-2 py-1 transition-colors ${
              override === s ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-1 text-muted-foreground">источник</span>
        {(["live", "mock"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSource(s)}
            className={`rounded-md border px-2 py-1 ${
              source === s ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
