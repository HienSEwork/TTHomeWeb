import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@tthome/ui";
import { LandlordRooms, LandlordSubmissions } from "@/components/account-landlord";
import { landlordListings } from "@/lib/account";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.account.landlordTitle };
}

export default async function LandlordPage() {
  const { t } = await getServerI18n();
  const { submissions, rooms } = landlordListings();
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-extrabold text-ink">{t.account.landlordTitle}</h1>
          <p className="mt-1 text-sm text-muted">{t.account.landlordText}</p>
        </div>
        <Link href="/ky-gui" className={buttonStyles({ variant: "primary" })}>
          {t.account.consignMore}
        </Link>
      </div>

      <section aria-labelledby="ho-so-ky-gui">
        <h2 id="ho-so-ky-gui" className="text-lg font-bold text-ink">
          {t.account.submissions}
        </h2>
        <div className="mt-4">
          <LandlordSubmissions items={submissions} />
        </div>
      </section>

      <section aria-labelledby="phong-dang-dang">
        <h2 id="phong-dang-dang" className="text-lg font-bold text-ink">
          {t.account.listed}
        </h2>
        <p className="mt-1 text-sm text-muted">{t.account.listedText}</p>
        <div className="mt-4">
          <LandlordRooms initial={rooms} />
        </div>
      </section>
    </div>
  );
}
