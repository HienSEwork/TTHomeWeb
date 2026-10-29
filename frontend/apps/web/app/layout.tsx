import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { SITE } from "@tthome/data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { QuickContact } from "@/components/quick-contact";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tthome.vn"),
  title: { default: "TTHOME: Thuê phòng trọ, căn hộ dịch vụ ở TP.HCM", template: "%s | TTHOME" },
  description:
    "Tìm phòng trọ, studio và căn hộ dịch vụ còn trống ở TP. Hồ Chí Minh. Giá đã ghi rõ điện nước, xem phòng miễn phí cùng nhân viên TTHOME.",
  openGraph: { siteName: SITE.name, locale: "vi_VN", type: "website" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Bỏ qua menu
        </a>
        <SiteHeader />
        <main id="noi-dung" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <QuickContact />
      </body>
    </html>
  );
}
