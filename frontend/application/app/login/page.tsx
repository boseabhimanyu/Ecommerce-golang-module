import { redirect } from "next/navigation";

import api from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/auth/login-form";

type SettingsResponse = {
  registration_enabled: boolean;
  login_hint: string;
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const response = await api.get<SettingsResponse>("/settings");

  return (
    <main className="min-h-screen">
      <LoginForm 
      loginHint={response.data.login_hint} 
      />
    </main>
  );
}