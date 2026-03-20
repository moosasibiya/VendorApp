"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ACCOUNT_TYPE_VALUES, type AccountType } from "@vendorapp/shared";
import {
  ApiError,
  buildGoogleAuthStartUrl,
  defaultAppPathForUser,
  signup,
} from "@/lib/api";
import styles from "./page.module.css";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const accountTypeLabels: Record<AccountType, string> = {
  CREATIVE: "Creative",
  CLIENT: "Client",
  AGENCY: "Agency",
};

const accountTypeHeadlines: Record<
  AccountType,
  { title: string; copy: string; button: string; notes: string[] }
> = {
  CREATIVE: {
    title: "Apply as an artist",
    copy:
      "Create your account, submit your profile, and move through the controlled prelaunch review flow. There is no upfront onboarding payment in the current rollout.",
    button: "Create account to start application",
    notes: [
      "The first 100 valid artist applications enter the prelaunch pool automatically.",
      "Later applications are still accepted but join a waitlist for future rollout waves.",
      "Approved artists go live gradually through limited launch slots.",
      "If onboarding recovery applies, it is taken once from the first completed booking only.",
    ],
  },
  CLIENT: {
    title: "Create your client account",
    copy:
      "Set up the account you will use to discover artists, book securely, and keep support inside the platform messaging flow.",
    button: "Create client account",
    notes: [
      "Browse artist profiles and send messages inside the platform.",
      "Track payment, job approval, and support from one place.",
      "Disputes and refunds route into the centralized support flow.",
      "You will finish profile preferences during onboarding.",
    ],
  },
  AGENCY: {
    title: "Create your agency account",
    copy:
      "Launch the workspace your team will use to manage represented artists, bookings, and platform operations from one account.",
    button: "Create agency account",
    notes: [
      "Set up your agency identity and contact details during onboarding.",
      "Manage represented talent and booking activity in one place.",
      "Use messaging and support without leaving the platform.",
      "Agency configuration stays separate from artist application review.",
    ],
  },
};

type PasswordRule = {
  label: string;
  met: boolean;
  required?: boolean;
};

