import type { Metadata } from "next";
import { publishedPosts } from "@tthome/data";
import { ArticleIndex } from "@/components/article-index";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Cẩm nang thuê phòng",
  description: "Kinh nghiệm thuê phòng trọ, đặt cọc, chọn khu vực sống ở Sài Gòn và tin thị trường cho thuê từ đội ngũ TTHOME.",
  alternates: { canonical: "/tin-tuc" },
};

export default function NewsPage() {
  return (
    <ArticleIndex
      title="Cẩm nang thuê phòng"
      description="Những điều chúng tôi học được sau hàng nghìn buổi dẫn khách đi xem phòng ở Sài Gòn."
      posts={publishedPosts()}
      crumbs={[{ label: "Cẩm nang" }]}
    />
  );
}
