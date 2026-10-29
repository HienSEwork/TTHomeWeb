import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@tthome/ui";

/** Section title with an optional line of context and a "see all" link on the right (desktop). */
export function SectionHeading({
  id,
  title,
  description,
  href,
  linkLabel,
  center,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-x-8 gap-y-3", center ? "flex-col items-center text-center" : "justify-between", className)}>
      <div className={cn("max-w-2xl", center && "mx-auto")}>
        <h2 id={id} className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-ink sm:text-[2.125rem]">
          {title}
        </h2>
        {description ? <p className="mt-2 text-[0.9375rem] text-muted">{description}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gold-ink hover:text-ink">
          {linkLabel}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0" />
        </Link>
      ) : null}
    </div>
  );
}
