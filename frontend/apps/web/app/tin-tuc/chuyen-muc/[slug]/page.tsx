import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleIndex } from "@/components/article-index";
import { findCategory, postsByCategory } from "@/lib/articles";
import { localCategory } from "@/lib/i18n/content";
import { getServerI18n } from "@/lib/i18n/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = findCategory((await params).slug);
  if (!found) return {};
  const { lang, t } = await getServerI18n();
  const category = localCategory(found, lang);
  return { title: category.name, description: t.news.categoryMeta(category.name), alternates: { canonical: `/tin-tuc/chuyen-muc/${category.slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const found = findCategory((await params).slug);
  if (!found) notFound();
  const { lang, t } = await getServerI18n();
  const category = localCategory(found, lang);
  return (
    <ArticleIndex
      title={category.name}
      description={t.news.categoryLead(category.name)}
      posts={postsByCategory(category.slug)}
      crumbs={[{ href: "/tin-tuc", label: t.news.crumb }, { label: category.name }]}
      activeCategory={category.slug}
      lang={lang}
    />
  );
}
