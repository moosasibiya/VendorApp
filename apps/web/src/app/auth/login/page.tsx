"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Login page
 * - Uses auth.css (namespaced) classes
 * - Uses <Link /> for internal nav
 * - No backend yet: simulates success and routes home
 */
export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    identifier: "", // email or username
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(form.identifier.trim() && form.password.trim());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Please enter your email/username and password.");
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Replace with real auth request later.
      await new Promise((r) => setTimeout(r, 450));

      router.push("/");
    } catch {
      setError("Login failed. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-onboarding">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            Vendr<span>Man</span>
          </div>
          <div className="auth-step-title">Welcome back</div>
          <div className="auth-step-subtitle">
            Sign in to continue. You can still browse without an account.
          </div>
        </div>

        {/* Body */}
        <div className="auth-body">
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="identifier">
                Email or Username <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="identifier"
                  className="auth-input"
                  type="text"
                  placeholder="moosa@vendrman.co.za"
                  value={form.identifier}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, identifier: e.target.value }))
                  }
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="password">
                Password <span className="auth-required">*</span>
              </label>

              <div className="auth-input-wrapper">
                <input
                  id="password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="auth-input-icon"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                  }}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-warning-banner" role="alert">
                <span className="material-symbols-outlined">error</span>
                <div className="auth-warning-text">{error}</div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              <Link href="/auth/signup" style={{ textDecoration: "none" }}>
                <span
                  style={{
                    color: "#667eea",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Create an account
                </span>
              </Link>

              {/* TODO: wire later */}
              <button
                type="button"
                onClick={() => setError("Password reset is not wired yet.")}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    color: "#667eea",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Forgot password?
                </span>
              </button>
            </div>

            <button
              className="auth-btn auth-btn-primary"
              type="submit"
              disabled={!canSubmit || submitting}
            >
              <span className="material-symbols-outlined">login</span>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <div className="auth-progress-text" style={{ textAlign: "left" }}>
            Back to browsing
          </div>

          <Link href="/" style={{ textDecoration: "none" }}>
            <span
              style={{
                color: "#667eea",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Go home →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
