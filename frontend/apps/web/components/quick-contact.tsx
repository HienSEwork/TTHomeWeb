import { MessageCircle, Phone } from "lucide-react";
import { SITE } from "@tthome/data";
import { getI18n, type Lang } from "@/lib/i18n";

/** Call, Zalo and Messenger buttons pinned to every page. */
export function QuickContact({ lang }: { lang?: Lang }) {
  const { t } = getI18n(lang);
  const item =
    "grid size-11 place-items-center sm:size-12 rounded-full border border-line bg-white shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0";
  return (
    <nav aria-label={t.quickContact.label} className="fixed right-4 bottom-4 z-30 flex flex-col gap-2 sm:right-6 sm:gap-2.5 sm:bottom-6">
      <a href={SITE.zalo} target="_blank" rel="noopener" className={`${item} text-[0.8125rem] font-extrabold text-[#0068ff]`} aria-label={t.quickContact.zalo}>
        Zalo
      </a>
      <a href={SITE.messenger} target="_blank" rel="noopener" className={`${item} text-ink-soft`} aria-label={t.quickContact.messenger}>
        <MessageCircle aria-hidden className="size-5" />
      </a>
      <a href={SITE.hotlineHref} className={`${item} border-gold bg-gold text-on-primary`} aria-label={t.common.call(SITE.hotline)}>
        <Phone aria-hidden className="size-5" />
      </a>
    </nav>
  );
}
