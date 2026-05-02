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

// Diagnostic log (Server-side only)
if (typeof window === "undefined") {
  console.log("Auth Config Debug:", {
    hasGoogleId: !!googleConfig.clientId,
    hasGoogleSecret: !!googleConfig.clientSecret,
    hasGithubId: !!githubConfig.clientId,
    hasGithubSecret: !!githubConfig.clientSecret,
  });
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
  return Boolean(googleConfig.clientId && googleConfig.clientSecret);
}

export function isGithubAuthConfigured() {
  return Boolean(githubConfig.clientId && githubConfig.clientSecret);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
      }

      return session;
    },
  },
});
