import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [polarClient()],
});
