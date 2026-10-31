import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { SITE } from "@tthome/data";
import { cn } from "@tthome/ui";
import { getI18n, type Lang } from "@/lib/i18n";

/* Brand glyphs lucide does not ship, drawn on a 24-unit grid like its icons. */

function FacebookIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H7.9v3h2.6V21h3Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
      <path d="M16.6 3h-3v11.9a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.3a5.7 5.7 0 1 0 4.8 5.6V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-4.3-4.3Z" />
    </svg>
  );
}

function ZaloIcon() {
  return (
    <span aria-hidden className="text-[0.625rem] font-extrabold tracking-tight">
      Zalo
    </span>
  );
}

/** Round links to TTHOME's Facebook, TikTok, Zalo and email. */
export function SocialLinks({ lang, className }: { lang?: Lang; className?: string }) {
  const { t } = getI18n(lang);
  const links: { href: string; label: string; icon: ReactNode; external: boolean }[] = [
    { href: SITE.facebook, label: t.footer.facebook, icon: <FacebookIcon />, external: true },
    { href: SITE.tiktok, label: t.footer.tiktok, icon: <TikTokIcon />, external: true },
    { href: SITE.zalo, label: t.footer.zalo, icon: <ZaloIcon />, external: true },
    { href: `mailto:${SITE.email}`, label: t.footer.mail, icon: <Mail aria-hidden className="size-[18px]" />, external: false },
  ];
  return (
    <ul aria-label={t.footer.social} className={cn("flex items-center gap-2.5", className)}>
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noopener" } : {})}
            aria-label={l.label}
            title={l.label}
            className="grid size-10 place-items-center rounded-full border border-line-strong bg-white text-ink-soft transition-colors hover:border-gold-deep hover:bg-gold-soft hover:text-gold-ink"
          >
            {l.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
