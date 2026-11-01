"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "./Sparkline";

export function SparklineCard({ secId }: { secId: string }) {
  const [points, setPoints] = useState<number[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPoints(null);
    setError(false);
    fetch(`/api/market/${secId}/spark`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { points?: number[] }) => {
        if (!cancelled) setPoints(j.points ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [secId]);

  if (error) return <p className="text-xs text-muted-foreground">Нет данных</p>;
  if (points === null) return <div className="h-10 animate-pulse rounded bg-muted" />;
  if (points.length < 2) return <p className="text-xs text-muted-foreground">Нет данных</p>;

  const positive = points[points.length - 1] >= points[0];
  return <Sparkline points={points} positive={positive} className="h-10 w-full" />;
}
