"use client";

import { useState, type FormEvent } from "react";
import { Button, SelectField, TextAreaField, TextField } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { validateContact, type ContactField, type ContactInput, type Errors } from "@/lib/validation";
import { FormErrorSummary, FormSuccess } from "./form-parts";

type Variant = "contact" | "ctv";

export function ContactForm({ variant = "contact" }: { variant?: Variant }) {
  const { lang, t } = useI18n();
  const copy = variant === "ctv" ? t.ctv : t.contact;
  const [input, setInput] = useState<ContactInput>({ name: "", phone: "", email: "", message: "" });
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<Errors<ContactField>>({});
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const requireMessage = variant === "contact";

  function set(key: ContactField, value: string) {
    const next = { ...input, [key]: value };
    setInput(next);
    if (tried) setErrors(validateContact(next, requireMessage, t.validation));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateContact(input, requireMessage, t.validation);
    setTried(true);
    setErrors(found);
    if (Object.keys(found).length === 0) setSent(true);
  }

  if (sent) {
    return (
      <FormSuccess
        title={copy.done}
        onReset={() => {
          setInput({ name: "", phone: "", email: "", message: "" });
          setTried(false);
          setSent(false);
        }}
        resetLabel={t.common.sendMore}
        lang={lang}
      >
        <p>{variant === "ctv" ? t.ctv.doneText(input.phone) : t.contact.doneText(input.phone, input.email)}</p>
      </FormSuccess>
    );
  }

  return (
    <form noValidate onSubmit={submit} aria-label={copy.submit} className="grid gap-4 rounded-card border border-line bg-surface p-5 sm:grid-cols-2 sm:p-8">
      <TextField label={t.common.name} autoComplete="name" value={input.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
      <TextField label={t.common.phone} type="tel" inputMode="tel" autoComplete="tel" value={input.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
      <TextField label={t.common.email} optional optionalLabel={t.common.optional} type="email" autoComplete="email" value={input.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
      {variant === "ctv" ? (
        <SelectField label={t.ctv.role} optional optionalLabel={t.common.optional} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">{t.common.choose}</option>
          {t.ctv.roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </SelectField>
      ) : null}
      <TextAreaField
        label={copy.message}
        optional={!requireMessage}
        optionalLabel={t.common.optional}
        placeholder={copy.placeholder}
        value={input.message}
        onChange={(e) => set("message", e.target.value)}
        error={errors.message}
        wrapperClassName="sm:col-span-2"
      />
      <FormErrorSummary count={Object.keys(errors).length} lang={lang} />
      <Button type="submit" size="lg" className="justify-self-start">
        {copy.submit}
      </Button>
    </form>
  );
}
