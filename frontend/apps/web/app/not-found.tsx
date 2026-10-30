import Link from "next/link";
import { Container, Plate, buttonStyles } from "@tthome/ui";
import { getServerI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getServerI18n();
  return (
    <Container className="flex flex-col items-start py-20 sm:py-28">
      <Plate value="404" size="lg" />
      <h1 className="mt-8 text-title font-extrabold text-ink">{t.notFound.title}</h1>
      <p className="mt-3 max-w-lg text-ink-soft">{t.notFound.text}</p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/tim-kiem" className={buttonStyles({ variant: "primary", size: "lg" })}>
          {t.common.findRoom}
        </Link>
        <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          {t.common.backHome}
        </Link>
      </div>
    </Container>
  );
}
