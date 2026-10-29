"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE, apiBaseUrl, cookieOptions, type TokenPair } from "@/lib/session";

export type SignInState = { error: string | null; email: string };

const MESSAGES: Record<number, string> = {
  401: "Email hoặc mật khẩu không đúng.",
  403: "Tài khoản đã bị khóa hoặc chưa kích hoạt. Liên hệ quản trị viên.",
  429: "Bạn thử sai quá nhiều lần. Đợi 15 phút rồi thử lại.",
};

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Nhập email công việc, ví dụ ten@tthome.vn", email };
  if (password.length < 8) return { error: "Mật khẩu có ít nhất 8 ký tự", email };

  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, password, rememberMe: form.get("remember") === "on" }),
      cache: "no-store",
    });
  } catch {
    return { error: "Không kết nối được máy chủ. Thử lại sau ít phút.", email };
  }
  if (!res.ok) return { error: MESSAGES[res.status] ?? "Đăng nhập không thành công. Thử lại sau.", email };

  const tokens = (await res.json()) as TokenPair;
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.accessExpiresAt));
  jar.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshExpiresAt));
  redirect("/");
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    // Best effort: the cookies are cleared either way, so a failed revoke never keeps the user signed in here.
    await fetch(`${apiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  jar.delete({ name: ACCESS_COOKIE, path: "/admin" });
  jar.delete({ name: REFRESH_COOKIE, path: "/admin" });
  redirect("/dang-nhap");
}
