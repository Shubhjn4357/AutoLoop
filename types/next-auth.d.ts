import { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            accessToken?: string | null
            refreshToken?: string | null
            role?: "user" | "admin"
        } & DefaultSession["user"]
    }

    interface User {
        role?: "user" | "admin"
    }
}
