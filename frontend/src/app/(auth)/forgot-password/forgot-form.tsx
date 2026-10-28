"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Notice, OtpField, TextButton } from "@/components/ui";
import { form, useSubmit } from "@/components/use-submit";
import { api } from "@/lib/api";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function ForgotForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState<string>();
  const { busy, error, run } = useSubmit();

  return (
    <div>
      <h1 className="rise text-4xl font-extrabold tracking-tight" style={rise(0)}>Đặt lại mật khẩu</h1>
      <p className="rise mt-2 text-ink-soft" style={rise(1)}>
        Nhớ ra rồi? <Link href="/dang-nhap" className="font-semibold text-gold-deep underline-offset-4 hover:underline">Đăng nhập</Link>
      </p>
      {!identifier ? (
        <form
          key="ask"
          className="step-in mt-8 space-y-5"
          onSubmit={(e) => {
            const v = form(e);
            run(async () => {
              await api("password/forgot", { identifier: v.identifier });
              setIdentifier(v.identifier);
            });
          }}
        >
          <Field label="Số điện thoại hoặc email" name="identifier" autoComplete="username" hint="Nếu tài khoản tồn tại, chúng tôi sẽ gửi mã xác nhận." required />
          <Notice>{error}</Notice>
          <Button busy={busy}>Gửi mã</Button>
        </form>
      ) : (
        <form
          key="reset"
          className="step-in mt-8 space-y-5"
          onSubmit={(e) => {
            const v = form(e);
            run(async () => {
              await api("password/reset", { identifier, code: v.code, newPassword: v.newPassword });
              router.replace("/dang-nhap?reset=1");
            });
          }}
        >
          <p className="text-ink-soft">
            Mã đã gửi tới <strong className="text-ink">{identifier}</strong>. <TextButton onClick={() => setIdentifier(undefined)}>Đổi</TextButton>
          </p>
          <OtpField name="code" autoFocus />
          <Field label="Mật khẩu mới" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} hint="Ít nhất 8 ký tự." required />
          <Notice>{error}</Notice>
          <Button busy={busy}>Đặt lại mật khẩu</Button>
        </form>
      )}
    </div>
  );
}
