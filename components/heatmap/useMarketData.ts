"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketResponse } from "@/lib/market/types";
import mockSnapshot from "@/lib/market/fixtures/market.snapshot.json";

export type DataState = "loading" | "live" | "stale" | "closed" | "error" | "empty";

export function deriveState(data: MarketResponse | null): DataState {
  if (!data || data.quotes.length === 0) return "empty";
  if (data.session === "closed") return "closed";
  if (data.delaySec > 900) return "stale";
  return "live";
}

const POLL_MS = 15_000;

export function useMarketData(paused = false) {
  const [data, setData] = useState<MarketResponse | null>(null);
  const [source, setSource] = useState<"live" | "mock">("live");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [override, setOverride] = useState<DataState | null>(null);
  const timer = useRef<number | null>(null);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as MarketResponse);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (source !== "live" || paused) return;
    fetchLive();
    timer.current = window.setInterval(fetchLive, POLL_MS);
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, [source, fetchLive, paused]);

  const effective =
    source === "mock" ? (mockSnapshot as unknown as MarketResponse) : data;
  const state =
    override ?? (loading ? "loading" : error ? "error" : deriveState(effective));

  return {
    data: effective,
    state,
    source,
    setSource,
    override,
    setOverride,
    retry: fetchLive,
  };
}
