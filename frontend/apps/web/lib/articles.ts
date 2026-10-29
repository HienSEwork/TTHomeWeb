import { POST_CATEGORIES, publishedPosts, type Post } from "@tthome/data";
import { slugify } from "@tthome/ui";

export function tagSlug(tag: string): string {
  return slugify(tag);
}

export function allTags(): { slug: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const p of publishedPosts()) for (const t of p.tags) seen.set(tagSlug(t), t);
  return [...seen].map(([slug, name]) => ({ slug, name }));
}

export function postsByCategory(slug: string): Post[] {
  return publishedPosts().filter((p) => p.category.slug === slug);
}

export function postsByTag(slug: string): Post[] {
  return publishedPosts().filter((p) => p.tags.some((t) => tagSlug(t) === slug));
}

export function findCategory(slug: string) {
  return POST_CATEGORIES.find((c) => c.slug === slug);
}

/** Same category first, then shared tags, then newest. */
export function relatedPosts(post: Post, limit = 3): Post[] {
  const score = (p: Post) => (p.category.slug === post.category.slug ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length;
  return publishedPosts()
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => score(b) - score(a) || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export function headingId(heading: string): string {
  return slugify(heading);
}
