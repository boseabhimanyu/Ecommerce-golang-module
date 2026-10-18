"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleLogout() {
    setLoading(true);

    try {
      await api.post("/auth/logout");

      router.push("/login");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Logout failed:",
          error.response?.data ?? error.message,
        );
      } else {
        console.error("Logout failed:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}