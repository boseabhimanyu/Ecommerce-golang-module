"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PointerEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import api from "@/lib/api";

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
};

type AuthResponse = {
  user: User | null;
};

type Position = {
  left: number;
  top: number;
};

export default function AuthFloatingWidget() {
  const router = useRouter();
  const pathname = usePathname();

  const widgetRef = useRef<HTMLElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });

  const [position, setPosition] = useState<Position | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  const checkSession = useCallback(async () => {
    try {
      const response = await api.get<AuthResponse>("/auth/me");

      setUser(response.data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession, pathname]);

  // Initialize the widget on the right, vertically centered.
  useEffect(() => {
    if (loading || position !== null) return;

    const frame = requestAnimationFrame(() => {
      const element = widgetRef.current;
      if (!element) return;

      setPosition({
        left: Math.max(
          0,
          window.innerWidth - element.offsetWidth - 16,
        ),
        top: Math.max(
          0,
          (window.innerHeight - element.offsetHeight) / 2,
        ),
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [loading, position]);

  // Keep the widget inside the viewport when the window resizes.
  useEffect(() => {
    function handleResize() {
      const element = widgetRef.current;
      if (!element) return;

      const maxLeft = Math.max(
        0,
        window.innerWidth - element.offsetWidth,
      );

      const maxTop = Math.max(
        0,
        window.innerHeight - element.offsetHeight,
      );

      setPosition((current) => {
        if (!current) return current;

        return {
          left: Math.max(0, Math.min(current.left, maxLeft)),
          top: Math.max(0, Math.min(current.top, maxTop)),
        };
      });
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isAdmin =
    user?.role?.trim().toLowerCase() === "admin" ||
    user?.isAdmin === true;

  const displayName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  // Start dragging from the widget header.
function handlePointerDown(
  event: PointerEvent<HTMLDivElement>,
) {
  if (event.button !== 0) return;

  // Do not drag when interacting with controls.
  if (
    (event.target as HTMLElement).closest(
      "button, a, input, select, textarea",
    )
  ) {
    return;
  }

  const element = widgetRef.current;
  if (!element) return;

  const rect = element.getBoundingClientRect();

  dragRef.current = {
    active: true,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };

  event.currentTarget.setPointerCapture(event.pointerId);
  setDragging(true);
  event.preventDefault();
}

// Move the widget while the pointer is captured.
function handlePointerMove(
  event: PointerEvent<HTMLDivElement>,
) {
  if (!dragRef.current.active) return;

  const element = widgetRef.current;
  if (!element) return;

  const maxLeft = Math.max(
    0,
    window.innerWidth - element.offsetWidth,
  );

  const maxTop = Math.max(
    0,
    window.innerHeight - element.offsetHeight,
  );

  setPosition({
    left: Math.max(
      0,
      Math.min(
        event.clientX - dragRef.current.offsetX,
        maxLeft,
      ),
    ),
    top: Math.max(
      0,
      Math.min(
        event.clientY - dragRef.current.offsetY,
        maxTop,
      ),
    ),
  });
}

// Finish dragging or handle pointer cancellation.
function handlePointerUp(
  event: PointerEvent<HTMLDivElement>,
) {
  dragRef.current.active = false;
  setDragging(false);

  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
}

 

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

if (loading || !position) {
  return (
    <div className="fixed bottom-4 right-4 z-[99999] rounded-lg bg-red-600 p-3 text-white shadow-xl">
      Widget hidden: {loading ? "Checking session..." : "Initializing position..."}
    </div>
  );
}

  return (
    <aside
      ref={widgetRef}
      aria-label="Account menu"
      className="fixed z-50"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
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
            focus-visible:outline-offset-4
            focus-visible:outline-blue-500"
        >
          <UserIcon />
        </button>
      ) : (
        <section
          className="w-64 max-w-[calc(100vw-2rem)] rounded-2xl
            border border-slate-200 bg-white p-4 shadow-2xl"
        >
          {/* Drag handle */}
         <div
  ref={dragHandleRef}
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={handlePointerUp}
  onPointerCancel={handlePointerUp}
  className={`mb-3 flex items-center justify-between gap-3
    rounded-lg select-none
    ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
  style={{ touchAction: "none" }}
>
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
              ? `Signed in${displayName ? ` as ${displayName}` : ""}.`
              : "Sign in or create an account to get started."}
          </p>

          {error && (
            <p
              role="alert"
              className="mb-3 text-sm text-red-600"
            >
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
    className="rounded-lg border border-slate-200
      px-4 py-2.5 text-center text-sm font-medium
      text-slate-700 transition hover:bg-slate-50"
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