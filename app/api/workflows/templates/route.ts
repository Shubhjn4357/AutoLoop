import { auth } from "@/auth";
import { db } from "@/db";
import { automationWorkflows, emailTemplates } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { WORKFLOW_TEMPLATES } from "@/lib/workflow-templates";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({
            templates: WORKFLOW_TEMPLATES,
            count: WORKFLOW_TEMPLATES.length,
        });
    } catch (error) {
        console.error("Error fetching preset templates:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { templateIndex } = await request.json();
        const template = WORKFLOW_TEMPLATES[templateIndex];

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // 1. Create email templates if they exist
        const createdTemplateIds: string[] = [];
        if (template.emailTemplates && template.emailTemplates.length > 0) {
            for (const tpl of template.emailTemplates) {
                const [newTpl] = await db.insert(emailTemplates).values({
                    userId: session.user.id,
                    name: tpl.name,
                    subject: tpl.subject,
                    body: tpl.body,
                    isDefault: false,
                }).returning();
                createdTemplateIds.push(newTpl.id);
            }
        }

        // 2. Map node templateIds to created IDs
        // We look for nodes with data.templateId = "template-X" and replace with actual ID
        const nodes = template.nodes.map((node) => {
            const newNode = { ...node };
            if (newNode.data && newNode.data.templateId && typeof newNode.data.templateId === 'string' && newNode.data.templateId.startsWith('template-')) {
                const indexStr = newNode.data.templateId.split('-')[1];
                const index = parseInt(indexStr, 10);
                if (!isNaN(index) && index < createdTemplateIds.length) {
                    newNode.data.templateId = createdTemplateIds[index];
                } else {
                    // Fallback or clear if invalid
                    newNode.data.templateId = "";
                }
            }
            // Also support legacy "config" format if used in some templates
            if (newNode.data && newNode.data.config && newNode.data.config.templateId && typeof newNode.data.config.templateId === 'string' && newNode.data.config.templateId.startsWith('template-')) {
                const indexStr = newNode.data.config.templateId.split('-')[1];
                const index = parseInt(indexStr, 10);
                if (!isNaN(index) && index < createdTemplateIds.length) {
                    newNode.data.config.templateId = createdTemplateIds[index];
                }
            }

            return newNode;
        });

        // 3. Create workflow
        await db.insert(automationWorkflows).values({
            userId: session.user.id,
            name: template.name,
            description: template.description,
            targetBusinessType: template.targetBusinessType || "General",
            keywords: template.keywords || [],
            isActive: false,
            nodes: nodes as unknown as import("@/types/social-workflow").WorkflowNode[],
            edges: template.edges as unknown as import("@/types/social-workflow").WorkflowEdge[],
        });

        // Query the workflow back to get its ID (most recently created)
        const createdWorkflow = await db.query.automationWorkflows.findFirst({
            where: eq(automationWorkflows.userId, session.user.id),
            orderBy: (workflows, { desc }) => [desc(workflows.createdAt)],
        });

        return NextResponse.json({
            success: true,
            message: `Template "${template.name}" installed successfully`,
            workflowId: createdWorkflow?.id,
        });
    } catch (error) {
        console.error("Error installing template:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
