export function SectorGroup({
  sector,
  x,
  y,
  width,
  height,
}: {
  sector: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    <div className="absolute" style={{ left: x, top: y, width, height }}>
      <div className="pointer-events-none absolute inset-0 rounded-md border border-border/70" />
      <span className="absolute left-1.5 top-1 truncate text-xs font-medium text-muted-foreground">
        {sector}
      </span>
    </div>
  );
}
