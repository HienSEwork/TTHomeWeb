import type { Metadata } from "next";
import { ChangePasswordForm, ChangePhoneForm, DeleteAccount, ProfileForm } from "@/components/account-profile";
import { CURRENT_USER } from "@/lib/account";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.account.profileTitle };
}

export default async function ProfilePage() {
  const { t, fmt } = await getServerI18n();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-title font-extrabold text-ink">{t.account.profileTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.account.memberSince(fmt.date(CURRENT_USER.joinedAt))}</p>
      </div>
      <ProfileForm />
      <ChangePhoneForm />
      <ChangePasswordForm />
      <DeleteAccount />
    </div>
  );
}
