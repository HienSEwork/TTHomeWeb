import Link from "next/link";
import { POST_CATEGORIES, type Post } from "@tthome/data";
import { Container, EmptyState, buttonStyles, cn } from "@tthome/ui";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { PostCard } from "./post-card";

/** Shared layout for /tin-tuc, its categories and tags. */
export function ArticleIndex({
  title,
  description,
  posts,
  crumbs,
  activeCategory,
}: {
  title: string;
  description: string;
  posts: Post[];
  crumbs: Crumb[];
  activeCategory?: string;
}) {
  const [lead, ...rest] = posts;
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-6 text-title font-extrabold text-ink">{title}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{description}</p>

      <nav aria-label="Chuyên mục" className="scrollbar-none -mx-4 mt-6 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {[{ slug: "", name: "Tất cả" }, ...POST_CATEGORIES].map((c) => {
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
            <PostCard post={lead} large />
          </div>
          {rest.length ? (
            <div className="mt-14 grid gap-x-8 gap-y-12 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          className="mt-10"
          title="Chưa có bài viết trong mục này"
          description="Các bài mới được đăng mỗi tuần. Trong lúc chờ, bạn có thể đọc các chuyên mục khác."
          action={
            <Link href="/tin-tuc" className={buttonStyles({ variant: "secondary" })}>
              Xem tất cả bài viết
            </Link>
          }
        />
      )}
    </Container>
  );
}
