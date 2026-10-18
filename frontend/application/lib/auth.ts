import "server-only";

import axios from "axios";
import { cookies } from "next/headers";

import api from "@/lib/api";
import type { User } from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  try {
    const response = await api.get<{ user: User }>("/auth/me", {
      headers: {
        Cookie: cookieStore.toString(),
      },
    });

    return response.data.user;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      return null;
    }

    throw error;
  }
}