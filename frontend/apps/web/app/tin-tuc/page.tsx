import type { Metadata } from "next";
import { publishedPosts } from "@tthome/data";
import { ArticleIndex } from "@/components/article-index";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.news.metaTitle, description: t.news.metaDescription, alternates: { canonical: "/tin-tuc" } };
}

export default async function NewsPage() {
  const { lang, t } = await getServerI18n();
  return <ArticleIndex title={t.news.title} description={t.news.lead} posts={publishedPosts()} crumbs={[{ label: t.news.crumb }]} lang={lang} />;
}
