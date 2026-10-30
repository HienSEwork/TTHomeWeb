import Link from "next/link";
import { POST_CATEGORIES, type Post } from "@tthome/data";
import { Container, EmptyState, buttonStyles, cn } from "@tthome/ui";
import { getI18n, type Lang } from "@/lib/i18n";
import { localCategory, localPost } from "@/lib/i18n/content";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { PostCard } from "./post-card";

/** Shared layout for /tin-tuc, its categories and tags. */
export function ArticleIndex({
  title,
  description,
  posts,
  crumbs,
  activeCategory,
  lang,
}: {
  title: string;
  description: string;
  /** Posts as stored; they are shown in `lang`. */
  posts: Post[];
  crumbs: Crumb[];
  activeCategory?: string;
  lang?: Lang;
}) {
  const { lang: l, t } = getI18n(lang);
  const [lead, ...rest] = posts.map((p) => localPost(p, l));
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={crumbs} lang={l} />
      <h1 className="mt-6 text-title font-extrabold text-ink">{title}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{description}</p>

      <nav aria-label={t.news.categories} className="scrollbar-none -mx-4 mt-6 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {[{ slug: "", name: t.news.all }, ...POST_CATEGORIES.map((c) => localCategory(c, l))].map((c) => {
            const active = (activeCategory ?? "") === c.slug;
            return (
              <li key={c.slug} className="shrink-0">
                <Link
                  href={c.slug ? `/tin-tuc/chuyen-muc/${c.slug}` : "/tin-tuc"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex rounded-full border px-3.5 py-1.5 text-sm font-medium",
                    active ? "border-selected-line bg-selected text-on-selected" : "border-line-strong bg-surface text-ink-soft hover:border-ink hover:text-ink",
                  )}
                >
                  {c.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {lead ? (
        <>
          <div className="mt-10 max-w-4xl">
            <PostCard post={lead} large lang={l} />
          </div>
          {rest.length ? (
            <div className="mt-14 grid gap-x-8 gap-y-12 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <PostCard key={p.slug} post={p} lang={l} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          className="mt-10"
          title={t.news.emptyTitle}
          description={t.news.emptyText}
          action={
            <Link href="/tin-tuc" className={buttonStyles({ variant: "secondary" })}>
              {t.news.allPosts}
            </Link>
          }
        />
      )}
    </Container>
  );
}
