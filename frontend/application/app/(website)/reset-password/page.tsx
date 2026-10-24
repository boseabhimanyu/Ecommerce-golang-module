"use client";

import { FormEvent, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

import api from "@/lib/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const passwordConfirmationState =
    confirmPassword.length === 0
      ? "empty"
      : newPassword === confirmPassword
      ? "match"
      : "mismatch";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing or has expired.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (requires2FA && !twoFactorCode.trim()) {
      setError(
        useBackupCode
          ? "Please enter a backup code."
          : "Please enter your 6-digit authenticator code."
      );
      return;
    }

    setLoading(true);

    try {
      const payload: {
        token: string;
        newPassword: string;
        code?: string;
      } = {
        token,
        newPassword,
      };

      if (requires2FA && twoFactorCode.trim()) {
        payload.code = twoFactorCode.trim();
      }

      await api.post("/auth/reset-password", payload);

      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;

        if (
          err.response?.status === 403 ||
          resData?.twoFactorRequired ||
          resData?.error === "2FA required"
        ) {
          setRequires2FA(true);
          setError("Two-Factor Authentication is required to finalize reset.");
        } else {
          setError(
            resData?.error ??
              resData?.message ??
              "Failed to reset password. Link may be invalid or expired."
          );
        }
      } else {
        setError("Unable to connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Invalid reset link
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            This password reset link is invalid or missing a security token.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg transition hover:bg-zinc-800"
          >
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="mb-8">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-lg">
            <Link href="/">A</Link>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Reset password
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {requires2FA
              ? "Provide your two-factor credentials to finalize your reset."
              : "Enter your new password below."}
          </p>
        </div>

        {success ? (
          <div className="flex flex-col gap-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">
                Password updated!
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                All previous sessions have been revoked. You can now sign in with
                your new password.
              </p>
            </div>

            <Link
              href="/login"
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg transition hover:bg-zinc-800"
            >
              Sign in with new password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="h-12 rounded-xl border border-white/80 bg-white/60 px-4 text-sm shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none backdrop-blur-xl transition placeholder:text-zinc-400 hover:bg-white/65 focus:border-white focus:bg-white/75 focus:ring-2 focus:ring-white/60"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={`h-12 w-full rounded-xl border px-4 pr-11 text-sm outline-none backdrop-blur-xl transition ${
                    passwordConfirmationState === "match"
                      ? "border-emerald-300/80 bg-emerald-50/55 shadow-[0_4px_14px_rgba(16,185,129,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/60"
                      : passwordConfirmationState === "mismatch"
                      ? "border-red-300/80 bg-red-50/55 shadow-[0_4px_14px_rgba(239,68,68,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] focus:border-red-400 focus:ring-2 focus:ring-red-200/60"
                      : "border-white/80 bg-white/60 shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white/65 focus:border-white focus:ring-2 focus:ring-white/60"
                  }`}
                />
                {passwordConfirmationState === "match" && (
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-emerald-600">
                    ✓
                  </span>
                )}
                {passwordConfirmationState === "mismatch" && (
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-red-500">
                    ×
                  </span>
                )}
              </div>
            </div>

            {requires2FA && (
  <div className="flex flex-col gap-2 rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 backdrop-blur-xl">
    <label
      htmlFor="twoFactorCode"
      className="text-xs font-semibold uppercase tracking-wider text-blue-900"
    >
      2FA Security Code
    </label>

    <input
      id="twoFactorCode"
      type="text"
      value={twoFactorCode}
      onChange={(e) => setTwoFactorCode(e.target.value)}
      placeholder="Enter 6-digit code or backup code"
      autoFocus
      required
      className="h-11 rounded-xl border border-white/90 bg-white/80 px-4 text-sm font-mono tracking-widest text-zinc-900 outline-none backdrop-blur-xl transition hover:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60"
    />
  </div>
)}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200/70 bg-red-50/60 px-4 py-3 text-sm text-red-700 backdrop-blur-xl"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Resetting password..."
                : requires2FA
                ? "Verify & Reset Password"
                : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}