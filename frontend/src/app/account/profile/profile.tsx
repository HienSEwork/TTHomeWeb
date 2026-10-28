"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/building";
import { Button, Field, Notice, OtpField, Tabs } from "@/components/ui";
import { form, useSubmit } from "@/components/use-submit";
import { api, ApiError, Me } from "@/lib/api";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;
const ROLES: Record<string, string> = {
  TENANT: "Khách thuê",
  LANDLORD: "Chủ nhà",
  AGENT: "Môi giới / CTV",
  CONSULTANT: "Nhân viên tư vấn",
  ADMIN: "Quản trị viên",
};

export function Profile() {
  const router = useRouter();
  const [me, setMe] = useState<Me>();

  useEffect(() => {
    api<Me>("me").then(setMe).catch((e) => {
      if (e instanceof ApiError && e.status === 401) router.replace("/dang-nhap?next=/tai-khoan/ho-so");
    });
  }, [router]);

  const leave = async (all: boolean) => {
    // "logout" always runs last: it is the call that clears this browser's cookies.
    if (all) await api("logout-all").catch(() => undefined);
    await api("logout").catch(() => undefined);
    router.replace("/dang-nhap");
  };

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Wordmark />
        <button type="button" onClick={() => leave(false)} className="text-sm font-semibold text-gold-deep underline-offset-4 hover:underline">
          Đăng xuất
        </button>
      </div>

      <header className="rise mt-12" style={rise(0)}>
        <h1 className="text-4xl font-extrabold tracking-tight">{me ? me.fullName || "Tài khoản của tôi" : " "}</h1>
        <dl className="mt-4 grid gap-x-10 gap-y-2 text-ink-soft sm:grid-cols-[auto_1fr]">
          <dt>Số điện thoại</dt><dd className="text-ink">{me?.phone ?? "—"}</dd>
          <dt>Email</dt><dd className="text-ink">{me?.email ?? "—"}</dd>
          <dt>Vai trò</dt><dd className="text-ink">{me?.roles.map((r) => ROLES[r] ?? r).join(", ") || "—"}</dd>
        </dl>
      </header>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <section className="rise" style={rise(2)} aria-labelledby="pw">
          <h2 id="pw" className="text-xl font-bold">Đổi mật khẩu</h2>
          <PasswordForm />
        </section>
        <section className="rise" style={rise(3)} aria-labelledby="ct">
          <h2 id="ct" className="text-xl font-bold">Đổi số điện thoại hoặc email</h2>
          <ContactForm onChanged={() => api<Me>("me").then(setMe)} />
        </section>
      </div>

      <section className="rise mt-12 rounded-2xl bg-cream p-6" style={rise(4)} aria-labelledby="ses">
        <h2 id="ses" className="text-xl font-bold">Phiên đăng nhập</h2>
        <p className="mt-1 text-ink-soft">Dùng khi bạn nghi ngờ tài khoản bị người khác truy cập.</p>
        <div className="mt-4 max-w-xs">
          <Button type="button" onClick={() => leave(true)}>Đăng xuất mọi thiết bị</Button>
        </div>
      </section>
    </div>
  );
}

function PasswordForm() {
  const { busy, error, run } = useSubmit();
  const [done, setDone] = useState(false);
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        const v = form(e);
        const el = e.currentTarget;
        run(async () => {
          await api("password/change", { currentPassword: v.currentPassword, newPassword: v.newPassword });
          el.reset();
          setDone(true);
        });
      }}
    >
      <Field label="Mật khẩu hiện tại" name="currentPassword" type="password" autoComplete="current-password" required />
      <Field label="Mật khẩu mới" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} hint="Ít nhất 8 ký tự." required />
      <Notice>{error}</Notice>
      <Notice tone="ok">{done && !error ? "Đã đổi mật khẩu." : undefined}</Notice>
      <Button busy={busy}>Lưu mật khẩu</Button>
    </form>
  );
}

function ContactForm({ onChanged }: { onChanged: () => void }) {
  const { busy, error, run } = useSubmit();
  const [type, setType] = useState("PHONE");
  const [pending, setPending] = useState<string>();
  const [done, setDone] = useState(false);
  const isPhone = type === "PHONE";
  return (
    <div className="mt-4">
      <Tabs options={[["PHONE", "Số điện thoại"], ["EMAIL", "Email"]]} value={type} onChange={(t) => { setType(t); setPending(undefined); setDone(false); }} />
      {!pending ? (
        <form
          key="ask"
          className="step-in mt-4 space-y-4"
          onSubmit={(e) => {
            const v = form(e);
            run(async () => {
              await api("contact/change/request", { type, newValue: v.newValue, currentPassword: v.currentPassword || undefined });
              setDone(false);
              setPending(v.newValue);
            });
          }}
        >
          <Field label={isPhone ? "Số điện thoại mới" : "Email mới"} name="newValue" type={isPhone ? "tel" : "email"} required />
          <Field label="Mật khẩu hiện tại" name="currentPassword" type="password" autoComplete="current-password" hint="Bỏ trống nếu tài khoản chưa đặt mật khẩu." />
          <Notice>{error}</Notice>
          <Notice tone="ok">{done ? "Đã cập nhật." : undefined}</Notice>
          <Button busy={busy}>Gửi mã xác nhận</Button>
        </form>
      ) : (
        <form
          key="confirm"
          className="step-in mt-4 space-y-4"
          onSubmit={(e) => {
            const v = form(e);
            run(async () => {
              await api("contact/change/confirm", { type, newValue: pending, code: v.code });
              setPending(undefined);
              setDone(true);
              onChanged();
            });
          }}
        >
          <p className="text-ink-soft">Mã đã gửi tới <strong className="text-ink">{pending}</strong>.</p>
          <OtpField name="code" autoFocus />
          <Notice>{error}</Notice>
          <Button busy={busy}>Xác nhận</Button>
        </form>
      )}
    </div>
  );
}
