import Image from "next/image";
import Link from "next/link";
import type { Post } from "@tthome/data";
import { getI18n, type Lang } from "@/lib/i18n";

/** Pass the post already in the visitor's language (see localPost). */
export function PostCard({ post, large, lang }: { post: Post; large?: boolean; lang?: Lang }) {
  const { t, fmt } = getI18n(lang);
  return (
    <article className="group relative flex flex-col">
      <div className={`relative overflow-hidden rounded-card bg-line ${large ? "aspect-[16/10]" : "aspect-[3/2]"}`}>
        <Image src={post.cover} alt="" fill sizes={large ? "(min-width: 1024px) 620px, 100vw" : "(min-width: 1024px) 400px, 100vw"} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <p className="mt-4 text-sm font-semibold text-shutter">{post.category.name}</p>
      <h3 className={`mt-1 font-bold text-ink ${large ? "text-2xl leading-tight tracking-tight" : "text-lg leading-snug"}`}>
        <Link href={`/tin-tuc/${post.slug}`} className="after:absolute after:inset-0 group-hover:underline">
          {post.title}
        </Link>
      </h3>
      {large ? <p className="mt-2 text-ink-soft">{post.excerpt}</p> : null}
      <p className="mt-2 text-sm text-muted">
        <time dateTime={post.publishedAt}>{fmt.date(post.publishedAt)}</time>, {t.news.readMinutes(post.readMinutes)}
      </p>
    </article>
  );
}
