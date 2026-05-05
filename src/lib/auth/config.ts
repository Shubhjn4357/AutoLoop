import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";

const googleConfig = {
  clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
};

const githubConfig = {
  clientId: process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET,
};

if (process.env.NODE_ENV === "production") {
  console.log(`[Runtime] Auth Secret: ${process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET ? "YES" : "NO"}`);
  console.log(`[Runtime] Auth URL: ${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "NOT SET"}`);
  console.log(`[Runtime] Google Client: ${googleConfig.clientId ? "YES" : "NO"}`);
  console.log(`[Runtime] Github Client: ${githubConfig.clientId ? "YES" : "NO"}`);
  console.log(`[Runtime] DB URL: ${process.env.TURSO_DATABASE_URL ? "YES" : "NO"}`);
}



const providers: NextAuthConfig["providers"] = [];

if (googleConfig.clientId && googleConfig.clientSecret) {
  providers.push(
    Google({
      clientId: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    })
  );
}

if (githubConfig.clientId && githubConfig.clientSecret) {
  providers.push(
    GitHub({
      clientId: githubConfig.clientId,
      clientSecret: githubConfig.clientSecret,
    })
  );
}

export function isGoogleAuthConfigured() {
  return Boolean(
    process.env.AUTH_GOOGLE_ID || 
    process.env.GOOGLE_CLIENT_ID
  ) && Boolean(
    process.env.AUTH_GOOGLE_SECRET || 
    process.env.GOOGLE_CLIENT_SECRET
  );
}

export function isGithubAuthConfigured() {
  return Boolean(
    process.env.AUTH_GITHUB_ID || 
    process.env.GITHUB_CLIENT_ID
  ) && Boolean(
    process.env.AUTH_GITHUB_SECRET || 
    process.env.GITHUB_CLIENT_SECRET
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "production", // Enable debug logs in production for troubleshooting
  callbacks: {
    session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
      }

      return session;
    },
  },
  logger: {
    error(code, ...args) {
      console.error(`[NextAuth Error] ${code}`, ...args);
    },
    warn(code, ...args) {
      console.warn(`[NextAuth Warn] ${code}`, ...args);
    },
    debug(code, ...args) {
      console.debug(`[NextAuth Debug] ${code}`, ...args);
    },
  },
});
