import type { Metadata } from "next";
import { Container } from "@tthome/ui";
import { BrandLogo } from "@/components/brand-logo";
import { SignInForm } from "@/components/form-signin";
import { SignInDemoHint } from "@/components/signin-demo-hint";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.signIn.metaTitle, description: t.signIn.metaDescription, robots: { index: false } };
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}

export default async function SignInPage() {
  const { t } = await getServerI18n();
  // Google sign-in needs the OAuth client from identity-service; until it is configured the button stays off.
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID);
  return (
    <div className="relative isolate bg-[linear-gradient(180deg,var(--color-ivory),#fff_60%)]">
      <Container className="flex justify-center py-12 sm:py-20">
        <div className="w-full max-w-md rounded-[20px] border border-line bg-white p-6 shadow-[var(--shadow-lift)] sm:p-8">
          <BrandLogo variant="mark" height={56} />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">{t.signIn.title}</h1>
          <p className="mt-2 text-muted">{t.signIn.lead}</p>
          <SignInDemoHint className="mt-6" />
          <div className="mt-6">
            <SignInForm />
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            {t.signIn.or}
            <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            disabled={!googleReady}
            aria-describedby={googleReady ? undefined : "google-note"}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white font-semibold text-ink transition-colors hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            {t.signIn.google}
          </button>
          {googleReady ? null : (
            <p id="google-note" className="mt-2 text-center text-xs text-muted">
              {t.signIn.googleOff}
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
