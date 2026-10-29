import type { Metadata } from "next";
import { formatDate } from "@tthome/ui";
import { ChangePasswordForm, ChangePhoneForm, DeleteAccount, ProfileForm } from "@/components/account-profile";
import { CURRENT_USER } from "@/lib/account";

export const metadata: Metadata = { title: "Hồ sơ" };

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-title font-extrabold text-ink">Hồ sơ</h1>
        <p className="mt-1 text-sm text-muted">Thành viên từ ngày {formatDate(CURRENT_USER.joinedAt)}.</p>
      </div>
      <ProfileForm />
      <ChangePhoneForm />
      <ChangePasswordForm />
      <DeleteAccount />
    </div>
  );
}
