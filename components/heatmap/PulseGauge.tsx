import type { Zone } from "@/lib/market/types";

const ARC = 169.65; // π × 54

function zoneLabel(zone: Zone): string {
  switch (zone) {
    case "fear":
      return "страх";
    case "caution":
      return "осторожность";
    case "neutral":
      return "нейтрально";
    case "optimism":
      return "оптимизм";
    case "greed":
      return "жадность";
    default:
      return "—";
  }
}

function strokeClass(zone: Zone): string {
  switch (zone) {
    case "fear":
    case "caution":
      return "stroke-sentiment-fear";
    case "optimism":
    case "greed":
      return "stroke-sentiment-greed";
    default:
      return "stroke-sentiment-neutral";
  }
}

export function PulseGauge({ value, zone }: { value: number | null; zone: Zone }) {
  const v = value === null ? 0 : Math.min(100, Math.max(0, value));
  const dash = (v / 100) * ARC;

  return (
    <div className="relative h-[60px] w-[120px] shrink-0">
      <svg
        viewBox="0 0 120 66"
        className="absolute inset-0 h-full w-full"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value === null ? undefined : Math.round(value)}
        aria-valuetext={
          value === null
            ? "Индекс не рассчитан"
            : `${Math.round(value)} из 100, ${zoneLabel(zone)}`
        }
      >
        <path
          d="M 6 60 A 54 54 0 0 1 114 60"
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-muted"
        />
        <path
          d="M 6 60 A 54 54 0 0 1 114 60"
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${ARC}`}
          className={strokeClass(zone)}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-28 font-semibold leading-none tabular-nums">
          {value === null ? "—" : Math.round(value)}
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">
          {value === null ? "не рассчитан" : zoneLabel(zone)}
        </span>
      </div>
    </div>
  );
}
