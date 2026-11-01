export function Sparkline({
  points,
  positive,
  className,
}: {
  points: number[];
  positive: boolean;
  className?: string;
}) {
  const w = 300;
  const h = 60;
  const pad = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => [
    pad + i * stepX,
    pad + (h - pad * 2) * (1 - (p - min) / range),
  ]);
  const poly = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={poly}
        fill="none"
        stroke={positive ? "var(--bullish-2)" : "var(--bearish-2)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
