"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import axios from "axios";

import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ??
            err.response?.data?.message ??
            "Unable to process password reset request."
        );
      } else {
        setError("Unable to connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="mb-8">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-lg">
            <Link href="/">A</Link>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-sm text-emerald-900 shadow-sm backdrop-blur-xl">
              <p className="font-semibold">Check your inbox</p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                If an account exists for <span className="font-medium">{email}</span>,
                you will receive a link to reset your password shortly.
              </p>
            </div>

            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800"
            >
              Return to Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="name@example.com"
                className="h-12 rounded-xl border border-white/80 bg-white/60 px-4 text-sm shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none backdrop-blur-xl transition placeholder:text-zinc-400 hover:bg-white/65 focus:border-white focus:bg-white/75 focus:ring-2 focus:ring-white/60"
              />
            </div>

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
              {loading ? "Sending link..." : "Send reset link"}
            </button>

            <p className="text-center text-sm text-zinc-600">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-medium text-zinc-900 underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}