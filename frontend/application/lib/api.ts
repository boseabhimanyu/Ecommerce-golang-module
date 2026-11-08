import axios from "axios";

const getBaseURL = () => {
  // 1. Server-side (SSR / Server Components): 
  // Node.js needs the full absolute URL to talk directly to your backend.
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL; // e.g., http://localhost:5000/api/v1
  }

  // 2. Client-side (Browser):
  // The browser uses a relative path so requests hit Next.js rewrites, 
  // keeping cookies safe and first-party.
  return "/api/v1";
};

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

export default api;
