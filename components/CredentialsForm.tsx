"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PUREGYM_LOGO_URL } from "@/lib/puregym-logo";

const SIGNIN_FEATURES = [
  "Your Visit History",
  "Live Gym Users",
  "Membership Details",
  "Useful Analytics",
] as const;

const LINE_REM = 1.5;
const ROTATE_MS = 3200;

function SignInFeatureOdometer() {
  const [i, setI] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const ms = reduceMotion ? ROTATE_MS * 1.5 : ROTATE_MS;
    const t = window.setInterval(() => setI(n => (n + 1) % SIGNIN_FEATURES.length), ms);
    return () => window.clearInterval(t);
  }, [reduceMotion]);

  return (
    <span
      className="relative inline-block min-w-[13rem] overflow-hidden align-bottom sm:min-w-[14rem]"
      style={{ height: `${LINE_REM}rem` }}
    >
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        Sign in to view {SIGNIN_FEATURES[i]}
      </span>
      <span
        className="odometer-track flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transform: `translateY(-${i * LINE_REM}rem)`,
          transitionDuration: reduceMotion ? "0ms" : undefined,
        }}
        aria-hidden
      >
        {SIGNIN_FEATURES.map(phrase => (
          <span
            key={phrase}
            className="shrink-0 whitespace-nowrap font-semibold text-puregym"
            style={{ height: `${LINE_REM}rem`, lineHeight: `${LINE_REM}rem` }}
          >
            {phrase}
          </span>
        ))}
      </span>
    </span>
  );
}

interface Props {
  onSave: (email: string, pin: string) => void;
  /** Shown below the card when session was cleared (e.g. invalid stored credentials). */
  sessionError?: string | null;
  onClearSessionError?: () => void;
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export default function CredentialsForm({ onSave, sessionError, onClearSessionError }: Props) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const displayError = sessionError ?? submitError;

  function clearErrors() {
    setSubmitError(null);
    onClearSessionError?.();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !pin.trim()) return;
    clearErrors();
    setChecking(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), pin: pin.trim() }),
      });
      if (res.status === 401) {
        setSubmitError("Invalid email or PIN. Please try again.");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSubmitError(typeof j.error === "string" ? j.error : "Something went wrong. Please try again.");
        return;
      }
      await res.json();
      localStorage.setItem("puregym_email", email.trim());
      localStorage.setItem("puregym_pin", pin.trim());
      onSave(email.trim(), pin.trim());
    } catch {
      setSubmitError("Could not connect. Check your internet connection.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-puregym-surface px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Image
            src={PUREGYM_LOGO_URL}
            alt="PureGym"
            width={220}
            height={88}
            className="mb-8 h-16 w-auto max-w-full object-contain object-left"
            priority
          />
          <h1 className="text-xl font-bold tracking-tight text-puregym-ink">
            Pure<span className="text-puregym">Gym</span> Dashboard
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-puregym-muted">
            <span className="inline-flex flex-wrap items-baseline gap-2">
              <span
                className="hidden shrink-0 items-center rounded-md border border-puregym/25 bg-puregym-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-puregym sm:inline-flex"
                title="Not affiliated with PureGym Ltd"
              >
                Unofficial Product
              </span>
              <span>Sign in to view</span>
            </span>{" "}
            <SignInFeatureOdometer />
          </p>
        </div>

        <div className="rounded-2xl border border-puregym-border bg-white p-8 shadow-lg shadow-puregym-ink/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="pg-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-puregym-muted">
                Email address
              </label>
              <input
                id="pg-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  clearErrors();
                }}
                placeholder="you@example.com"
                required
                className="min-h-11 w-full rounded-xl border border-puregym-border bg-white px-4 py-2.5 text-base text-puregym-ink outline-none transition-[border-color,box-shadow] placeholder:text-puregym-muted/80 focus:border-puregym focus:ring-2 focus:ring-puregym/20"
              />
            </div>

            <div>
              <label htmlFor="pg-pin" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-puregym-muted">
                PIN
              </label>
              <div className="relative">
                <input
                  id="pg-pin"
                  type={pinVisible ? "text" : "password"}
                  name="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  enterKeyHint="done"
                  value={pin}
                  onChange={e => {
                    setPin(e.target.value);
                    clearErrors();
                  }}
                  placeholder="Your PureGym PIN"
                  required
                  className="min-h-11 w-full rounded-xl border border-puregym-border bg-white py-2.5 pl-4 pr-12 text-base text-puregym-ink outline-none transition-[border-color,box-shadow] placeholder:text-puregym-muted/80 focus:border-puregym focus:ring-2 focus:ring-puregym/20"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-puregym-muted transition-colors hover:bg-puregym-surface hover:text-puregym-ink"
                  onClick={() => setPinVisible(v => !v)}
                  aria-label={pinVisible ? "Hide PIN" : "Show PIN"}
                  aria-pressed={pinVisible}
                >
                  <EyeIcon open={pinVisible} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={checking}
              className="w-full cursor-pointer rounded-xl bg-puregym py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-puregym-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking ? "Checking…" : "Open dashboard"}
            </button>
          </form>
        </div>

        {displayError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800">
            {displayError}
          </div>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-puregym-muted">
          Your credentials are stored only in this browser.
        </p>
      </div>
    </div>
  );
}
