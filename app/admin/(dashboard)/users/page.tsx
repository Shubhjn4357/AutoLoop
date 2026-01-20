import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function AdminUsersPage() {
    const items = await db.select().from(users).orderBy(desc(users.createdAt));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                <p className="text-muted-foreground">Manage platform users</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={item.image || ""} />
                                            <AvatarFallback>{item.name?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{item.name || "Unknown"}</span>
                                    </TableCell>
                                    <TableCell>{item.email}</TableCell>
                                    <TableCell>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
