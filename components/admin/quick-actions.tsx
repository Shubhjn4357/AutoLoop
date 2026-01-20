import Link from "next/link";
import { Bell, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:bg-muted/50" asChild>
          <Link href="/admin/settings?tab=notifications">
            <Bell className="h-6 w-6 text-primary" />
            <span className="font-semibold">Send Notification</span>
            <span className="text-xs text-muted-foreground font-normal">Broadcast to all users</span>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:bg-muted/50" asChild>
          <Link href="/admin/settings?tab=banners">
            <Megaphone className="h-6 w-6 text-blue-500" />
            <span className="font-semibold">Create Banner</span>
            <span className="text-xs text-muted-foreground font-normal">Set info marquee</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
