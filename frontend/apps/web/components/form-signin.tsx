"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { checkDemoCredentials, checkDemoPhone } from "@tthome/data";
import { Button, TextField, cn } from "@tthome/ui";
import { safeNext, startDemoSession } from "@/lib/demo-session";
import { isEmail, isOtp, isVnPhone, normalizePhone } from "@/lib/validation";

type Tab = "phone" | "email";
type EmailMode = "signin" | "register" | "forgot";

const RESEND_SECONDS = 60;

/** Opens the page the visitor wanted before signing in, or the profile. */
function useSignedIn() {
  const router = useRouter();
  return (email: string) => {
    startDemoSession(email);
    router.replace(safeNext(new URLSearchParams(window.location.search).get("next")));
    router.refresh();
  };
}

export function SignInForm() {
  const [tab, setTab] = useState<Tab>("email");
  return (
    <div className="rounded-card border border-line bg-surface p-5 sm:p-8">
      <div role="tablist" aria-label="Cách đăng nhập" className="grid grid-cols-2 gap-1 rounded-xl bg-wash p-1">
        <TabButton active={tab === "email"} onClick={() => setTab("email")} id="email">
          Email và mật khẩu
        </TabButton>
        <TabButton active={tab === "phone"} onClick={() => setTab("phone")} id="phone">
          Số điện thoại
        </TabButton>
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === "phone" ? <PhoneOtp /> : <EmailPassword />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, id, children }: { active: boolean; onClick: () => void; id: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={`panel-${id}`}
      onClick={onClick}
      className={cn("h-10 rounded-lg text-sm font-semibold transition-colors", active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}
    >
      {children}
    </button>
  );
}

function PhoneOtp() {
  const signedIn = useSignedIn();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  function sendCode(e?: FormEvent) {
    e?.preventDefault();
    if (!isVnPhone(phone)) {
      setError("Số điện thoại cần 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09");
      return;
    }
    setError(undefined);
    setStep("code");
    setWait(RESEND_SECONDS);
  }

  function verify(e: FormEvent) {
    e.preventDefault();
    if (!isOtp(code)) {
      setError("Mã gồm 6 chữ số trong tin nhắn Zalo hoặc SMS");
      return;
    }
    const account = checkDemoPhone(normalizePhone(phone), code);
    if (!account) {
      setError("Mã xác nhận không đúng hoặc số điện thoại chưa có tài khoản demo");
      return;
    }
    signedIn(account.email);
  }

  if (step === "phone") {
    return (
      <form noValidate onSubmit={sendCode} className="flex flex-col gap-4">
        <TextField label="Số điện thoại" type="tel" inputMode="tel" autoComplete="tel" placeholder="0903 456 512" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} />
        <Button type="submit" size="lg">
          Gửi mã xác nhận
        </Button>
        <p className="text-sm text-muted">Chưa có tài khoản? Nhập số điện thoại, tài khoản sẽ được tạo sau khi xác nhận mã.</p>
      </form>
    );
  }

  const shown = normalizePhone(phone);
  return (
    <form noValidate onSubmit={verify} className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">
        Mã 6 số đã gửi qua Zalo tới <strong className="tabular text-ink">{`${shown.slice(0, 4)} ${shown.slice(4, 7)} ${shown.slice(7)}`}</strong>. Không có Zalo, mã sẽ gửi bằng SMS.
      </p>
      <TextField
        label="Mã xác nhận"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        error={error}
        className="tabular text-center text-xl tracking-[0.5em]"
      />
      <Button type="submit" size="lg">
        Xác nhận và đăng nhập
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" className="font-semibold text-plate hover:underline" onClick={() => { setStep("phone"); setCode(""); setError(undefined); }}>
          Đổi số điện thoại
        </button>
        {wait > 0 ? (
          <span className="text-muted" aria-live="polite">
            Gửi lại mã sau {wait} giây
          </span>
        ) : (
          <button type="button" className="font-semibold text-plate hover:underline" onClick={() => sendCode()}>
            Gửi lại mã
          </button>
        )}
      </div>
    </form>
  );
}

function EmailPassword() {
  const signedIn = useSignedIn();
  const [mode, setMode] = useState<EmailMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [failure, setFailure] = useState<string>();
  const [sentReset, setSentReset] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!isEmail(email)) next.email = "Email chưa đúng định dạng";
    if (mode !== "forgot" && !password) next.password = "Nhập mật khẩu";
    setErrors(next);
    setFailure(undefined);
    if (next.email || next.password) return;
    if (mode === "forgot") return setSentReset(true);
    if (mode === "register") return setFailure("Bản demo không tạo tài khoản mới. Hãy đăng nhập bằng tài khoản demo ở bên dưới.");
    const account = checkDemoCredentials("user", email, password);
    if (!account) return setFailure("Email hoặc mật khẩu không đúng. Kiểm tra lại tài khoản demo ở bên dưới.");
    signedIn(account.email);
  }

  if (mode === "forgot" && sentReset) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="text-ink-soft">
          Nếu <strong className="text-ink">{email}</strong> đã đăng ký, bạn sẽ nhận được đường dẫn đặt lại mật khẩu trong vài phút. Đường dẫn có hiệu lực 30 phút.
        </p>
        <Button variant="secondary" onClick={() => { setMode("signin"); setSentReset(false); }}>
          Quay lại đăng nhập
        </Button>
      </div>
    );
  }

  const submitLabel = mode === "signin" ? "Đăng nhập" : mode === "register" ? "Tạo tài khoản" : "Gửi đường dẫn đặt lại";

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {mode === "forgot" ? <p className="text-sm text-ink-soft">Nhập email đã đăng ký, chúng tôi gửi đường dẫn để đặt mật khẩu mới.</p> : null}
      <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      {mode !== "forgot" ? (
        <TextField
          label="Mật khẩu"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={mode === "register" ? "Ít nhất 8 ký tự, có cả chữ và số" : undefined}
        />
      ) : null}
      {mode === "signin" ? (
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" defaultChecked className="size-4 accent-shutter" />
          Ghi nhớ đăng nhập trên thiết bị này
        </label>
      ) : null}
      {failure ? (
        <p role="alert" className="rounded-lg bg-danger-tint px-3 py-2 text-sm font-medium text-danger">
          {failure}
        </p>
      ) : null}
      <Button type="submit" size="lg">
        {submitLabel}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        {mode === "signin" ? (
          <>
            <button type="button" className="font-semibold text-plate hover:underline" onClick={() => setMode("forgot")}>
              Quên mật khẩu
            </button>
            <button type="button" className="font-semibold text-plate hover:underline" onClick={() => setMode("register")}>
              Tạo tài khoản mới
            </button>
          </>
        ) : (
          <button type="button" className="font-semibold text-plate hover:underline" onClick={() => setMode("signin")}>
            Đã có tài khoản? Đăng nhập
          </button>
        )}
      </div>
      {mode === "register" ? (
        <p className="text-xs text-muted">
          Khi tạo tài khoản, bạn đồng ý với{" "}
          <Link href="/chinh-sach/dieu-khoan-su-dung" className="underline">
            điều khoản sử dụng
          </Link>{" "}
          và{" "}
          <Link href="/chinh-sach/chinh-sach-bao-mat" className="underline">
            chính sách bảo mật
          </Link>
          .
        </p>
      ) : null}
    </form>
  );
}
