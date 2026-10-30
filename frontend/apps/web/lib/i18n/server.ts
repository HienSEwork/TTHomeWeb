import { cookies } from "next/headers";
import { getI18n, LANG_COOKIE, resolveLang, type I18n, type Lang } from "./index";

/**
 * The visitor's language from the `lang` cookie, for server components, layouts and generateMetadata.
 * Reading cookies makes the route render per request, which is what lets one URL serve both languages.
 */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return resolveLang(store.get(LANG_COOKIE)?.value);
}

/** Dictionary and formatters for the current request. */
export async function getServerI18n(): Promise<I18n> {
  return getI18n(await getLang());
}
