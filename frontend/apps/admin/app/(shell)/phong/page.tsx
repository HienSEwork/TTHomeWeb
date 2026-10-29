import type { Metadata } from "next";
import { PageHeader } from "@/components/page-parts";
import { ProjectsTable } from "./projects-table";

export const metadata: Metadata = { title: "Phòng và dự án" };

export default function RoomsPage() {
  return (
    <>
      <PageHeader
        title="Phòng và dự án"
        description="Giá, trạng thái và ngày trống lấy từ Meey CRM. Tại đây chỉ sửa phần hiển thị trên web: ảnh bìa, SEO, nhãn ưu đãi."
      />
      <ProjectsTable />
    </>
  );
}
