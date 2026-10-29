import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { POST_CATEGORIES } from "@tthome/data";
import { ArticleIndex } from "@/components/article-index";
import { findCategory, postsByCategory } from "@/lib/articles";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POST_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = findCategory((await params).slug);
  if (!category) return {};
  return { title: category.name, description: `Bài viết chuyên mục ${category.name} trên cẩm nang TTHOME.`, alternates: { canonical: `/tin-tuc/chuyen-muc/${category.slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const category = findCategory((await params).slug);
  if (!category) notFound();
  return (
    <ArticleIndex
      title={category.name}
      description={`Bài viết trong chuyên mục ${category.name.toLowerCase()}.`}
      posts={postsByCategory(category.slug)}
      crumbs={[{ href: "/tin-tuc", label: "Cẩm nang" }, { label: category.name }]}
      activeCategory={category.slug}
    />
  );
}
