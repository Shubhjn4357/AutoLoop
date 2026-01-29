import { auth } from "@/auth";
import { db } from "@/db";
import { connectedAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PostCreatorForm } from "./post-creator-form";

export default async function NewPostPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/signin");

    const accounts = await db.query.connectedAccounts.findMany({
        where: eq(connectedAccounts.userId, session.user.id),
        columns: {
            id: true,
            name: true,
            provider: true,
            providerAccountId: true
        }
    });

    return <PostCreatorForm accounts={accounts} />;
}
