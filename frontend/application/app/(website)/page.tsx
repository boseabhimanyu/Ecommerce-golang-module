import Link from "next/link";
import api from "@/lib/api";
import type { Metadata } from "next";
import BackupCodesWarning from "@/components/dashboard/backup-codes-warning";


export const metadata: Metadata = {
  title: "Homepage",
};

type SettingsResponse = {
  registration_enabled: boolean;
  login_hint: string;
};

export default async function Home() {
  // 1. Fetch application settings from the backend
  let settings: SettingsResponse = {
    registration_enabled: false,
    login_hint: "",
  };

  let apiConnected = false;

  try {
    const response = await api.get<SettingsResponse>("/settings");
    settings = response.data;
    apiConnected = true;
  } catch (error) {
    // Keep the homepage accessible when the API is unavailable.
    console.error("Failed to fetch application settings:", error);
  }

  // 2. Reusable styles for cards and buttons
  const cardClass =
    "rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md";

  const primaryButton =
    "inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700";

  const secondaryButton =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100";

  // 3. Dashboard modules that already have routes
  const dashboardModules = [
    {
      title: "Dashboard Overview",
      description:
        "Access the main dashboard and application overview.",
      href: "/dashboard",
      icon: "◫",
    },
    {
      title: "Customers",
      description:
        "View and manage customer records and related information.",
      href: "/dashboard/customers",
      icon: "♙",
    },
    {
      title: "Menu Management",
      description:
        "Manage navigation menus and organize menu items.",
      href: "/dashboard/menus",
      icon: "☷",
    },
    {
      title: "Page Management",
      description:
        "Manage application pages and their configurations.",
      href: "/dashboard/pages",
      icon: "▤",
    },
    {
      title: "Application Settings",
      description:
        "Access application settings and configuration options.",
      href: "/dashboard/settings",
      icon: "⚙",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* 4. Navbar: Application branding and authentication actions */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          
          <Link href="/" className="text-xl font-bold tracking-tight">
            Go Admin Starter
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Login
            </Link>

            {settings.registration_enabled && (
              <Link href="/register" className={primaryButton}>
                Register
              </Link>
            )}
          </nav>
        </div>
      </header>
          <div className="mt-6">
                    <BackupCodesWarning />
                  </div>  
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">

        {/* 5. Hero: Introduce the full-stack boilerplate */}
        <section className="overflow-hidden rounded-2xl bg-gray-900 px-7 py-12 text-white sm:px-12 sm:py-16">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-300">
            Full-Stack Application Starter
          </p>

          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            A solid foundation for your next application.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
            A modern application starter built with Go, Gin, MongoDB,
            and Next.js. Manage customers, navigation menus, pages,
            and application settings from one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className={primaryButton}>
              Open Dashboard
            </Link>

            <Link href="/dashboard/customers" className={secondaryButton}>
              Manage Customers
            </Link>
          </div>
        </section>

        {/* 6. Technology stack: Show the technologies used */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Technology Stack</h2>
            <p className="mt-1 text-sm text-gray-600">
              The core technologies powering this application.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Go + Gin",
                detail: "Backend API",
                color: "text-cyan-700",
              },
              {
                name: "MongoDB",
                detail: "Database",
                color: "text-green-700",
              },
              {
                name: "Next.js",
                detail: "Frontend framework",
                color: "text-gray-900",
              },
              {
                name: "TypeScript",
                detail: "Type-safe frontend",
                color: "text-blue-700",
              },
            ].map((tech) => (
              <div key={tech.name} className={cardClass}>
                <h3 className={`text-lg font-semibold ${tech.color}`}>
                  {tech.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {tech.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Application status: Use actual backend settings */}
        <section>
          <h2 className="mb-5 text-xl font-semibold">
            Application Status
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className={cardClass}>
              <p className="text-sm text-gray-500">Backend API</p>
              <p className="mt-2 font-semibold">
                <span
                  className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${
                    apiConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {apiConnected ? "Connected" : "Unavailable"}
              </p>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-gray-500">
                User Registration
              </p>
              <p className="mt-2 font-semibold">
                {settings.registration_enabled
                  ? "Enabled"
                  : "Disabled"}
              </p>
            </div>

            <div className={cardClass}>
              <p className="text-sm text-gray-500">
                Application
              </p>
              <p className="mt-2 font-semibold">Go Admin Starter</p>
            </div>
          </div>

          {/* Display the login hint only when configured */}
          {settings.login_hint && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Login Information
              </p>
              <p className="mt-1 text-sm text-blue-800">
                {settings.login_hint}
              </p>
            </div>
          )}
        </section>

        {/* 8. Dashboard modules: Link to the existing application routes */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Application Modules
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Navigate to the available management sections.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardModules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className={cardClass}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-2xl text-blue-700">
                  {module.icon}
                </div>

                <h3 className="font-semibold">{module.title}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {module.description}
                </p>

                <p className="mt-4 text-sm font-medium text-blue-600">
                  Open module →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 9. Authentication shortcuts: Account-related routes */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Account & Security
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Access account features and authentication flows.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/login" className={cardClass}>
              <h3 className="font-semibold">Login</h3>
              <p className="mt-2 text-sm text-gray-600">
                Sign in to your account.
              </p>
            </Link>

            {settings.registration_enabled && (
              <Link href="/register" className={cardClass}>
                <h3 className="font-semibold">Register</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Create a new account.
                </p>
              </Link>
            )}

            <Link href="/profile" className={cardClass}>
              <h3 className="font-semibold">My Profile</h3>
              <p className="mt-2 text-sm text-gray-600">
                View and manage your profile.
              </p>
            </Link>

            <Link href="/security" className={cardClass}>
              <h3 className="font-semibold">Activate 2FA</h3>
              <p className="mt-2 text-sm text-gray-600">
                Turn on Two-factor authentication (2FA)
              </p>
            </Link>

            <Link href="/security" className={cardClass}>
              <h3 className="font-semibold">Reset Password</h3>
              <p className="mt-2 text-sm text-gray-600">
                Set a new password using a valid reset token.
              </p>
            </Link>
          </div>
        </section>

        {/* 10. Feature overview: Summarize the boilerplate capabilities */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-semibold">
            Built for Secure Application Development
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold">Authentication & Security</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                JWT authentication and two-factor authentication
                support for secure access to application resources.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">User Management</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                A foundation for managing customer accounts and
                user-related application data.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Dynamic Page Management</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Organize and manage application pages through
                a dedicated management module.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Navigation Management</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Maintain application menus and navigation structures
                through a dedicated interface.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* 11. Footer: Keep the bottom of the page simple */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Go Admin Starter
          </p>

          <Link
            href="/dashboard"
            className="hover:text-blue-600"
          >
            Go to Dashboard →
          </Link>
        </div>
      </footer>
    </main>
  );
}