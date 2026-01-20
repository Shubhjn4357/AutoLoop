import { db } from "@/db";
import { businesses } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AdminBusinessView } from "@/components/admin/admin-business-view";

export default async function AdminBusinessesPage() {
    const items = await db.select().from(businesses).orderBy(desc(businesses.createdAt)).limit(100);

    // Cast or map items if necessary to match Business type
    // Assuming schema matches type, but dates might need string conversion if passed to client?
    // Drizzle returns Date objects, Client Component expects serialized props? 
    // Next.js Server Components -> Client Components auto-serialize Dates.

    return <AdminBusinessView initialBusinesses={items} />;
}
