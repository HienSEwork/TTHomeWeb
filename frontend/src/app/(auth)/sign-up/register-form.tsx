"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Notice, OtpField, Tabs, TextButton } from "@/components/ui";
import { form, useSubmit } from "@/components/use-submit";
import { api } from "@/lib/api";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;
const PASSWORD_HINT = "Ít nhất 8 ký tự.";

export function RegisterForm() {
  const router = useRouter();
  const [mode, setMode] = useState("phone");
  const [contact, setContact] = useState<string>();
  const { busy, error, run } = useSubmit();
  const isPhone = mode === "phone";

  return (
    <div>
      <h1 className="rise text-4xl font-extrabold tracking-tight" style={rise(0)}>Tạo tài khoản</h1>
      <p className="rise mt-2 text-ink-soft" style={rise(1)}>
        Đã có tài khoản? <Link href="/dang-nhap" className="font-semibold text-gold-deep underline-offset-4 hover:underline">Đăng nhập</Link>
      </p>
      <div className="rise mt-8" style={rise(2)}>
        <Tabs options={[["phone", "Số điện thoại"], ["email", "Email"]]} value={mode} onChange={(m) => { setMode(m); setContact(undefined); }} />
      </div>

      {!contact ? (
        <form
          key={`${mode}-contact`}
          className="step-in mt-6 space-y-5"
          onSubmit={(e) => {
            const v = form(e);
            run(async () => {
              await (isPhone ? api("register/phone/request", { phone: v.contact }) : api("register/email", { email: v.contact }));
              setContact(v.contact);
            });
          }}
        >
          {isPhone ? (
            <Field label="Số điện thoại" name="contact" type="tel" autoComplete="tel" inputMode="tel" hint="Chúng tôi gửi mã xác nhận qua SMS hoặc Zalo." required />
          ) : (
            <Field label="Email" name="contact" type="email" autoComplete="email" hint="Chúng tôi gửi mã xác nhận tới email này." required />
          )}
          <Notice>{error}</Notice>
          <Button busy={busy}>Gửi mã xác nhận</Button>
        </form>
      ) : (
        <form
          key={`${mode}-verify`}
          className="step-in mt-6 space-y-5"
          onSubmit={(e) => {
            const v = form(e);
            const body = { code: v.code, fullName: v.fullName || undefined, password: v.password || undefined, rememberMe: true };
            run(async () => {
              await api(isPhone ? "register/phone/verify" : "register/email/verify", isPhone ? { phone: contact, ...body } : { email: contact, ...body });
              router.replace("/tai-khoan/ho-so");
            });
          }}
        >
          <p className="text-ink-soft">
            Mã đã gửi tới <strong className="text-ink">{contact}</strong>. <TextButton onClick={() => setContact(undefined)}>Đổi {isPhone ? "số" : "email"}</TextButton>
          </p>
          <OtpField name="code" autoFocus />
          <Field label="Họ tên" name="fullName" autoComplete="name" maxLength={100} />
          <Field
            label={isPhone ? "Mật khẩu (không bắt buộc)" : "Mật khẩu"}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required={!isPhone}
            hint={isPhone ? `${PASSWORD_HINT} Bỏ trống nếu chỉ muốn đăng nhập bằng mã OTP.` : PASSWORD_HINT}
          />
          <Notice>{error}</Notice>
          <Button busy={busy}>Hoàn tất đăng ký</Button>
        </form>
      )}
    </div>
  );
}
