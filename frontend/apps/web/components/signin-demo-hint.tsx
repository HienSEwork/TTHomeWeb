"use client";

import { DEMO_ACCOUNTS, DEMO_OTP } from "@tthome/data";
import { cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";

/** The demo account to try, shown on the sign-in page and in the sign-in drawer. */
export function SignInDemoHint({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <aside aria-label={t.signIn.demo} className={cn("rounded-xl border border-dashed border-line-strong bg-ivory px-4 py-3 text-sm text-ink-soft", className)}>
      <p className="font-semibold text-ink">{t.signIn.demoTitle}</p>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        <dt className="text-muted">{t.common.email}</dt>
        <dd className="font-mono break-all text-ink">{DEMO_ACCOUNTS.user.email}</dd>
        <dt className="text-muted">{t.signIn.password}</dt>
        <dd className="font-mono text-ink">{DEMO_ACCOUNTS.user.password}</dd>
      </dl>
      <p className="mt-1.5 text-xs text-muted">{t.signIn.demoPhone(DEMO_ACCOUNTS.user.phone, DEMO_OTP)}</p>
    </aside>
  );
}
