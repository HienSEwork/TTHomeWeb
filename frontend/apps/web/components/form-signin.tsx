"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { checkDemoCredentials, checkDemoPhone } from "@tthome/data";
import { Button, TextField, cn } from "@tthome/ui";
import { safeNext, startDemoSession } from "@/lib/demo-session";
import { useI18n } from "@/lib/i18n/client";
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
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("email");
  return (
    <div className="rounded-card border border-line bg-surface p-5 sm:p-8">
      <div role="tablist" aria-label={t.signIn.methods} className="grid grid-cols-2 gap-1 rounded-xl bg-wash p-1">
        <TabButton active={tab === "email"} onClick={() => setTab("email")} id="email">
          {t.signIn.tabEmail}
        </TabButton>
        <TabButton active={tab === "phone"} onClick={() => setTab("phone")} id="phone">
          {t.signIn.tabPhone}
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
  const { t } = useI18n();
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
      setError(t.validation.phoneInvalid);
      return;
    }
    setError(undefined);
    setStep("code");
    setWait(RESEND_SECONDS);
  }

  function verify(e: FormEvent) {
    e.preventDefault();
    if (!isOtp(code)) {
      setError(t.signIn.errors.code);
      return;
    }
    const account = checkDemoPhone(normalizePhone(phone), code);
    if (!account) {
      setError(t.signIn.errors.wrongCode);
      return;
    }
    signedIn(account.email);
  }

  if (step === "phone") {
    return (
      <form noValidate onSubmit={sendCode} className="flex flex-col gap-4">
        <TextField label={t.common.phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="0903 456 512" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} />
        <Button type="submit" size="lg">
          {t.signIn.sendCode}
        </Button>
        <p className="text-sm text-muted">{t.signIn.noAccount}</p>
      </form>
    );
  }

  const shown = normalizePhone(phone);
  return (
    <form noValidate onSubmit={verify} className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">
        {t.signIn.codeSentBefore} <strong className="tabular text-ink">{`${shown.slice(0, 4)} ${shown.slice(4, 7)} ${shown.slice(7)}`}</strong>
        {t.signIn.codeSentAfter}
      </p>
      <TextField
        label={t.signIn.code}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        error={error}
        className="tabular text-center text-xl tracking-[0.5em]"
      />
      <Button type="submit" size="lg">
        {t.signIn.verify}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" className="font-semibold text-plate hover:underline" onClick={() => { setStep("phone"); setCode(""); setError(undefined); }}>
          {t.signIn.changePhone}
        </button>
        {wait > 0 ? (
          <span className="text-muted" aria-live="polite">
            {t.signIn.resendIn(wait)}
          </span>
        ) : (
          <button type="button" className="font-semibold text-plate hover:underline" onClick={() => sendCode()}>
            {t.signIn.resend}
          </button>
        )}
      </div>
    </form>
  );
}

function EmailPassword() {
  const { t } = useI18n();
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
    if (!isEmail(email)) next.email = t.validation.email;
    if (mode !== "forgot" && !password) next.password = t.signIn.errors.password;
    setErrors(next);
    setFailure(undefined);
    if (next.email || next.password) return;
    if (mode === "forgot") return setSentReset(true);
    if (mode === "register") return setFailure(t.signIn.errors.noRegister);
    const account = checkDemoCredentials("user", email, password);
    if (!account) return setFailure(t.signIn.errors.wrongPassword);
    signedIn(account.email);
  }

  if (mode === "forgot" && sentReset) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="text-ink-soft">{t.signIn.resetSent(email)}</p>
        <Button variant="secondary" onClick={() => { setMode("signin"); setSentReset(false); }}>
          {t.signIn.backToSignIn}
        </Button>
      </div>
    );
  }

  const submitLabel = mode === "signin" ? t.signIn.submitSignIn : mode === "register" ? t.signIn.submitRegister : t.signIn.submitForgot;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {mode === "forgot" ? <p className="text-sm text-ink-soft">{t.signIn.forgotText}</p> : null}
      <TextField label={t.common.email} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      {mode !== "forgot" ? (
        <TextField
          label={t.signIn.password}
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={mode === "register" ? t.signIn.passwordHint : undefined}
        />
      ) : null}
      {mode === "signin" ? (
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" defaultChecked className="size-4 accent-shutter" />
          {t.signIn.remember}
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
              {t.signIn.forgot}
            </button>
            <button type="button" className="font-semibold text-plate hover:underline" onClick={() => setMode("register")}>
              {t.signIn.register}
            </button>
          </>
        ) : (
          <button type="button" className="font-semibold text-plate hover:underline" onClick={() => setMode("signin")}>
            {t.signIn.haveAccount}
          </button>
        )}
      </div>
      {mode === "register" ? (
        <p className="text-xs text-muted">
          {t.signIn.termsBefore}{" "}
          <Link href="/chinh-sach/dieu-khoan-su-dung" className="underline">
            {t.signIn.terms}
          </Link>{" "}
          {t.signIn.and}{" "}
          <Link href="/chinh-sach/chinh-sach-bao-mat" className="underline">
            {t.common.privacyPolicy}
          </Link>
          .
        </p>
      ) : null}
    </form>
  );
}
