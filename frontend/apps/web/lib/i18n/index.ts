import { en } from "./en";
import { createFormatter, type Formatter } from "./format";
import { vi, type Dictionary } from "./vi";

export type { Dictionary } from "./vi";
export type { Formatter } from "./format";

/** The languages the public site speaks. Vietnamese is the default for every visitor without a choice saved. */
export const LANGS = ["vi", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "vi";

/** Cookie that remembers the visitor's language for a year. */
export const LANG_COOKIE = "lang";
const LANG_MAX_AGE = 60 * 60 * 24 * 365;

const DICTIONARIES: Record<Lang, Dictionary> = { vi, en };

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** Any cookie value to a supported language: unknown, empty or missing values fall back to Vietnamese. */
export function resolveLang(value: string | null | undefined): Lang {
  const v = value?.trim().toLowerCase();
  return isLang(v) ? v : DEFAULT_LANG;
}

/** Reads the language from a raw `Cookie` header or `document.cookie` string. */
export function langFromCookieHeader(header: string | null | undefined): Lang {
  const pair = (header ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${LANG_COOKIE}=`));
  return resolveLang(pair?.slice(LANG_COOKIE.length + 1));
}

/** The `document.cookie` assignment that saves a language choice for the whole site. */
export function langCookie(lang: Lang): string {
  return `${LANG_COOKIE}=${lang}; path=/; max-age=${LANG_MAX_AGE}; samesite=lax`;
}

export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

export type I18n = { lang: Lang; t: Dictionary; fmt: Formatter };

const formatters: Partial<Record<Lang, Formatter>> = {};

/** Dictionary and number/date formatting for one language. Pure, so it works on the server and in the browser. */
export function getI18n(lang: Lang = DEFAULT_LANG): I18n {
  const fmt = (formatters[lang] ??= createFormatter(lang));
  return { lang, t: DICTIONARIES[lang], fmt };
}

/** BCP 47 tag for `Intl` and the `<html lang>` attribute. */
export const LOCALE: Record<Lang, string> = { vi: "vi-VN", en: "en-GB" };
/** Open Graph locale. */
export const OG_LOCALE: Record<Lang, string> = { vi: "vi_VN", en: "en_GB" };

/** Looks up a label by a code that may be outside the known set (amenity codes, price band slugs), falling back to the code. */
export function labelOf(map: object, key: string): string {
  return (map as Record<string, string>)[key] ?? key;
}
