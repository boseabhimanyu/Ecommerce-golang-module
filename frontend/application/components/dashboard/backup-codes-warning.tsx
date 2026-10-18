"use client";

import { useEffect, useState } from "react";

type BackupCodesWarningData = {
  remaining: number;
};

export default function BackupCodesWarning() {
  const [remaining, setRemaining] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const stored = sessionStorage.getItem(
      "backupCodesLow",
    );

    if (!stored) {
      return;
    }

    try {
      const data: BackupCodesWarningData =
        JSON.parse(stored);

      setRemaining(data.remaining);
    } catch {
      sessionStorage.removeItem("backupCodesLow");
    }

    return () => {
      sessionStorage.removeItem("backupCodesLow");
    };
  }, []);

  if (remaining === null) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl border border-red-200/80 bg-red-50/70 px-5 py-4 text-red-800 shadow-[0_8px_24px_rgba(127,29,29,0.06)] backdrop-blur-xl">
      <p className="text-sm font-semibold">
        Backup codes low
      </p>

      <p className="mt-1 text-sm leading-6">
        You have {remaining} backup codes remaining.
        Regenerate new backup codes or use authenticator
        to login. If all backup codes get expired, you
        won't be able to access account.
      </p>
    </div>
  );
}
