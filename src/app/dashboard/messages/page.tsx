import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">Unified Inbox Coming Soon</CardTitle>
          <CardDescription className="max-w-xs">
            We&apos;re building a unified inbox to manage all your Instagram DMs and automation logs in one place.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
