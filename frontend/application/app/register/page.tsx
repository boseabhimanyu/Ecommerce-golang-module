import { redirect } from "next/navigation";

import api from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "./register-form";
import Link from "next/link";
type SettingsResponse = {
  registration_enabled: boolean;
  login_hint: string;
};

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const response = await api.get<SettingsResponse>("/settings");

  if (!response.data.registration_enabled) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
          <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-lg">
              A
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Registration unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              New account registration is currently
              disabled by the administrator.
            </p>

            <Link
  href="/login"
  className="mt-8 flex h-12 items-center justify-center rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800"
>
  Back to sign in
</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <RegisterForm />
    </main>
  );
}