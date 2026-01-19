"use client"; // Force rebuild

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Search,
    Download,
    MoreVertical,
    Mail,
    Phone,
    Globe,
    MapPin,
    Star,
    Trash2,
    Eye,
    Loader2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useBusinesses, BusinessResponse } from "@/hooks/use-businesses";



export default function BusinessesPage() {
    const {
        businesses,
        loading,
        filterCategory,
        setFilterCategory,
        filterStatus,
        setFilterStatus,
        deleteBusiness,
        updateBusiness
    } = useBusinesses();

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editingBusiness, setEditingBusiness] = useState<BusinessResponse | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const itemsPerPage = 20;

    const handleDelete = async (id: string) => {
        await deleteBusiness(id);
    };

    const handleEdit = (business: BusinessResponse) => {
        setEditingBusiness(business);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (updatedBusiness: Partial<BusinessResponse>) => {
        if (!editingBusiness) return;

        setIsSaving(true);
        const success = await updateBusiness(editingBusiness.id, updatedBusiness);
        setIsSaving(false);

        if (success) {
            setIsEditModalOpen(false);
            setEditingBusiness(null);
        }
    };

    const exportToCSV = () => {
        const headers = ["Name", "Email", "Phone", "Website", "Address", "Category", "Rating", "Status"];
        const rows = filteredBusinesses.map((b) => [
            b.name,
            b.email || "",
            b.phone || "",
            b.website || "",
            b.address || "",
            b.category,
            b.rating || "",
            b.emailStatus || "pending",
        ]);

        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `businesses-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    const filteredBusinesses = businesses.filter((business) =>
        business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);

    const paginatedBusinesses = filteredBusinesses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "sent":
                return "default";
            case "opened":
                return "default";
            case "clicked":
                return "default";
            case "bounced":
                return "destructive";
            case "failed":
                return "destructive";
            default:
                return "secondary";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Businesses</h1>
                    <p className="text-muted-foreground">
                        Manage your scraped business leads
                    </p>
                </div>
                <Button onClick={exportToCSV} variant="outline" className="cursor-pointer w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Businesses</CardDescription>
                        <CardTitle className="text-2xl">{businesses.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>With Email</CardDescription>
                        <CardTitle className="text-2xl">
                            {businesses.filter((b) => b.email).length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Contacted</CardDescription>
                        <CardTitle className="text-2xl">
                            {businesses.filter((b) => b.emailStatus).length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Opened</CardDescription>
                        <CardTitle className="text-2xl">
                            {businesses.filter((b) => b.emailStatus === "opened" || b.emailStatus === "clicked").length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search businesses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                <option value="Restaurant">Restaurant</option>
                                <option value="Retail">Retail</option>
                                <option value="Service">Service</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="sent">Sent</option>
                                <option value="opened">Opened</option>
                                <option value="clicked">Clicked</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading businesses...
                        </div>
                    ) : filteredBusinesses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No businesses found
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Business</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedBusinesses.map((business) => (
                                        <TableRow key={business.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{business.name}</div>
                                                    {business.address && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="h-3 w-3" />
                                                            {business.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    {business.email && (
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {business.email}
                                                        </div>
                                                    )}
                                                    {business.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {business.phone}
                                                        </div>
                                                    )}
                                                    {business.website && (
                                                        <div className="flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            <a
                                                                href={business.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline cursor-pointer"
                                                            >
                                                                Website
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{business.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {business.rating && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-medium">{business.rating}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({business.reviewCount})
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusColor(business.emailStatus)}>
                                                    {business.emailStatus || "pending"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="cursor-pointer">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => handleEdit(business)}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <Mail className="mr-2 h-4 w-4" />
                                                            Send Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive cursor-pointer"
                                                            onClick={() => handleDelete(business.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBusinesses.length)} of {filteredBusinesses.length} businesses
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="cursor-pointer"
                                        >
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    className="cursor-pointer min-w-[40px]"
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="cursor-pointer"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            {isEditModalOpen && editingBusiness && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Edit Business</CardTitle>
                            <CardDescription>Update business information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Business Name</Label>
                                <Input
                                    defaultValue={editingBusiness.name}
                                    onChange={(e) => setEditingBusiness({ ...editingBusiness, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    defaultValue={editingBusiness.email || ""}
                                    onChange={(e) => setEditingBusiness({ ...editingBusiness, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    defaultValue={editingBusiness.phone || ""}
                                    onChange={(e) => setEditingBusiness({ ...editingBusiness, phone: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={() => handleSaveEdit(editingBusiness)}
                                    className="cursor-pointer flex-1"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingBusiness(null);
                                    }}
                                    className="cursor-pointer flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
