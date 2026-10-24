"use client";
import Link from "next/link";
import axios from "axios";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
   const passwordConfirmationState =
  confirmPassword.length === 0
    ? "empty"
    : password === confirmPassword
      ? "match"
      : "mismatch";
  async function handleSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  setError("");
  setLoading(true);

  if (password !== confirmPassword) {
    setError("Passwords do not match");
    setLoading(false);
    return;
  }

  try {
    await api.post("/auth/register", {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });

    router.push("/login");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ??
            "Registration failed",
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
      <div className="glass w-full max-w-2xl rounded-3xl p-6 sm:p-8">
        <div className="mb-8">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-lg">
            <Link 
  href="/" >
  A
</Link>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-zinc-600">
            Enter your details to create your account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
           <Field
  id="firstName"
  label="First name"
  value={firstName}
  onChange={setFirstName}
  autoComplete="given-name"
  required
/>

            <Field
  id="lastName"
  label="Last name"
  value={lastName}
  onChange={setLastName}
  autoComplete="family-name"
  required
/>
          </div>

          <Field
  id="username"
  label="Username"
  value={username}
  onChange={setUsername}
  autoComplete="username"
  required
/>

          <div className="grid gap-5 sm:grid-cols-2">
           <Field
  id="email"
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  autoComplete="email"
  required
/>

          </div>

          <Field
            id="phone"
            label="Phone"
            type="tel"
            value={phone}
            onChange={setPhone}
            autoComplete="tel"
             required
          />

<Field
  id="password"
  label="Password"
  type="password"
  value={password}
  onChange={setPassword}
  autoComplete="new-password"
  required
/>

<Field
  id="confirmPassword"
  label="Confirm password"
  type="password"
  value={confirmPassword}
  onChange={setConfirmPassword}
  autoComplete="new-password"
  required
  passwordMatchState={passwordConfirmationState}
/>
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
            className="mt-2 h-12 rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  passwordMatchState?: "empty" | "match" | "mismatch";
};

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required = false,
  passwordMatchState = "empty",
}: FieldProps) {
  const isMatch = passwordMatchState === "match";
  const isMismatch = passwordMatchState === "mismatch";

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-medium"
      >
        {label}

        {required && (
          <span
            className="ml-1 text-zinc-500"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          autoComplete={autoComplete}
          required={required}
          className={`h-12 w-full rounded-xl border px-4 pr-11 text-sm outline-none backdrop-blur-xl transition ${
            isMatch
              ? "border-emerald-300/80 bg-emerald-50/55 shadow-[0_4px_14px_rgba(16,185,129,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] focus:border-emerald-400 focus:bg-emerald-50/70 focus:ring-2 focus:ring-emerald-200/60"
              : isMismatch
                ? "border-red-300/80 bg-red-50/55 shadow-[0_4px_14px_rgba(239,68,68,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] focus:border-red-400 focus:bg-red-50/70 focus:ring-2 focus:ring-red-200/60"
                : "border-white/80 bg-white/60 shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white/65 focus:border-white focus:bg-white/75 focus:shadow-[0_6px_18px_rgba(31,38,135,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] focus:ring-2 focus:ring-white/60"
          }`}
        />

        {isMatch && (
          <span
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-emerald-600"
            aria-hidden="true"
          >
            ✓
          </span>
        )}

        {isMismatch && (
          <span
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-red-500"
            aria-hidden="true"
          >
            ×
          </span>
        )}
      </div>
    </div>
  );
}