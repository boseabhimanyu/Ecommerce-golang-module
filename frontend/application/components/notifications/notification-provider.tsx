"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type NotificationType = "success" | "error";

type Notification = {
  id: number;
  type: NotificationType;
  message: string;
};

type NotificationContextValue = {
  showNotification: (
    message: string,
    type?: NotificationType,
  ) => void;
};

const NotificationContext =
  createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const showNotification = useCallback(
    (
      message: string,
      type: NotificationType = "success",
    ) => {
      const id = Date.now() + Math.random();

      setNotifications((current) => [
        ...current,
        {
          id,
          type,
          message,
        },
      ]);

      window.setTimeout(() => {
        setNotifications((current) =>
          current.filter(
            (notification) =>
              notification.id !== id,
          ),
        );
      }, 4000);
    },
    [],
  );

  return (
    <NotificationContext.Provider
      value={{ showNotification }}
    >
      {children}

      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3 sm:right-6">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={
              notification.type === "success"
                ? "pointer-events-auto rounded-2xl border border-emerald-200/80 bg-white/80 px-4 py-3 shadow-[0_18px_50px_rgba(31,38,135,0.14)] backdrop-blur-2xl"
                : "pointer-events-auto rounded-2xl border border-red-200/80 bg-white/80 px-4 py-3 shadow-[0_18px_50px_rgba(127,29,29,0.12)] backdrop-blur-2xl"
            }
          >
            <div className="flex items-start gap-3">
              <div
                className={
                  notification.type === "success"
                    ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700"
                    : "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700"
                }
              >
                {notification.type === "success"
                  ? "✓"
                  : "×"}
              </div>

              <p className="flex-1 text-sm leading-6 text-zinc-800">
                {notification.message}
              </p>

              <button
                type="button"
                aria-label="Close notification"
                onClick={() =>
                  setNotifications((current) =>
                    current.filter(
                      (item) =>
                        item.id !== notification.id,
                    ),
                  )
                }
                className="rounded-lg px-1.5 py-1 text-zinc-400 transition hover:bg-black/5 hover:text-zinc-700"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used inside NotificationProvider",
    );
  }

  return context;
}