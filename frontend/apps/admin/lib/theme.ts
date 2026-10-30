export type Theme = "light" | "dark";

/** Where the admin remembers the theme a person picked. No entry means: follow the system setting. */
export const THEME_STORAGE_KEY = "tthome-admin-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** A stored choice wins; otherwise the system preference decides. */
export function resolveTheme(stored: string | null | undefined, prefersDark: boolean): Theme {
  if (isTheme(stored)) return stored;
  return prefersDark ? "dark" : "light";
}

/** The stored choice, or null when there is none or storage is blocked (private mode, disabled cookies). */
export function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage is blocked: the theme still applies for this page view.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(DARK_QUERY).matches;
}

/** Calls back when the system preference changes; returns the unsubscribe function. */
export function onSystemThemeChange(callback: (prefersDark: boolean) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(DARK_QUERY);
  const listener = (e: MediaQueryListEvent) => callback(e.matches);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/** The theme currently on <html>, or null before the init script has run (server render). */
export function currentTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : null;
}

/**
 * Runs in <head> before the first paint so the page never flashes the wrong theme. Same rule as resolveTheme,
 * kept tiny and dependency-free because it is inlined as a string.
 */
export const THEME_INIT_SCRIPT = `(function(){var t=null;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia(${JSON.stringify(DARK_QUERY)}).matches?"dark":"light"}document.documentElement.dataset.theme=t})();`;
