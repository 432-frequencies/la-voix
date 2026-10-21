import { betterAuth } from "better-auth";
import { authOptions } from "./auth-options.ts";
export const auth = betterAuth(authOptions);
export type User = typeof auth.$Infer.Session.user;
