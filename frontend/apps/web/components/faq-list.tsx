import { ChevronDown } from "lucide-react";
import type { Faq } from "@tthome/data";

/** Native details/summary accordions: work without JavaScript and with keyboard. */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-surface">
      {items.map((f) => (
        <details key={f.id} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink">
            {f.question}
            <ChevronDown aria-hidden className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-ink-soft">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
