import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleIndex } from "@/components/article-index";
import { allTags, postsByTag } from "@/lib/articles";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allTags().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = allTags().find((t) => t.slug === slug);
  if (!tag) return {};
  return { title: `Bài viết về ${tag.name}`, alternates: { canonical: `/tin-tuc/tag/${tag.slug}` }, robots: { index: false, follow: true } };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = allTags().find((t) => t.slug === slug);
  if (!tag) notFound();
  return (
    <ArticleIndex
      title={`Bài viết về ${tag.name}`}
      description={`Các bài trong cẩm nang TTHOME được gắn thẻ “${tag.name}”.`}
      posts={postsByTag(tag.slug)}
      crumbs={[{ href: "/tin-tuc", label: "Cẩm nang" }, { label: tag.name }]}
    />
  );
}
