import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@tthome/data";
import { Container, buttonStyles } from "@tthome/ui";
import { ArticleBody, ArticleToc } from "@/components/article-body";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { PostCard } from "@/components/post-card";
import { relatedPosts, tagSlug } from "@/lib/articles";
import { localPost, localTag } from "@/lib/i18n/content";
import { getServerI18n } from "@/lib/i18n/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = getPost((await params).slug);
  if (!found) return {};
  const { lang } = await getServerI18n();
  const post = localPost(found, lang);
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/tin-tuc/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, images: [post.cover], publishedTime: post.publishedAt, authors: [post.author] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const found = getPost((await params).slug);
  if (!found) notFound();
  const { lang, t, fmt } = await getServerI18n();
  const post = localPost(found, lang);
  const related = relatedPosts(found).map((p) => localPost(p, lang));

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: [post.cover],
          datePublished: post.publishedAt,
          author: { "@type": "Person", name: post.author },
          publisher: { "@type": "Organization", name: "TTHOME", url: "https://tthome.vn" },
          mainEntityOfPage: `https://tthome.vn/tin-tuc/${post.slug}`,
        }}
      />
      <Container className="py-8 sm:py-12">
        <Breadcrumbs items={[{ href: "/tin-tuc", label: t.news.crumb }, { href: `/tin-tuc/chuyen-muc/${post.category.slug}`, label: post.category.name }, { label: post.title }]} lang={lang} />
        <header className="mt-8 max-w-3xl">
          <Link href={`/tin-tuc/chuyen-muc/${post.category.slug}`} className="text-sm font-semibold text-shutter hover:underline">
            {post.category.name}
          </Link>
          <h1 className="mt-2 text-display font-extrabold text-balance text-ink">{post.title}</h1>
          <p className="mt-4 text-lg text-ink-soft">{post.excerpt}</p>
          <p className="mt-5 text-sm text-muted">
            {t.news.byline.by} <span className="font-semibold text-ink">{post.author}</span>
            {t.news.byline.on} <time dateTime={post.publishedAt}>{fmt.date(post.publishedAt)}</time>
            {t.news.byline.read(post.readMinutes)}
          </p>
        </header>
        <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-[22px] bg-line">
          <Image src={post.cover} alt="" fill priority sizes="(min-width: 1240px) 1192px, 100vw" className="object-cover" />
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_300px]">
          <div>
            <ArticleBody sections={post.sections} />
            <ul className="mt-10 flex flex-wrap gap-2" aria-label={t.news.tags}>
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link href={`/tin-tuc/tag/${tagSlug(tag)}`} className="inline-flex rounded-md bg-ink/[0.06] px-2.5 py-1 text-sm text-ink-soft hover:bg-ink/10">
                    {localTag(tag, lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <ArticleToc sections={post.sections} lang={lang} />
            <div className="rounded-card border border-gold/50 bg-gold-soft p-5 text-ink">
              <p className="font-bold">{t.news.ctaTitle}</p>
              <p className="mt-1 text-sm text-ink-soft">{t.news.ctaText}</p>
              <Link href="/dat-lich" className={buttonStyles({ variant: "wall", className: "mt-4 w-full" })}>
                {t.common.bookViewing}
              </Link>
            </div>
          </aside>
        </div>
      </Container>

      {related.length ? (
        <section aria-labelledby="bai-lien-quan" className="border-t border-line bg-surface py-12">
          <Container>
            <h2 id="bai-lien-quan" className="text-title font-extrabold text-ink">
              {t.news.readNext}
            </h2>
            <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} lang={lang} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </article>
  );
}
