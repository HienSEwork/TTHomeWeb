import { headingId } from "@/lib/articles";
import { getI18n, type Lang } from "@/lib/i18n";

type Section = { heading: string; paragraphs: string[] };

/** Table of contents for long text. */
export function ArticleToc({ sections, lang }: { sections: Section[]; lang?: Lang }) {
  const { t } = getI18n(lang);
  return (
    <nav aria-label={t.news.toc} className="rounded-card border border-line bg-surface p-5">
      <p className="text-sm font-bold text-ink">{t.news.inThisArticle}</p>
      <ol className="mt-3 space-y-2 text-sm">
        {sections.map((s) => (
          <li key={s.heading}>
            <a href={`#${headingId(s.heading)}`} className="text-ink-soft hover:text-plate hover:underline">
              {s.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Headings and paragraphs at a comfortable reading measure. */
export function ArticleBody({ sections }: { sections: Section[] }) {
  return (
    <div className="max-w-[68ch] text-[1.0625rem] leading-[1.75] text-ink-soft">
      {sections.map((s) => (
        <section key={s.heading} aria-labelledby={headingId(s.heading)} className="mt-10 first:mt-0">
          <h2 id={headingId(s.heading)} className="scroll-mt-24 text-2xl leading-tight font-extrabold tracking-tight text-ink">
            {s.heading}
          </h2>
          {s.paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="mt-4">
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
