import { Suspense } from "react";
import { redirect } from "next/navigation";

import api from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/auth/login-form";

type SettingsResponse = {
  registration_enabled: boolean;
  login_hint: string;
};

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const isRegistered = resolvedParams?.registered === "true";

  const response = await api.get<SettingsResponse>("/settings");

  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <LoginForm
          loginHint={response.data.login_hint}
          registeredSuccess={isRegistered}
        />
      </Suspense>
    </main>
  );
}