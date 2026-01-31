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
          try {
            // Ensure admin user exists in DB
            const existingAdmin = await db.query.users.findFirst({
              where: eq(users.email, adminEmail!)
            });

            let adminUser = existingAdmin;

            if (!existingAdmin) {
              const newAdminId = "admin-user";
              await db.insert(users).values({
                id: newAdminId,
                name: "Admin",
                email: adminEmail!,
                createdAt: new Date(),
                updatedAt: new Date()
              });

              // Refetch to be safe or construct the object
              adminUser = {
                id: newAdminId,
                name: "Admin",
                email: adminEmail!,
                // other fields typically expected by types, though findFirst returns partial
                createdAt: new Date(),
                updatedAt: new Date(),
                image: null,
                accessToken: null,
                refreshToken: null,
                geminiApiKey: null,
                phone: null,
                jobTitle: null,
                company: null,
                website: null,
                customVariables: null,
                linkedinSessionCookie: null,
                whatsappBusinessPhone: null,
                whatsappAccessToken: null,
                whatsappVerifyToken: null,
                role: "admin"
              };
            }

            return {
              id: adminUser!.id,
              name: adminUser!.name || "Admin",
              email: adminUser!.email,
              role: "admin",
            };
          } catch (error) {
            console.error("Failed to ensure admin user exists:", error);
            // Fallback to memory-only, but this might cause FK issues as seen
          }

          return {
            id: "admin-user",
            name: "Admin",
            email: adminEmail,
            role: "admin",
          };
        }
        return null;
      }
    }),
    Credentials({
      id: "whatsapp-otp",
      name: "WhatsApp OTP",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        code: { label: "OTP Code", type: "text" }
      },
      async authorize(credentials) {
        const phoneNumber = credentials.phoneNumber as string;
        const code = credentials.code as string;

        if (!phoneNumber || !code) return null;

        // Import dynamically to avoid circular deps if any
        const { redis } = await import("@/lib/redis");

        // Verify Code
        if (!redis) {
          throw new Error("Redis client not initialized");
        }
        const storedCode = await redis.get(`otp:${phoneNumber}`);
        if (!storedCode || storedCode !== code) {
          throw new Error("Invalid or expired OTP");
        }

        // Find User
        const user = await db.query.users.findFirst({
          where: eq(users.phone, phoneNumber)
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Clear OTP
        await redis.del(`otp:${phoneNumber}`);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: "user" // Or fetch role if stored
        };
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
          // Update user details
          const updateData: Record<string, unknown> = {
              name: user.name,
              image: user.image,
              updatedAt: new Date(),
          };

          // Only update tokens if logging in with Google (to preserve Gmail permissions)
          if (account?.provider === "google") {
            updateData.accessToken = account.access_token;
            updateData.refreshToken = account.refresh_token;
          }

          await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, existingUser.id));
        } else {
          // Create new user
          await db.insert(users).values({
            email: user.email,
            name: user.name,
            image: user.image,
            // If first login is GitHub, these will be null/undefined, which is correct
            accessToken: account?.provider === "google" ? account?.access_token : null,
            refreshToken: account?.provider === "google" ? account?.refresh_token : null,
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

            if (dbUser) {
              // Use Database Truth (which is synced from Google on login)
              session.user.id = dbUser.id;
              session.user.name = dbUser.name || session.user.name;
              session.user.image = dbUser.image || session.user.image;
              // START FIX: Check if this is the admin user
              if (dbUser.id === "admin-user" || dbUser.email === process.env.ADMIN_EMAIL) {
                session.user.role = "admin";
              } else {
                session.user.role = "user";
              }
              // END FIX
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
