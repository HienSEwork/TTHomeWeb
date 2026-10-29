import { DISTRICTS, LANDMARKS, PROJECTS, PROVINCE, projectAddress } from "@tthome/data";
import { normalizeVi } from "@tthome/ui";

export type Suggestion = { kind: "project" | "area" | "landmark"; label: string; detail: string; href: string };

const KIND_ORDER = { area: 0, landmark: 1, project: 2 } as const;

/** Suggestions while typing: wards and districts, landmarks, then projects. */
export function suggest(query: string, limit = 7): Suggestion[] {
  const needle = normalizeVi(query);
  if (needle.length < 2) return [];
  const words = needle.split(/\s+/);
  const hit = (text: string) => {
    const hay = normalizeVi(text);
    return words.every((w) => hay.includes(w));
  };

  const out: Suggestion[] = [];
  for (const d of DISTRICTS) {
    if (hit(d.name)) out.push({ kind: "area", label: d.name, detail: PROVINCE.name, href: `/phong-tro/${PROVINCE.slug}/${d.slug}` });
    for (const w of d.wards) {
      if (hit(`${w.name} ${d.name}`)) out.push({ kind: "area", label: w.name, detail: d.name, href: `/phong-tro/${PROVINCE.slug}/${d.slug}/${w.slug}` });
    }
  }
  for (const l of LANDMARKS) {
    if (hit(`${l.name} ${l.shortName}`)) out.push({ kind: "landmark", label: `Gần ${l.shortName}`, detail: l.name, href: `/tim-kiem?landmark=${l.slug}` });
  }
  for (const p of PROJECTS) {
    if (hit(`${p.name} ${projectAddress(p)}`)) out.push({ kind: "project", label: p.name, detail: projectAddress(p), href: `/du-an/${p.slug}` });
  }
  return out.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]).slice(0, limit);
}
