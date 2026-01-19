
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses, emailTemplates, automationWorkflows } from "@/db/schema";
import { ilike, or, eq, and } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const userId = session.user.id;
        const searchPattern = `%${query}%`;

        // Parallelize queries for better performance
        const [businessesResult, templatesResult, workflowsResult] = await Promise.all([
            // Search Businesses
            db
                .select({
                    id: businesses.id,
                    name: businesses.name,
                    category: businesses.category
                })
                .from(businesses)
                .where(
                    and(
                        eq(businesses.userId, userId),
                        or(
                            ilike(businesses.name, searchPattern),
                            ilike(businesses.email, searchPattern),
                            ilike(businesses.category, searchPattern)
                        )
                    )
                )
                .limit(5),

            // Search Templates
            db
                .select({
                    id: emailTemplates.id,
                    name: emailTemplates.name,
                    subject: emailTemplates.subject
                })
                .from(emailTemplates)
                .where(
                    and(
                        eq(emailTemplates.userId, userId),
                        or(
                            ilike(emailTemplates.name, searchPattern),
                            ilike(emailTemplates.subject, searchPattern)
                        )
                    )
                )
                .limit(5),

            // Search Workflows
            db
                .select({
                    id: automationWorkflows.id,
                    name: automationWorkflows.name
                })
                .from(automationWorkflows)
                .where(
                    and(
                        eq(automationWorkflows.userId, userId),
                        or(
                            ilike(automationWorkflows.name, searchPattern),
                            ilike(automationWorkflows.targetBusinessType, searchPattern)
                        )
                    )
                )
                .limit(5)
        ]);

        const results = [
            ...businessesResult.map(b => ({ type: 'business', id: b.id, title: b.name, subtitle: b.category, url: `/dashboard/businesses?id=${b.id}` })),
            ...templatesResult.map(t => ({ type: 'template', id: t.id, title: t.name, subtitle: t.subject, url: `/dashboard/templates?id=${t.id}` })),
            ...workflowsResult.map(w => ({ type: 'workflow', id: w.id, title: w.name, subtitle: 'Workflow', url: `/dashboard/workflows?id=${w.id}` }))
        ];

        return NextResponse.json({ results });

    } catch (error) {
        console.error("[SEARCH_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
