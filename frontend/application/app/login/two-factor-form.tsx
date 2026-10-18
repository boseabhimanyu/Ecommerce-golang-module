"use client";

import axios from "axios";
import { FormEvent, useState } from "react";

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
          code,
        },
      );

      const data = response.data;

      console.log("2FA login successful:", data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ??
            "Verification failed",
        );
      } else {
        setError("Unable to connect to the server");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-semibold">
          Two-factor authentication
        </h1>

        <p className="mb-8 text-sm text-zinc-600">
          Enter the verification code from your
          authenticator app.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="code">
              Verification code
            </label>

            <input
              id="code"
              type="text"
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className="h-12 rounded-xl border border-zinc-200 px-4 outline-none focus:border-zinc-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-black px-5 font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Verifying..."
              : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
