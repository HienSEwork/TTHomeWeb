import type { Metadata } from "next";
import { Profile } from "./profile";

export const metadata: Metadata = { title: "Tài khoản của tôi" };

export default function Page() {
  return <Profile />;
}
