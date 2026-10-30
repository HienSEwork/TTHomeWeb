import { describe, expect, it } from "vitest";
import { FAQS, POLICIES, PROJECTS, publishedPosts } from "@tthome/data";
import { localFaq, localPolicy, localPost, localRoomName, projectCopy } from "./content";
import { en } from "./en";
import { DEFAULT_LANG, getDictionary, getI18n, langCookie, langFromCookieHeader, LANG_COOKIE, resolveLang } from "./index";
import { vi } from "./vi";

type Leaf = { path: string; value: unknown };

/** Every leaf of a dictionary with its dotted path; arrays count as leaves of their own. */
function leaves(node: unknown, path = ""): Leaf[] {
  if (node && typeof node === "object" && !Array.isArray(node)) {
    return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [{ path, value: node }];
}

/** Calls a dictionary function with a sample value for every parameter; "3" works as text and as a count. */
function sample(fn: (...args: never[]) => unknown): unknown {
  return (fn as (...a: unknown[]) => unknown)(...Array.from({ length: fn.length }, () => "3"));
}

describe("dictionaries", () => {
  const viLeaves = leaves(vi);
  const enLeaves = leaves(en);

  it("have exactly the same keys in both languages", () => {
    expect(enLeaves.map((l) => l.path).sort()).toEqual(viLeaves.map((l) => l.path).sort());
  });

  it("pair strings with strings, lists with equally long lists and functions with functions of the same arity", () => {
    const byPath = new Map(enLeaves.map((l) => [l.path, l.value]));
    for (const { path, value } of viLeaves) {
      const other = byPath.get(path);
      expect(typeof other, path).toBe(typeof value);
      if (Array.isArray(value)) expect((other as unknown[]).length, path).toBe(value.length);
      if (typeof value === "function") expect((other as () => unknown).length, path).toBe(value.length);
    }
  });

  it("contain no empty or blank text, including what the functions return", () => {
    for (const dict of [vi, en]) {
      for (const { path, value } of leaves(dict)) {
        const texts = Array.isArray(value) ? value : typeof value === "function" ? [sample(value as (...args: never[]) => unknown)] : [value];
        for (const text of texts) {
          expect(typeof text, path).toBe("string");
          expect((text as string).trim(), path).not.toBe("");
        }
      }
    }
  });

  it("keep English free of Vietnamese UI words", () => {
    const vietnamese = /\b(phòng|giá|tháng|đặt|xem|trống|khu vực)\b/i;
    for (const { path, value } of enLeaves) {
      if (typeof value === "string" && path !== "lang.vi") expect(value, path).not.toMatch(vietnamese);
    }
  });
});

describe("language resolution", () => {
  it("defaults to Vietnamese", () => {
    expect(DEFAULT_LANG).toBe("vi");
    expect(resolveLang(undefined)).toBe("vi");
    expect(resolveLang(null)).toBe("vi");
    expect(resolveLang("")).toBe("vi");
  });

  it("accepts the supported languages, ignoring case and spaces", () => {
    expect(resolveLang("en")).toBe("en");
    expect(resolveLang(" EN ")).toBe("en");
    expect(resolveLang("vi")).toBe("vi");
  });

  it("falls back to Vietnamese for anything else", () => {
    expect(resolveLang("fr")).toBe("vi");
    expect(resolveLang("en-US")).toBe("vi");
    expect(resolveLang("<script>")).toBe("vi");
  });

  it("reads the lang cookie out of a cookie header", () => {
    expect(langFromCookieHeader("tthome_demo_user=a%40b.vn; lang=en; other=1")).toBe("en");
    expect(langFromCookieHeader("lang=de")).toBe("vi");
    expect(langFromCookieHeader("language=en")).toBe("vi");
    expect(langFromCookieHeader("")).toBe("vi");
    expect(langFromCookieHeader(undefined)).toBe("vi");
  });

  it("writes a site-wide cookie that reads back as the same language", () => {
    const cookie = langCookie("en");
    expect(cookie).toMatch(new RegExp(`^${LANG_COOKIE}=en;`));
    expect(cookie).toContain("path=/");
    expect(cookie).toMatch(/max-age=\d+/);
    expect(langFromCookieHeader(cookie.split(";")[0])).toBe("en");
  });

  it("hands out the matching dictionary", () => {
    expect(getDictionary("vi")).toBe(vi);
    expect(getDictionary("en")).toBe(en);
    expect(getI18n().lang).toBe("vi");
    expect(getI18n("en").t).toBe(en);
  });
});

describe("formatting", () => {
  it("keeps the Vietnamese formats the site always used", () => {
    const { fmt } = getI18n("vi");
    expect(fmt.priceShort(3_500_000)).toBe("3,5 triệu");
    expect(fmt.fromPrice(3_500_000)).toBe("Từ 3,5 triệu");
    expect(fmt.fromPrice(null)).toBe("Liên hệ");
    expect(fmt.priceParts(3_500_000)).toEqual({ value: "3,5", unit: "triệu/tháng" });
    expect(fmt.mapPrice(3_500_000)).toBe("3,5tr");
    expect(fmt.date("2026-11-03")).toBe("03/11/2026");
    expect(fmt.dayMonth("2026-11-03")).toBe("03/11");
  });

  it("prints English prices in millions of VND and dates with month names", () => {
    const { fmt } = getI18n("en");
    expect(fmt.priceShort(3_500_000)).toBe("3.5M VND");
    expect(fmt.priceShort(850_000)).toBe("850K VND");
    expect(fmt.fromPrice(3_500_000)).toBe("From 3.5M VND");
    expect(fmt.fromPrice(0)).toBe("Contact us");
    expect(fmt.priceParts(12_000_000)).toEqual({ value: "12", unit: "M VND/month" });
    expect(fmt.mapPrice(3_500_000)).toBe("3.5M");
    expect(fmt.vnd(3_500_000)).toBe("3,500,000 VND");
    expect(fmt.date("2026-11-03")).toBe("3 Nov 2026");
    expect(fmt.shortDay("2026-10-30")).toBe("30 Oct");
    expect(fmt.weekday("2026-10-30")).toBe("Fri");
  });
});

describe("mock content", () => {
  it("has English for every published article, FAQ and policy, and leaves Vietnamese untouched", () => {
    for (const post of publishedPosts()) {
      expect(localPost(post, "vi")).toBe(post);
      const english = localPost(post, "en");
      expect(english.slug).toBe(post.slug);
      expect(english.title).not.toBe(post.title);
      expect(english.sections).toHaveLength(post.sections.length);
      expect(english.category.name).not.toBe(post.category.name);
    }
    for (const faq of FAQS) expect(localFaq(faq, "en").question).not.toBe(faq.question);
    for (const policy of POLICIES) expect(localPolicy(policy, "en").title).not.toBe(policy.title);
  });

  it("translates building blurbs, offers and house rules but keeps names", () => {
    for (const project of PROJECTS) {
      const copy = projectCopy(project, "en");
      expect(copy.description).not.toBe(project.description);
      expect(copy.promo === null).toBe(project.promo === null);
      if (project.promo) expect(copy.promo).not.toBe(project.promo);
      expect(copy.rules.every((r, i) => r !== project.rules[i])).toBe(true);
    }
    expect(projectCopy(PROJECTS[0]!, "vi").description).toBe(PROJECTS[0]!.description);
    expect(localRoomName("Phòng 302", "en")).toBe("Room 302");
    expect(localRoomName("Phòng 302", "vi")).toBe("Phòng 302");
  });
});
