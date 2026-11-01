export function SkeletonBlock({
  w,
  h = 16,
  className = "",
}: {
  w?: number | string;
  h?: number | string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-muted motion-reduce:animate-none ${className}`}
      style={{
        width: w ?? "100%",
        height: h ?? "100%",
      }}
    />
  );
}
