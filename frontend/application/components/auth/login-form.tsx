"use client";

import axios from "axios";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import api from "@/lib/api";
import TwoFactorForm from "./two-factor-form";

interface LoginFormProps {
  loginHint: string;
  registeredSuccess?: boolean;
}

type LoginResponse = {
  message: string;
  twoFactorRequired: boolean;
  challengeToken?: string;
  backupCodesLow: boolean;
  backupCodesRemaining: number;
};

export default function LoginForm({
  loginHint,
  registeredSuccess,
}: LoginFormProps) {
  const searchParams = useSearchParams();
const shouldShow =
    registeredSuccess ?? searchParams.get("registered") === "true";

  // Manage banner visibility in state
  const [showNotice, setShowNotice] = useState(shouldShow);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!showNotice) return;

    const timer = setTimeout(() => {
      setShowNotice(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [showNotice]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        identifier,
        password,
      });

      const data = response.data;

      if (data.twoFactorRequired === true) {
        setChallengeToken(data.challengeToken || "");
        return;
      }

      if (data.backupCodesLow) {
        sessionStorage.setItem(
          "backupCodesLow",
          JSON.stringify({
            remaining: data.backupCodesRemaining,
          }),
        );
      }

      window.location.href = "/";
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Login failed");
      } else {
        setError("Unable to connect to the server");
      }
    } finally {
      setLoading(false);
    }
  }

  if (challengeToken) {
    return 
    <TwoFactorForm
     challengeToken={challengeToken} 
     />;

  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="mb-8">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-lg">
            <Link href="/">A</Link>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-zinc-600">
            Sign in to your account
          </p>
        </div>

        {showNotice && (
  <div className="relative mb-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 pr-10 text-sm text-emerald-900 shadow-sm backdrop-blur-xl">
    <p className="font-semibold">Account created successfully!</p>
    <p className="mt-1 text-xs leading-5 text-emerald-800">
      Please check your email to verify your account before signing in.
    </p>

    {/* Close button */}
    <button
      type="button"
      onClick={() => setShowNotice(false)}
      className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-lg text-emerald-700 transition hover:bg-emerald-200/50 hover:text-emerald-900"
      aria-label="Close notification"
    >
      <span className="text-base leading-none">×</span>
    </button>
  </div>
)}

        <form 
        onSubmit={handleSubmit} 
        className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label 
            htmlFor="identifier" 
            className="text-sm font-medium"
            >
              {loginHint}
            </label>

            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(event) => 
                setIdentifier(event.target.value)
              }
              autoComplete="username"
              required
              className="h-12 rounded-xl border border-white/80 bg-white/60 px-4 text-sm shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none backdrop-blur-xl transition placeholder:text-zinc-400 hover:bg-white/65 focus:border-white focus:bg-white/75 focus:shadow-[0_6px_18px_rgba(31,38,135,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] focus:ring-2 focus:ring-white/60"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-medium text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => 
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
              className="h-12 rounded-xl border border-white/80 bg-white/60 px-4 text-sm shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none backdrop-blur-xl transition placeholder:text-zinc-400 hover:bg-white/65 focus:border-white focus:bg-white/75 focus:shadow-[0_6px_18px_rgba(31,38,135,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] focus:ring-2 focus:ring-white/60"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200/70 bg-red-50/60 px-4 py-3 text-sm text-red-700 backdrop-blur-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}