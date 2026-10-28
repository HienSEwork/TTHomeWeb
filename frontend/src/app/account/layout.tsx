import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Only checks that a session exists; the API still authorises every call.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!(await cookies()).has("tt_rt")) redirect("/dang-nhap?next=/tai-khoan/ho-so");
  return children;
}
