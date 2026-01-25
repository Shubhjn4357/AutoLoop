import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.compose",
            "https://www.googleapis.com/auth/gmail.modify",
          ].join(" "),
        },
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (
          credentials.email === adminEmail &&
          credentials.password === adminPassword
        ) {
          // Ensure admin user exists in DB
          const adminId = "admin-user";

          try {
            const existingAdmin = await db.query.users.findFirst({
              where: eq(users.id, adminId)
            });

            if (!existingAdmin) {
              await db.insert(users).values({
                id: adminId,
                name: "Admin",
                email: adminEmail!,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          } catch (error) {
            console.error("Failed to ensure admin user exists:", error);
            // Fallback to memory-only, but this might cause FK issues as seen
          }

          return {
            id: adminId,
            name: "Admin",
            email: adminEmail,
            role: "admin",
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user.email) return false;

      try {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        if (existingUser) {
          // Update tokens
          await db
            .update(users)
            .set({
              accessToken: account?.access_token,
              refreshToken: account?.refresh_token,
              name: user.name,
              image: user.image,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));
        } else {
          // Create new user
          await db.insert(users).values({
            email: user.email,
            name: user.name,
            image: user.image,
            accessToken: account?.access_token,
            refreshToken: account?.refresh_token,
          });
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, token }) {
     // console.log("🔐 Session Callback - Token:", JSON.stringify(token, null, 2));

      // Always prioritize DB lookup for logged in users
      if (session.user && session.user.email) {
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
          });

            console.log("👤 DB User found:", dbUser ? dbUser.id : "null");

            if (dbUser) {
              // Use Database Truth (which is synced from Google on login)
              session.user.id = dbUser.id;
              session.user.name = dbUser.name || session.user.name;
              session.user.image = dbUser.image || session.user.image;
              session.user.role = "user"; 
              session.user.accessToken = dbUser.accessToken || undefined;
            } else {
              // Only use admin fallback if NOT found in DB (unlikely for Google login)
              if (token.role === "admin") {
                session.user.role = "admin";
                session.user.id = "admin-user";
              }
            }
          } catch (error) {
            console.error("Error seeking DB user in session:", error);
          }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
      }
      return token;
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
});
