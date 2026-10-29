import { cn } from "../lib/cn";

type PlateProps = {
  /** The figure painted on the plate, usually a count of vacant rooms. */
  value: number | string;
  /** Short line under the figure, for example "phòng trống". */
  unit?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  xs: { box: "px-1.5 py-0.5 gap-1", value: "text-xs", unit: "text-[0.625rem]" },
  sm: { box: "px-2 py-1 gap-1.5", value: "text-sm", unit: "text-[0.6875rem]" },
  md: { box: "px-3 py-2 flex-col gap-0", value: "text-2xl", unit: "text-xs" },
  lg: { box: "px-4 py-3 flex-col gap-0.5", value: "text-[2.75rem] leading-none", unit: "text-sm" },
} as const;

/**
 * A Saigon house-number plate. TTHome paints its vacancy counts on these so a
 * figure reads like an address you can walk to.
 */
export function Plate({ value, unit, size = "sm", className }: PlateProps) {
  const s = sizes[size];
  return (
    <span className={cn("plate tabular inline-flex items-center font-bold", s.box, className)}>
      <span className={cn("tracking-tight", s.value)}>{value}</span>
      {unit ? <span className={cn("font-medium opacity-80", s.unit)}>{unit}</span> : null}
    </span>
  );
}
