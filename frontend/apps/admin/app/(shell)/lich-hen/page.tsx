import type { Metadata } from "next";
import { PageHeader } from "@/components/page-parts";
import { AppointmentBoard } from "./appointment-board";

export const metadata: Metadata = { title: "Lịch hẹn xem phòng" };

export default function AppointmentsPage() {
  return (
    <>
      <PageHeader title="Lịch hẹn xem phòng" description="Xác nhận lịch mới trong 2 giờ làm việc. Khách nhận tin nhắn xác nhận và nhắc lịch trước 2 giờ." />
      <AppointmentBoard />
    </>
  );
}
