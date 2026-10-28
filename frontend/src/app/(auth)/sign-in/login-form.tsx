"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Field, Notice, OtpField, Tabs, TextButton } from "@/components/ui";
import { form, useSubmit } from "@/components/use-submit";
import { STAFF_ROLES } from "@/components/admin/nav";
import { api, Me } from "@/lib/api";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [mode, setMode] = useState("password");
  const [phone, setPhone] = useState<string>();
  const { busy, error, run } = useSubmit();

  const done = async () => {
    if (next?.startsWith("/") && !next.startsWith("//")) return router.replace(next);
    const me = await api<Me>("me").catch(() => undefined);
    router.replace(me?.roles?.some((r) => STAFF_ROLES.includes(r)) ? "/admin/dashboard" : "/tai-khoan/ho-so");
  };

  return (
    <div>
      <h1 className="rise text-4xl font-extrabold tracking-tight" style={rise(0)}>Đăng nhập</h1>
      <p className="rise mt-2 text-ink-soft" style={rise(1)}>
        Chưa có tài khoản? <Link href="/dang-ky" className="font-semibold text-gold-deep underline-offset-4 hover:underline">Đăng ký</Link>
      </p>
      {params.get("reset") && (
        <div className="mt-6"><Notice tone="ok">Đã đặt lại mật khẩu. Đăng nhập bằng mật khẩu mới nhé.</Notice></div>
      )}

      <div className="rise mt-8" style={rise(2)}>
        <Tabs options={[["password", "Mật khẩu"], ["otp", "Mã OTP"]]} value={mode} onChange={(m) => { setMode(m); setPhone(undefined); }} />
      </div>

      {mode === "password" ? (
        <form
          key="password"
          className="step-in mt-6 space-y-5"
          onSubmit={(e) => {
            const v = form(e);
            run(async () => {
              await api("login", { identifier: v.identifier, password: v.password, rememberMe: v.remember === "on" });
              await done();
            });
          }}
        >
          <Field label="Số điện thoại hoặc email" name="identifier" autoComplete="username" required />
          <Field label="Mật khẩu" name="password" type="password" autoComplete="current-password" required />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="remember" className="size-4 accent-gold-deep" /> Ghi nhớ đăng nhập
            </label>
            <Link href="/quen-mat-khau" className="font-semibold text-gold-deep underline-offset-4 hover:underline">Quên mật khẩu?</Link>
          </div>
          <Notice>{error}</Notice>
          <Button busy={busy}>Đăng nhập</Button>
        </form>
      ) : !phone ? (
        <form
          key="otp-phone"
          className="step-in mt-6 space-y-5"
          onSubmit={(e) => {
            const v = form(e);
            run(async () => {
              await api("login/otp/request", { phone: v.phone });
              setPhone(v.phone);
            });
          }}
        >
          <Field label="Số điện thoại" name="phone" type="tel" autoComplete="tel" inputMode="tel" required />
          <Notice>{error}</Notice>
          <Button busy={busy}>Gửi mã</Button>
        </form>
      ) : (
        <form
          key="otp-code"
          className="step-in mt-6 space-y-5"
          onSubmit={(e) => {
            const v = form(e);
            run(async () => {
              await api("login/otp/verify", { phone, code: v.code, rememberMe: v.remember === "on" });
              await done();
            });
          }}
        >
          <p className="text-ink-soft">
            Mã đã gửi tới <strong className="text-ink">{phone}</strong>. <TextButton onClick={() => setPhone(undefined)}>Đổi số</TextButton>
          </p>
          <OtpField name="code" autoFocus />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="remember" className="size-4 accent-gold-deep" /> Ghi nhớ đăng nhập
          </label>
          <Notice>{error}</Notice>
          <Button busy={busy}>Đăng nhập</Button>
        </form>
      )}
    </div>
  );
}
