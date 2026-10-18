import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import ProfileFormRoot from "../components/profile-form";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: " My Profile", 
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Profile
          </h1>

          <p className="mt-1 text-sm text-zinc-600">
            Manage your personal information and address.
          </p>
        </div>

        <div className="mt-8">
          <ProfileFormRoot user={user} />
        </div>
      </div>
    </main>
  );
}