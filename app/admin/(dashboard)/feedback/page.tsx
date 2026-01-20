import { db } from "@/db";
import { feedback, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedbackActions } from "@/components/admin/feedback-actions";

export default async function FeedbackPage() {
    // Fetch feedback with user details if possible
    // Drizzle relations would make this easier. 
    // Manual join or separate fetch.
    // For now, let's fetch feedback and map user info if needed or just show basic info.

    // We can do a join:
    const feedbacks = await db
        .select({
            id: feedback.id,
            message: feedback.message,
            type: feedback.type,
            status: feedback.status,
            createdAt: feedback.createdAt,
            userEmail: users.email,
            userName: users.name,
            userImage: users.image
        })
        .from(feedback)
        .leftJoin(users, eq(feedback.userId, users.id))
        .orderBy(desc(feedback.createdAt));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Feedback</h2>
                <p className="text-muted-foreground">User reports and suggestions</p>
            </div>

            <div className="grid gap-4">
                {feedbacks.map((item) => (
                    <Card key={item.id}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={item.userImage || ""} />
                                    <AvatarFallback>{item.userName?.charAt(0) || "?"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium">{item.userName || "Anonymous"}</div>
                                    <div className="text-xs text-muted-foreground">{item.userEmail || "No email"}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant={item.type === "bug" ? "destructive" : "default"}>
                                    {item.type}
                                </Badge>
                                <Badge>{item.status}</Badge>
                                <FeedbackActions id={item.id} status={item.status} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            <p className="text-sm">{item.message}</p>
                            <div className="text-xs text-muted-foreground mt-2">
                                {item.createdAt.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div >
    )
}
