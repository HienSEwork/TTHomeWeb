import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@tthome/data";
import { BrandLogo } from "./brand-logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Tìm phòng",
    links: [
      { href: "/tim-kiem", label: "Tất cả phòng" },
      { href: "/khu-vuc", label: "Theo khu vực" },
      { href: "/tim-kiem?type=studio", label: "Căn studio" },
      { href: "/tim-kiem?price=0-5000000", label: "Phòng dưới 5 triệu" },
      { href: "/dat-lich", label: "Nhờ tư vấn tìm phòng" },
    ],
  },
  {
    title: "Dành cho chủ nhà",
    links: [
      { href: "/ky-gui", label: "Ký gửi phòng" },
      { href: "/chinh-sach/chinh-sach-ky-gui", label: "Chính sách ký gửi" },
      { href: "/tuyen-ctv", label: "Làm cộng tác viên" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { href: "/tin-tuc", label: "Cẩm nang thuê phòng" },
      { href: "/hoi-dap", label: "Câu hỏi thường gặp" },
      { href: "/chinh-sach/quy-trinh-thue-phong", label: "Quy trình thuê phòng" },
      { href: "/lien-he", label: "Liên hệ" },
    ],
  },
  {
    title: "Về TTHOME",
    links: [
      { href: "/ve-chung-toi", label: "Giới thiệu" },
      { href: "/chinh-sach/dieu-khoan-su-dung", label: "Điều khoản sử dụng" },
      { href: "/chinh-sach/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-ivory">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <BrandLogo variant="full" height={96} />
          <p className="mt-5 text-sm leading-relaxed text-muted">Không gian phù hợp, nhịp sống của riêng bạn. Xem phòng tận nơi cùng nhân viên TTHOME, miễn phí.</p>
          <ul className="mt-5 space-y-2 text-sm text-ink-soft">
            <li className="flex items-center gap-2">
              <Phone aria-hidden className="size-4 text-gold-deep" />
              <a href={SITE.hotlineHref} className="tabular font-semibold text-ink hover:text-gold-ink">
                {SITE.hotline}
              </a>
            </li>
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
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-bold text-ink">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-gold-ink">
                    {l.label}
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
            © 2026 {SITE.company}. Mã số thuế {SITE.taxCode}.
          </p>
          <p>Giờ hỗ trợ: {SITE.hours}</p>
        </div>
      </div>
    </footer>
  );
}
