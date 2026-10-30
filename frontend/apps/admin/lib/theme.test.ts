import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY, readStoredTheme, resolveTheme, storeTheme } from "./theme";

function stubSystemDark(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches, media: query, addEventListener: () => {}, removeEventListener: () => {} }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("resolveTheme", () => {
  it("uses the stored choice over the system preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system preference when nothing valid is stored", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("light");
    expect(resolveTheme("sepia", true)).toBe("dark");
  });
});

describe("theme storage", () => {
  it("round-trips a choice and ignores unknown values", () => {
    storeTheme("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(readStoredTheme()).toBe("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "blue");
    expect(readStoredTheme()).toBeNull();
  });

  it("survives blocked storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => storeTheme("dark")).not.toThrow();
    expect(readStoredTheme()).toBeNull();
  });
});

describe("THEME_INIT_SCRIPT", () => {
  const run = () => new Function(THEME_INIT_SCRIPT)();

  it("applies the stored choice before paint", () => {
    stubSystemDark(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("falls back to the system preference", () => {
    stubSystemDark(true);
    run();
    expect(document.documentElement.dataset.theme).toBe("dark");
    stubSystemDark(false);
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
