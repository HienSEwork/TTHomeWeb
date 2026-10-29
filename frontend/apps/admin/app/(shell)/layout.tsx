import { Shell } from "@/components/shell";
import { api, optional } from "@/lib/api";

type Me = { id: string; email: string | null; phone: string | null; fullName: string | null };

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const me = await optional(api<Me>("/auth/me"));
  const user = { name: me?.fullName || me?.email || me?.phone || "Quản trị viên", email: me?.email ?? null };
  return <Shell user={user}>{children}</Shell>;
}
