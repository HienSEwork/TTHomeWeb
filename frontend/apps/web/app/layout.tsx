import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from "next/font/google";
import { SITE } from "@tthome/data";
import { LangProvider } from "@/lib/i18n/client";
import { OG_LOCALE } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n/server";
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

/** Display face for headings; UI text stays on Be Vietnam Pro. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getServerI18n();
  return {
    metadataBase: new URL("https://tthome.vn"),
    title: { default: t.meta.title, template: "%s | TTHOME" },
    description: t.meta.description,
    openGraph: { siteName: SITE.name, locale: OG_LOCALE[lang], type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#fbf9f5" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getServerI18n();
  return (
    <html lang={lang} className={`${beVietnam.variable} ${jakarta.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          {t.common.skipToContent}
        </a>
        <LangProvider lang={lang}>
          <SiteHeader />
          <main id="noi-dung" className="flex-1">
            {children}
          </main>
          <SiteFooter lang={lang} />
          <QuickContact lang={lang} />
        </LangProvider>
      </body>
    </html>
  );
}
