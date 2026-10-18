"use client";

import axios from "axios";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

interface TwoFactorFormProps {
  challengeToken: string;
}

export default function TwoFactorForm({
  challengeToken,
}: TwoFactorFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post(
  "/auth/2fa/verify-login",
  {
    challengeToken,
    code: code.trim(),
  },
);

if (response.data.backupCodesLow) {
  sessionStorage.setItem(
    "backupCodesLow",
    JSON.stringify({
      remaining: response.data.backupCodesRemaining,
    }),
  );
}

router.push("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ??
            "Two-factor authentication failed",
        );
      } else {
        setError("Unable to connect to the server");
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
            A
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Two-factor authentication
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Enter the code from your authenticator
            app or use a backup code.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="code"
              className="text-sm font-medium"
            >
              Authentication code
            </label>

            <input
            id="code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(event) =>
              setCode(event.target.value)
            }
            autoComplete="one-time-code"
            autoFocus
            required
            className="h-12 rounded-xl border border-white/80 bg-white/60 px-4 text-center text-lg tracking-[0.3em] shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none backdrop-blur-xl transition hover:bg-white/65 focus:border-white focus:bg-white/75 focus:shadow-[0_6px_18px_rgba(31,38,135,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] focus:ring-2 focus:ring-white/60"
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
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}