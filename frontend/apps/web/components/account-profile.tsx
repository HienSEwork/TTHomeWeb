"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { CITIES } from "@tthome/data";
import { Button, Card, SelectField, TextField } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { isEmail, isVnPhone, passwordProblem } from "@/lib/validation";
import { CURRENT_USER } from "@/lib/account";

function Saved({ show, children }: { show: boolean; children: ReactNode }) {
  return show ? (
    <p role="status" className="text-sm font-semibold text-shutter">
      {children}
    </p>
  ) : null;
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card as="section" className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

const BUDGETS = ["under-2.5", "2.5-3.5", "3.5-5", "over-5"] as const;

export function ProfileForm() {
  const { t } = useI18n();
  const [name, setName] = useState(CURRENT_USER.name);
  const [email, setEmail] = useState(CURRENT_USER.email);
  const [area, setArea] = useState(CURRENT_USER.wantedArea);
  const [budget, setBudget] = useState(CURRENT_USER.budget);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const problem = !isEmail(email) ? t.validation.email : undefined;
    setError(problem);
    setSaved(!problem);
  }

  return (
    <Panel title={t.account.personal} description={t.account.personalText}>
      <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <TextField label={t.common.name} value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
        <TextField label={t.common.email} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} error={error} />
        <SelectField label={t.account.wantedArea} value={area} onChange={(e) => { setArea(e.target.value); setSaved(false); }}>
        {CITIES.map((c) => (
            <optgroup key={c.slug} label={c.name}>
              <option value={c.slug}>{t.hero.anyWard(c.name)}</option>
              {c.wards.map((w) => (
                <option key={w.slug} value={`${c.slug}/${w.slug}`}>
                  {w.name}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <SelectField label={t.account.budget} value={budget} onChange={(e) => { setBudget(e.target.value); setSaved(false); }}>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              {t.booking.budgets[b]}
            </option>
          ))}
        </SelectField>
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit">{t.account.saveChanges}</Button>
          <Saved show={saved}>{t.account.changesSaved}</Saved>
        </div>
      </form>
    </Panel>
  );
}

export function ChangePhoneForm() {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  return (
    <Panel title={t.account.changePhone} description={t.account.changePhoneText(CURRENT_USER.phone)}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const ok = isVnPhone(phone);
          setError(ok ? undefined : t.validation.phoneInvalid);
          setSent(ok);
        }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start"
      >
        <TextField label={t.account.newPhone} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} wrapperClassName="sm:w-72" />
        <Button type="submit" variant="secondary" className="sm:mt-7">
          {t.account.sendCode}
        </Button>
      </form>
      <div className="mt-3">
        <Saved show={sent}>{t.account.codeSent(phone)}</Saved>
      </div>
    </Panel>
  );
}

export function ChangePasswordForm() {
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [saved, setSaved] = useState(false);
  return (
    <Panel title={t.account.changePassword}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const found = { current: current ? undefined : t.account.currentPasswordMissing, next: passwordProblem(next, t.validation) };
          setErrors(found);
          setSaved(!found.current && !found.next);
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <TextField label={t.account.currentPassword} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
        <TextField label={t.account.newPassword} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} hint={t.signIn.passwordHint} />
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit" variant="secondary">
            {t.account.changePassword}
          </Button>
          <Saved show={saved}>{t.account.passwordChanged}</Saved>
        </div>
      </form>
    </Panel>
  );
}

export function DeleteAccount() {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [requested, setRequested] = useState(false);
  if (requested) {
    return (
      <Panel title={t.account.deleteTitle}>
        <p role="status" className="text-ink-soft">
          {t.account.deleteDone}
        </p>
      </Panel>
    );
  }
  return (
    <Panel title={t.account.deleteTitle} description={t.account.deleteText}>
      {confirming ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextField label={t.account.deleteConfirm} value={typed} onChange={(e) => setTyped(e.target.value)} wrapperClassName="sm:w-60" />
          <Button variant="danger" disabled={typed.trim().toUpperCase() !== t.account.deleteWord} onClick={() => setRequested(true)}>
            {t.account.deleteTitle}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            {t.account.keep}
          </Button>
        </div>
      ) : (
        <Button variant="secondary" className="text-danger" onClick={() => setConfirming(true)}>
          {t.account.deleteTitle}
        </Button>
      )}
    </Panel>
  );
}
