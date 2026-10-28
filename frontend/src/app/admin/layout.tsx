import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

// Only checks that a session exists; the shell checks the role and the API authorises every call.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await cookies()).has("tt_rt")) redirect("/dang-nhap?next=/admin");
  return <AdminShell>{children}</AdminShell>;
}
