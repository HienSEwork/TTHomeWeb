import type { Metadata } from "next";
import { Container } from "@tthome/ui";
import { AccountNav } from "@/components/account-nav";
import { CURRENT_USER } from "@/lib/account";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: { default: t.account.metaTitle, template: t.account.metaTemplate }, robots: { index: false } };
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getServerI18n();
  const initials = CURRENT_USER.name.split(" ").slice(-2).map((w) => w[0]).join("");
  return (
    <Container className="py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-3">
            <span aria-hidden className="grid size-11 place-items-center rounded-full bg-gold text-sm font-bold text-on-primary">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{CURRENT_USER.name}</p>
              <p className="tabular text-sm text-muted">{CURRENT_USER.phone}</p>
            </div>
          </div>
          <AccountNav />
          {/* A plain link: the sign-out route clears the cookie, so it must never be prefetched. */}
          <a href="/dang-xuat" className="text-sm font-semibold text-muted hover:text-danger">
            {t.account.signOut}
          </a>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
