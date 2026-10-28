import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function Page() {
  return <ForgotForm />;
}
