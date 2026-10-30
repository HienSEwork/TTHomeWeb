import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleIndex } from "@/components/article-index";
import { allTags, postsByTag } from "@/lib/articles";
import { localTag } from "@/lib/i18n/content";
import { getServerI18n } from "@/lib/i18n/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = allTags().find((x) => x.slug === slug);
  if (!tag) return {};
  const { lang, t } = await getServerI18n();
  return { title: t.news.tagTitle(localTag(tag.name, lang)), alternates: { canonical: `/tin-tuc/tag/${tag.slug}` }, robots: { index: false, follow: true } };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = allTags().find((x) => x.slug === slug);
  if (!tag) notFound();
  const { lang, t } = await getServerI18n();
  const name = localTag(tag.name, lang);
  return (
    <ArticleIndex
      title={t.news.tagTitle(name)}
      description={t.news.tagLead(name)}
      posts={postsByTag(tag.slug)}
      crumbs={[{ href: "/tin-tuc", label: t.news.crumb }, { label: name }]}
      lang={lang}
    />
  );
}
