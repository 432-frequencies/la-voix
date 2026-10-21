import type { BetterAuthOptions } from "better-auth";
import { pool } from "./db.ts";
import { appURL, production } from "./config.ts";
import { sendMail } from "./mail.ts";
export const authOptions = {
  appName: "LA VOIX",
  baseURL: appURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  trustedOrigins: [appURL],
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) =>
      sendMail(user.email, "Réinitialiser votre mot de passe LA VOIX", url),
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) =>
      sendMail(user.email, "Confirmer votre adresse pour LA VOIX", url),
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  advanced: {
    useSecureCookies: production,
    disableOriginCheck: false,
    ipAddress: { ipAddressHeaders: ["x-client-ip"] },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
} satisfies BetterAuthOptions;
