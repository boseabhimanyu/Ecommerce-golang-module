"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { User } from "@/lib/types";


type AuthResponse = {
  user?: User | null;
  data?: {
    user?: User | null;
  };
};

export default function AuthFloatingWidget() {
  const router = useRouter();
  const pathname = usePathname();
const [position, setPosition] = useState({
  right: 16,
  top: 50,
});
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  const checkSession = useCallback(async () => {
    try {
      const response = await api.get<AuthResponse>("/auth/me");

      const currentUser =
        response.data.user ?? response.data.data?.user ?? null;

      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession, pathname]);

  const isAdmin =
    user?.role?.toLowerCase() === "admin"

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    setError("");

    try {
      await api.post("/auth/logout");

      setUser(null);
      setMinimized(false);
      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) return null;

  return (
    <aside
  aria-label="Account menu"
  className="fixed z-50"
  style={{
    right: `${position.right}px`,
    top: `${position.top}%`,
    transform: "translateY(-50%)",
    touchAction: "none",
  }}
>
      {minimized ? (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          aria-label="Expand account menu"
          className="flex h-14 w-14 items-center justify-center
            rounded-full bg-slate-900 text-white shadow-xl
            transition hover:bg-slate-700
            focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-4 focus-visible:outline-blue-500"
        >
          <UserIcon />
        </button>
      ) : (
        <section
          className="w-64 max-w-[calc(100vw-2rem)] rounded-2xl
            border border-slate-200 bg-white p-4 shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              {user ? "My Account" : "Welcome!"}
            </h2>

            <button
              type="button"
              onClick={() => setMinimized(true)}
              aria-label="Minimize account menu"
              className="rounded-md p-1.5 text-slate-500
                hover:bg-slate-100 hover:text-slate-900"
            >
              <MinusIcon />
            </button>
          </div>

          <p className="mb-4 break-words text-sm text-slate-500">
            {user
              ? `Signed in${user.firstName ? ` as ${user.firstName}` : ""}.`
              : "Sign in or create an account to get started."}
          </p>

          {error && (
            <p role="alert" className="mb-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/dashboard"
                    className="rounded-lg bg-blue-600 px-4 py-2.5
                      text-center text-sm font-medium text-white
                      transition hover:bg-blue-700"
                  >
                    Dashboard
                  </Link>
                )}
                {!isAdmin && (
                  <Link
                    href="/security"
                    className="rounded-lg bg-blue-600 px-4 py-2.5
                      text-center text-sm font-medium text-white
                      transition hover:bg-blue-700"
                  >
                    Security
                  </Link>
                )}
              
                <Link
                  href="/profile"
                  className="rounded-lg bg-slate-900 px-4 py-2.5
                    text-center text-sm font-medium text-white
                    transition hover:bg-slate-700"
                >
                  My Profile
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="rounded-lg border border-slate-200
                    px-4 py-2.5 text-sm font-medium text-slate-700
                    transition hover:bg-slate-50
                    disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {signingOut ? "Signing out..." : "Sign Out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg bg-slate-900 px-4 py-2.5
                    text-center text-sm font-medium text-white
                    transition hover:bg-slate-700"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="rounded-lg border border-slate-200
                    px-4 py-2.5 text-center text-sm font-medium
                    text-slate-700 transition hover:bg-slate-50"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </section>
      )}
    </aside>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <circle cx="12" cy="8" r="4" />
      <path
        strokeLinecap="round"
        d="M4.5 21a7.5 7.5 0 0 1 15 0"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" d="M5 12h14" />
    </svg>
  );
}