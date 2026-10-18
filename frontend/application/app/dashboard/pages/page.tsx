import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import PagesManagement from "@/components/pages/pages-management";

export default async function PagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pages
          </h1>

          <p className="mt-1 text-sm text-zinc-600">
            Manage website pages and their visibility.
          </p>
        </div>

        <div className="mt-8">
          <PagesManagement />
        </div>
      </div>
    </main>
  );
}