import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import SecurityForm from "@/components/security/security-form";

export default async function SecurityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Security
          </h1>

          <p className="mt-1 text-sm text-zinc-600">
            Manage your password and two-factor authentication.
          </p>
        </div>

        <div className="mt-8">
          <SecurityForm
            twoFactorEnabled={user.twoFactorEnabled}
          />
        </div>
      </div>
    </main>
  );
}