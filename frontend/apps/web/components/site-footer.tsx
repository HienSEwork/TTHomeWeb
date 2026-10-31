import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@tthome/data";
import { getI18n, type Dictionary, type Lang } from "@/lib/i18n";
import { BrandLogo } from "./brand-logo";
import { SocialLinks } from "./social-links";

type Footer = Dictionary["footer"];
/** Footer entries that are plain text (not the formatting functions). */
type FooterKey = { [K in keyof Footer]: Footer[K] extends string ? K : never }[keyof Footer];

const COLUMNS: { title: FooterKey; links: { href: string; label: FooterKey }[] }[] = [
  {
    title: "find",
    links: [
      { href: "/tim-kiem", label: "allRooms" },
      { href: "/khu-vuc", label: "byArea" },
      { href: "/tim-kiem?type=studio", label: "studio" },
      { href: "/tim-kiem?price=0-5000000", label: "under5" },
      { href: "/dat-lich", label: "askHelp" },
    ],
  },
  {
    title: "landlords",
    links: [
      { href: "/ky-gui", label: "consign" },
      { href: "/chinh-sach/chinh-sach-ky-gui", label: "consignPolicy" },
      { href: "/tuyen-ctv", label: "partner" },
      { href: "/tuyen-dung", label: "jobs" },
    ],
  },
  {
    title: "support",
    links: [
      { href: "/tin-tuc", label: "guide" },
      { href: "/hoi-dap", label: "faq" },
      { href: "/chinh-sach/quy-trinh-thue-phong", label: "process" },
      { href: "/lien-he", label: "contact" },
    ],
  },
  {
    title: "about",
    links: [
      { href: "/ve-chung-toi", label: "intro" },
      { href: "/chinh-sach/dieu-khoan-su-dung", label: "terms" },
      { href: "/chinh-sach/chinh-sach-bao-mat", label: "privacy" },
    ],
  },
];

export function SiteFooter({ lang }: { lang?: Lang }) {
  const { t } = getI18n(lang);
  return (
    <footer className="mt-24 border-t border-line bg-ivory">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <BrandLogo variant="full" height={104} alt={t.brand.logoAlt} />
          <p className="mt-5 text-sm leading-relaxed text-muted">{t.footer.tagline}</p>
          <a
            href={SITE.hotlineHref}
            className="mt-5 flex items-center gap-3 rounded-2xl bg-gold-soft px-4 py-3 transition-colors hover:bg-[#f3e4c8]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-gold-deep shadow-[var(--shadow-soft)]">
              <Phone aria-hidden className="size-[18px]" />
            </span>
            <span className="leading-tight">
              <span className="block text-xs text-gold-ink">{t.footer.hotlineLabel}</span>
              <span className="tabular block text-xl font-extrabold text-ink">{SITE.hotline}</span>
            </span>
          </a>
          <ul className="mt-5 space-y-2 text-sm text-ink-soft">
            <li className="flex items-center gap-2">
              <Mail aria-hidden className="size-4 text-gold-deep" />
              <a href={`mailto:${SITE.email}`} className="hover:text-gold-ink">
                {SITE.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-deep" />
              <span>{SITE.address}</span>
            </li>
          </ul>
          <SocialLinks lang={lang} className="mt-5" />
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-bold text-ink">{t.footer[col.title]}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-gold-ink">
                    {t.footer[l.label]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-1 px-4 py-6 text-xs text-muted sm:px-6 md:flex-row md:justify-between">
          <p>
            © 2026 {SITE.company}. {t.footer.taxCode(SITE.taxCode)}
          </p>
          <p>{t.footer.hours(t.common.hours)}</p>
        </div>
      </div>
    </footer>
  );
}
