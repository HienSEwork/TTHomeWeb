import type { Metadata } from "next";
import { SavedRooms } from "@/components/account-saved";
import { savedRooms } from "@/lib/account";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.account.savedTitle };
}

export default async function SavedPage() {
  const { t } = await getServerI18n();
  return (
    <div>
      <h1 className="text-title font-extrabold text-ink">{t.account.savedTitle}</h1>
      <p className="mt-1 mb-6 text-sm text-muted">{t.account.savedText}</p>
      <SavedRooms initial={savedRooms()} />
    </div>
  );
}
