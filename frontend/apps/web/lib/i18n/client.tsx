"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LANG, getI18n, langCookie, type I18n, type Lang } from "./index";

const LangContext = createContext<Lang>(DEFAULT_LANG);

/** Hands the language the server rendered with to every client component below it. */
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** Dictionary and formatters for client components. Outside a provider (tests) it speaks Vietnamese. */
export function useI18n(): I18n {
  const lang = useLang();
  return useMemo(() => getI18n(lang), [lang]);
}

/** Saves the choice for the whole site; the caller refreshes the route so the server renders in the new language. */
export function saveLang(lang: Lang): void {
  document.cookie = langCookie(lang);
  document.documentElement.lang = lang;
}
