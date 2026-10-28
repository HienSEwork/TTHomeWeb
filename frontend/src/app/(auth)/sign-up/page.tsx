import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function Page() {
  return <RegisterForm />;
}
