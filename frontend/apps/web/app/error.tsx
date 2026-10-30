"use client";

import Link from "next/link";
import { SITE } from "@tthome/data";
import { Container, buttonStyles } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <Container className="flex flex-col items-start py-20 sm:py-28">
      <h1 className="text-title font-extrabold text-ink">{t.error.title}</h1>
      <p className="mt-3 max-w-lg text-ink-soft">{t.error.text(SITE.hotline)}</p>
      <div className="mt-8 flex flex-wrap gap-2">
        <button type="button" onClick={reset} className={buttonStyles({ variant: "primary", size: "lg" })}>
          {t.error.retry}
        </button>
        <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          {t.common.backHome}
        </Link>
      </div>
    </Container>
  );
}
