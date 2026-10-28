import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { database } from "@/lib/database";

export const auth = betterAuth({
  database,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  plugins: [nextCookies()],
});
