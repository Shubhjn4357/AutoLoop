import { db } from "@/db";
import { businesses } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminBusinessesPage() {
    const items = await db.select().from(businesses).orderBy(desc(businesses.createdAt)).limit(100);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Businesses</h2>
                <p className="text-muted-foreground">Manage scraped leads and business data</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Leads ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.name}
                                        {item.website && (
                                            <a href={item.website} target="_blank" rel="noreferrer" className="block text-xs text-blue-500 hover:underline truncate max-w-[200px]">
                                                {item.website}
                                            </a>
                                        )}
                                    </TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">{item.email || "-"}</div>
                                        <div className="text-xs text-muted-foreground">{item.phone || "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.emailSent ? "secondary" : "default"}>
                                            {item.emailSent ? "Contacted" : "New"}
                                        </Badge>
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
