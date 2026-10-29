import type { Metadata } from "next";
import { MyAppointments } from "@/components/account-appointments";
import { myAppointments } from "@/lib/account";

export const metadata: Metadata = { title: "Lịch hẹn của tôi" };

export default function AppointmentsPage() {
  return (
    <div>
      <h1 className="text-title font-extrabold text-ink">Lịch hẹn của tôi</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Đổi hoặc hủy lịch trước giờ hẹn ít nhất 2 giờ để nhân viên sắp xếp lại.</p>
      <MyAppointments initial={myAppointments()} />
    </div>
  );
}