type PasswordFeedback = {
  badge: string;
  headline: string;
  detail: string;
  tone: "empty" | "weak" | "fair" | "good" | "strong";
  activeSegments: number;
  rules: PasswordRule[];
};

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function getPasswordFeedback(password: string): PasswordFeedback {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const rules: PasswordRule[] = [
    { label: "8+ characters", met: hasMinLength, required: true },
    { label: "At least one letter", met: hasLetter, required: true },
    { label: "At least one number", met: hasNumber, required: true },
    { label: "Upper and lower case", met: hasUpper && hasLower },
    { label: "Special character", met: hasSymbol },
  ];

  if (!password) {
    return {
      badge: "Start here",
      headline: "Choose a password that is easy to remember",
      detail: "Use at least 8 characters with a letter and a number.",
      tone: "empty",
      activeSegments: 0,
      rules,
    };
  }

  const missingRequired = rules
    .filter((rule) => rule.required && !rule.met)
    .map((rule) => rule.label.toLowerCase());

  if (missingRequired.length > 0) {
    return {
      badge: "Needs work",
      headline: "Almost there",
      detail: `Still missing ${formatList(missingRequired)}.`,
      tone: "weak",
      activeSegments: Math.max(
        1,
        [hasMinLength, hasLetter, hasNumber].filter(Boolean).length,
      ),
      rules,
    };
  }

  const bonusCount = [hasUpper && hasLower, hasSymbol].filter(Boolean).length;

  if (bonusCount === 0) {
    return {
      badge: "Fair",
      headline: "Your password meets the minimum",
      detail: "Add mixed case or a symbol to make it stronger.",
      tone: "fair",
      activeSegments: 2,
      rules,
    };
  }

  if (bonusCount === 1) {
    return {
      badge: "Good",
      headline: "This password is in good shape",
      detail: "One more upgrade would make it noticeably stronger.",
      tone: "good",
      activeSegments: 3,
      rules,
    };
  }

  return {
    badge: "Strong",
    headline: "This password looks strong",
    detail: "Good variety. This should hold up well.",
    tone: "strong",
    activeSegments: 4,
    rules,
  };
}

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("CREATIVE");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleAuthUrl = useMemo(
    () =>
      buildGoogleAuthStartUrl({
        mode: "signup",
        nextPath: "/onboarding",
        accountType,
      }),
    [accountType],
  );
  const passwordFeedback = getPasswordFeedback(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const confirmTone =
    confirmPassword.length === 0 ? "idle" : passwordsMatch ? "match" : "mismatch";
  const selectedAccountTypeDetails = accountTypeHeadlines[accountType];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedAccountType = params.get("accountType");
    const requestedEmail = params.get("email");
    const oauthError = params.get("error");

    if (
      requestedAccountType &&
      ACCOUNT_TYPE_VALUES.includes(requestedAccountType as AccountType)
    ) {
      setAccountType(requestedAccountType as AccountType);
    }

    if (requestedEmail && !email) {
      setEmail(requestedEmail);
    }

    if (!oauthError) return;
    if (oauthError === "google_auth") {
      setError("Google sign-up failed. Please try again.");
      return;
    }
    if (oauthError === "missing_code_or_state") {
      setError("Google sign-up was cancelled or interrupted.");
      return;
    }
    setError("Unable to sign up with Google.");
  }, [email]);

  return (
    <div className={styles.stack}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Create your profile</p>
        <h1 className={styles.title}>{selectedAccountTypeDetails.title}</h1>
        <p className={styles.muted}>
          {selectedAccountTypeDetails.copy}
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          if (!fullName.trim() || !username.trim() || !email.trim()) {
            setError("Full name, username, and email are required.");
            return;
          }
          if (!PASSWORD_REGEX.test(password)) {
            setError(
              "Password must be at least 8 characters and include a letter and a number.",
            );
            return;
          }
          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
          }
          if (!acceptedTerms) {
            setError("You must accept the Terms of Service and Privacy Policy.");
            return;
          }

          setIsSubmitting(true);
          try {
            const result = await signup({
              fullName: fullName.trim(),
              username: username.trim().replace(/^@+/, ""),
              email: email.trim(),
              password,
              accountType,
            });
            router.push(
              result.nextPath ??
                (result.requiresEmailVerification
                  ? `/verify-email?email=${encodeURIComponent(email.trim())}`
                  : defaultAppPathForUser(result.user)),
            );
          } catch (err) {
            if (err instanceof ApiError) {
              setError(err.message);
            } else {
              setError("Unable to create account right now.");
            }
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.grid}>
          <label className={styles.field}>
            Full name
            <input
              placeholder="Moosa Sibiya"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
            />
          </label>

          <label className={styles.field}>
            Username
            <input
              placeholder="moosa"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
        </div>

        <label className={styles.field}>
          Email
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            Password
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className={styles.field}>
            Confirm password
            <input
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>

        <div className={styles.passwordPanel} aria-live="polite">
          <div className={styles.passwordHeader}>
            <div className={styles.passwordCopy}>
              <span className={styles.passwordEyebrow}>Password strength</span>
              <strong className={styles.passwordHeadline}>
                {passwordFeedback.headline}
              </strong>
            </div>
            <span
              className={styles.passwordBadge}
              data-tone={passwordFeedback.tone}
            >
              {passwordFeedback.badge}
            </span>
          </div>

          <div className={styles.passwordMeter} aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <span
                key={index}
                className={styles.passwordSegment}
                data-active={index < passwordFeedback.activeSegments}
                data-tone={passwordFeedback.tone}
              />
            ))}
          </div>

          <p className={styles.passwordDetail}>{passwordFeedback.detail}</p>

          <div className={styles.passwordRules}>
            {passwordFeedback.rules.map((rule) => (
              <div
                key={rule.label}
                className={styles.passwordRule}
                data-met={rule.met}
              >
                <span
                  className={`material-symbols-outlined ${styles.passwordRuleIcon}`}
                >
                  {rule.met ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span>{rule.label}</span>
              </div>
            ))}
          </div>

          <p className={styles.confirmHint} data-tone={confirmTone}>
            {confirmTone === "idle"
              ? "Re-enter the password above so we can confirm it."
              : passwordsMatch
                ? "Passwords match."
                : "Passwords do not match yet."}
          </p>
        </div>

        <label className={styles.field}>
          Account type
          <select
            value={accountType}
            onChange={(event) => setAccountType(event.target.value as AccountType)}
          >
            {ACCOUNT_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {accountTypeLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.accountPanel}>
          <div className={styles.accountPanelHeader}>
            <strong>
              {accountType === "CREATIVE" ? "Artist rollout overview" : "What happens next"}
            </strong>
            <span>{accountTypeLabels[accountType]} account</span>
          </div>
          <ul className={styles.accountNotes}>
            {selectedAccountTypeDetails.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        <button className={styles.primary} type="submit" disabled={isSubmitting}>
          <span className="material-symbols-outlined">person_add</span>
          {isSubmitting ? "Creating account..." : selectedAccountTypeDetails.button}
        </button>

        <div className={styles.divider}>
          <span>or continue with</span>
        </div>

        <div className={styles.socials}>
          <button
            type="button"
            onClick={() => {
              window.location.assign(googleAuthUrl);
            }}
            disabled={isSubmitting}
          >
            <span className="material-symbols-outlined">mail</span>
            Google
          </button>
        </div>

        <div className={styles.footer}>
          <span>Already have an account?</span>
          <Link className={styles.link} href="/login">
            Sign in
          </Link>
          <Link className={styles.link} href="/">
            Back to home
          </Link>
        </div>
      </form>
    </div>
  );
}
