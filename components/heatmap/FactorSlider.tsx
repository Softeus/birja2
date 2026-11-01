import { Slider } from "@/components/ui/slider";

export function FactorSlider({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <Slider
      aria-label={label}
      value={[value]}
      min={0}
      max={100}
      step={1}
      disabled={disabled}
      onValueChange={(v) => onChange(v[0] ?? 0)}
    />
  );
}
