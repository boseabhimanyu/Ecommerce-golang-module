"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

import api from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing or malformed.");
      return;
    }

    // Guard against React StrictMode double invocation
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    async function verifyToken() {
      try {
        // Sends token in query or body depending on your Go route:
        const response = await api.post("/auth/verify-email", { token });

        setStatus("success");
        setMessage(
          response.data?.message ??
            "Your email has been verified successfully!",
        );
      } catch (err) {
        setStatus("error");
        if (axios.isAxiosError(err)) {
          setMessage(
            err.response?.data?.error ??
              err.response?.data?.message ??
              "This verification link is invalid or has expired.",
          );
        } else {
          setMessage("Unable to connect to the server.");
        }
      }
    }

    verifyToken();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8 text-center">
        {/* Brand Link */}
        <div className="mx-auto mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-lg">
          <Link href="/">A</Link>
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Verifying your email...
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Please wait while we confirm your account.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
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
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Email verified!
            </h1>
            <p className="mt-2 text-sm text-zinc-600">{message}</p>

            <Link
              href="/login"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800"
            >
              Continue to Sign in
            </Link>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div>
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
              Verification failed
            </h1>
            <p className="mt-2 text-sm text-zinc-600">{message}</p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/login"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800"
              >
                Return to Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}