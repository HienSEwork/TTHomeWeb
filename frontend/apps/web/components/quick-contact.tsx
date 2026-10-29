import { MessageCircle, Phone } from "lucide-react";
import { SITE } from "@tthome/data";

/** Call, Zalo and Messenger buttons pinned to every page. */
export function QuickContact() {
  const item =
    "grid size-12 place-items-center rounded-full border border-line bg-white shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0";
  return (
    <nav aria-label="Liên hệ nhanh" className="fixed right-4 bottom-4 z-30 flex flex-col gap-2.5 sm:right-6 sm:bottom-6">
      <a href={SITE.zalo} target="_blank" rel="noopener" className={`${item} text-[0.8125rem] font-extrabold text-[#0068ff]`} aria-label="Nhắn Zalo cho TTHOME">
        Zalo
      </a>
      <a href={SITE.messenger} target="_blank" rel="noopener" className={`${item} text-ink-soft`} aria-label="Nhắn Messenger cho TTHOME">
        <MessageCircle aria-hidden className="size-5" />
      </a>
      <a href={SITE.hotlineHref} className={`${item} border-gold bg-gold text-on-primary`} aria-label={`Gọi ${SITE.hotline}`}>
        <Phone aria-hidden className="size-5" />
      </a>
    </nav>
  );
}
