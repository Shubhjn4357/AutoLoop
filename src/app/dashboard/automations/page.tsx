import { db } from "@/lib/db/client";
import { automations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Bot, Plus, ArrowRight } from "lucide-react";
import { revalidatePath } from "next/cache";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default async function AutomationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userAutomations = await db.query.automations.findMany({
    where: eq(automations.userId, session.user.id),
  });

  async function createAutomation(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;
    
    const name = formData.get("name") as string;
    const condition = formData.get("condition") as string;
    const responseTemplate = formData.get("responseTemplate") as string;
    
    await db.insert(automations).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      triggerType: "keyword", // default for MVP
      condition,
      responseTemplate,
      isActive: true,
    });
    
    revalidatePath("/dashboard/automations");
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automations</h2>
          <p className="text-muted-foreground">Build rules to automatically reply to incoming messages.</p>
        </div>
        
        {/* ShadCN Modal Form */}
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
            <Plus className="h-4 w-4" /> New Rule
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>
                Define the keyword that will trigger this specific direct message response.
              </DialogDescription>
            </DialogHeader>
            <form action={createAutomation} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Price Inquiry" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">If message contains keyword:</Label>
                <Input id="condition" name="condition" required placeholder="e.g. price" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responseTemplate">Reply with:</Label>
                <Textarea id="responseTemplate" name="responseTemplate" required rows={3} placeholder="Our pricing is available on the website!" />
              </div>
              <Button type="submit" className="w-full">Save Automation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {userAutomations.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">You don&apos;t have any active automations.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userAutomations.map((auto: typeof automations.$inferSelect) => (
              <Card key={auto.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{auto.name}</CardTitle>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                      Active
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground font-medium mb-1">Trigger</p>
                    <p className="font-mono">Contains: &quot;{auto.condition}&quot;</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm border p-2 rounded-md shadow-sm">
                    <p className="text-muted-foreground font-medium mb-1">Reply</p>
                    <p>&quot;{auto.responseTemplate}&quot;</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
