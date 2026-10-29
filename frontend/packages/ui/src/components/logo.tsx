import { cn } from "../lib/cn";

/**
 * The TTHome mark: a house-number plate with the two Ts, then the wordmark.
 * `tone="light"` is for dark backgrounds.
 */
export function Logo({ className, tone = "dark", withWord = true }: { className?: string; tone?: "dark" | "light"; withWord?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className="plate grid h-8 w-10 place-items-center text-[0.95rem] font-extrabold tracking-[-0.06em]">
        TT
      </span>
      {withWord ? (
        <span className={cn("text-xl font-extrabold tracking-[-0.03em]", tone === "light" ? "text-white" : "text-ink")}>
          TTHome
        </span>
      ) : (
        <span className="sr-only">TTHome</span>
      )}
    </span>
  );
}
