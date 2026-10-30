import type { Metadata } from "next";
import { MyAppointments } from "@/components/account-appointments";
import { myAppointments } from "@/lib/account";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.account.appointmentsTitle };
}

export default async function AppointmentsPage() {
  const { t } = await getServerI18n();
  return (
    <div>
      <h1 className="text-title font-extrabold text-ink">{t.account.appointmentsTitle}</h1>
      <p className="mt-1 mb-6 text-sm text-muted">{t.account.appointmentsText}</p>
      <MyAppointments initial={myAppointments()} />
    </div>
  );
}
