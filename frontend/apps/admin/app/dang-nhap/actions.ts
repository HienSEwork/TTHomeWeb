"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkDemoCredentials } from "@tthome/data";
import { SESSION_COOKIE, cookieOptions } from "@/lib/session";

export type SignInState = { error: string | null; email: string };

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Nhập email công việc, ví dụ admin@tthome.demo", email };
  if (password.length < 8) return { error: "Mật khẩu có ít nhất 8 ký tự", email };

  const account = checkDemoCredentials("admin", email, password);
  if (!account) return { error: "Email hoặc mật khẩu không đúng. Dùng tài khoản demo ở bên trên.", email };

  (await cookies()).set(SESSION_COOKIE, account.email, cookieOptions());
  redirect("/");
}

export async function signOut(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/dang-nhap");
}
