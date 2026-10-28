"use client";

import { useMemo } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { shortId } from "./format";
import type { Option, Page } from "./types";

type Person = { id: string; fullName: string | null; email: string | null; phone: string | null };

const personName = (p: Person) => p.fullName || p.email || p.phone || shortId(p.id);

// shortcut: one page of 100 per role, enough for a small team; add search when the team grows past it.
export function useStaff() {
  const admins = useAdminQuery<Page<Person>>("users?role=ADMIN&size=100");
  const consultants = useAdminQuery<Page<Person>>("users?role=CONSULTANT&size=100");
  return useMemo(() => {
    const byId = new Map<string, string>();
    for (const p of [...(admins.data?.items ?? []), ...(consultants.data?.items ?? [])]) byId.set(p.id, personName(p));
    const options: Option[] = [...byId].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "vi"));
    return { options, nameOf: (id?: string | null) => (id ? (byId.get(id) ?? shortId(id)) : "—") };
  }, [admins.data, consultants.data]);
}

// shortcut: first 100 projects fill the filter and the name lookup; page through when there are more.
export function useProjects() {
  const projects = useAdminQuery<Page<{ id: string; name: string }>>("projects?size=100");
  return useMemo(() => {
    const options: Option[] = (projects.data?.items ?? []).map((p) => ({ value: p.id, label: p.name }));
    return { options, nameOf: (id?: string | null) => options.find((o) => o.value === id)?.label ?? (id ? shortId(id) : "—") };
  }, [projects.data]);
}
