import { normalizeVi } from "@tthome/ui";

/** True when every word of the query appears in one of the fields, ignoring accents and case. */
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const words = normalizeVi(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = normalizeVi(fields.filter(Boolean).join(" "));
  return words.every((w) => hay.includes(w));
}

/** Count items per key, with every key present (zero when absent). */
export function countBy<T, K extends string>(items: T[], keys: readonly K[], keyOf: (item: T) => K): Record<K, number> {
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  for (const item of items) out[keyOf(item)] += 1;
  return out;
}

/** Group items by a day key (YYYY-MM-DD in Vietnam time), keeping input order inside each day. */
export function groupByDay<T>(items: T[], isoOf: (item: T) => string): { day: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const day = new Date(new Date(isoOf(item)).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
    map.set(day, [...(map.get(day) ?? []), item]);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, list]) => ({ day, items: list }));
}

/** Rows of a CSV file (Excel opens it). Values are quoted and quotes doubled. */
export function toCsv(rows: (string | number)[][]): string {
  return "﻿" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
