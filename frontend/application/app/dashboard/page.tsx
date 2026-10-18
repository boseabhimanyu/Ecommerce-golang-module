import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import api from "@/lib/api";
import axios from "axios";
import { getCurrentUser } from "@/lib/auth"; // Import your auth helper
import BackupCodesWarning from "@/components/dashboard/backup-codes-warning";

async function getDashboardData() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const [customersRes, pagesRes, menusRes, healthRes] = await Promise.allSettled([
      api.get("/customers?limit=1", {
        headers: { Cookie: cookieHeader },
      }),
      api.get("/admin/pages?limit=1", {
        headers: { Cookie: cookieHeader },
      }),
      api.get("/admin/menus", {
        headers: { Cookie: cookieHeader },
      }),
      axios.get("http://localhost:5000/health"),
    ]);

    const userCount = 
      customersRes.status === "fulfilled" 
        ? customersRes.value.data.pagination?.total ?? "—"
        : "Error";

    const pageCount = 
      pagesRes.status === "fulfilled" 
        ? pagesRes.value.data.pagination?.total ?? "—"
        : "Error";

    const menuCount = 
      menusRes.status === "fulfilled" && Array.isArray(menusRes.value.data.menus)
        ? Math.min(menusRes.value.data.menus.length, 3)
        : "Error";

    const systemStatus = 
      healthRes.status === "fulfilled" ? "Online" : "Offline";

    return {
      users: typeof userCount === "number" ? userCount.toLocaleString() : userCount,
      pages: typeof pageCount === "number" ? pageCount.toLocaleString() : pageCount,
      menus: typeof menuCount === "number" ? menuCount.toLocaleString() : menuCount,
      systemStatus,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return {
      users: "Error",
      pages: "Error",
      menus: "Error",
      systemStatus: "Degraded",
    };
  }
}

export default async function DashboardPage() {
  // 1. Fetch current user and check role
  const user = await getCurrentUser();
  
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // 2. If not an admin, redirect immediately to the frontpage
  if (!isAdmin) {
    redirect("/");
  }

  const stats = await getDashboardData();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome back. Here’s an overview of your application.
          </p>
        </div>

        <div className="mt-6">
          <BackupCodesWarning />
        </div>

        {/* Dynamic Metric Cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Users"
            value={stats.users}
            description="Total registered users"
          />

          <DashboardCard
            title="Pages"
            value={stats.pages}
            description="Published CMS pages"
          />

          <DashboardCard
            title="Menus"
            value={stats.menus}
            description="Configured navigation menus"
          />

          <DashboardCard
            title="System"
            value={stats.systemStatus}
            description="Application status"
          />
        </section>

        {/* Activity & Quick Actions */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Recent activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Recent activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quick links to recently managed resources.
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                href="/dashboard/pages"
                className="rounded-lg bg-slate-900 px-4 py-2.5
                  text-center text-sm font-medium text-white
                  transition hover:bg-slate-700"
              >
                Pages Management
              </Link>
              <Link
                href="/dashboard/menus"
                className="rounded-lg bg-slate-900 px-4 py-2.5
                  text-center text-sm font-medium text-white
                  transition hover:bg-slate-700"
              >
                Navigation Menus
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Quick actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Common administrative shortcuts.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/customers"
                className="rounded-lg border border-slate-200
                  px-4 py-2.5 text-center text-sm font-medium text-slate-700
                  transition hover:bg-slate-50"
              >
                Customers
              </Link>
              <Link
                href="/dashboard/pages"
                className="rounded-lg border border-slate-200
                  px-4 py-2.5 text-center text-sm font-medium text-slate-700
                  transition hover:bg-slate-50"
              >
                Pages
              </Link>
              <Link
                href="/dashboard/menus"
                className="rounded-lg border border-slate-200
                  px-4 py-2.5 text-center text-sm font-medium text-slate-700
                  transition hover:bg-slate-50"
              >
                Menus
              </Link>
              <Link
                href="/dashboard/settings"
                className="rounded-lg border border-slate-200
                  px-4 py-2.5 text-center text-sm font-medium text-slate-700
                  transition hover:bg-slate-50"
              >
                Settings
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type DashboardCardProps = {
  title: string;
  value: string;
  description: string;
};

function DashboardCard({
  title,
  value,
  description,
}: DashboardCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}