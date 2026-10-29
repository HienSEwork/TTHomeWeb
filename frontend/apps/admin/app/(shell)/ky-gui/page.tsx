import type { Metadata } from "next";
import { PageHeader } from "@/components/page-parts";
import { ReviewBoard } from "./review-board";

export const metadata: Metadata = { title: "Duyệt ký gửi" };

export default function ConsignmentsPage() {
  return (
    <>
      <PageHeader title="Duyệt ký gửi" description="Chủ nhà chờ phản hồi trong 24 giờ. Duyệt để hẹn đội chụp ảnh, hoặc yêu cầu bổ sung khi thiếu thông tin." />
      <ReviewBoard />
    </>
  );
}
