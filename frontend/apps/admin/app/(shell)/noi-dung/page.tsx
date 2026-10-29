import type { Metadata } from "next";
import { PageHeader } from "@/components/page-parts";
import { ContentBoard } from "./content-board";

export const metadata: Metadata = { title: "Nội dung" };

export default function ContentPage() {
  return (
    <>
      <PageHeader
        title="Nội dung"
        description="Bài cẩm nang, banner, trang tĩnh, câu hỏi thường gặp và menu. Thay đổi hiện trên web sau khi lưu, không cần triển khai lại."
      />
      <ContentBoard />
    </>
  );
}
