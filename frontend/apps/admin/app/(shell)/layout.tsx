import { DEMO_ACCOUNTS } from "@tthome/data";
import { Shell } from "@/components/shell";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const { name, email } = DEMO_ACCOUNTS.admin;
  return <Shell user={{ name, email }}>{children}</Shell>;
}
