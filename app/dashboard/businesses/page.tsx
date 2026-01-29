"use client";

import { useEffect, useState } from "react";
import { Business } from "@/types";
import { useApi } from "@/hooks/use-api";
import { BusinessTable } from "@/components/dashboard/business-table";
import { BusinessDetailModal } from "@/components/dashboard/business-detail-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bulkDeleteBusinesses } from "@/app/actions/business";
import { Trash2, Search, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function BusinessesPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10); 

    // Filter state
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterMinRating, setFilterMinRating] = useState("all");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchLocation, setSearchLocation] = useState("");

    // Debounce search
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [debouncedLocation, setDebouncedLocation] = useState("");

    const [categories, setCategories] = useState<string[]>([]);

    const { get: getBusinessesApi, loading: loadingBusinesses } = useApi<{ businesses: Business[], totalPages: number, page: number }>();
    const { get: getCategoriesApi } = useApi<{ categories: string[] }>();

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchKeyword);
            setDebouncedLocation(searchLocation);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchKeyword, searchLocation]);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            const data = await getCategoriesApi("/api/businesses/categories");
            if (data?.categories) {
                setCategories(data.categories);
            }
        };
        fetchCategories();
    }, [getCategoriesApi]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", limit.toString());
            if (filterCategory !== "all") params.append("category", filterCategory);
            if (filterStatus !== "all") params.append("status", filterStatus);
            if (filterMinRating !== "all") params.append("minRating", filterMinRating);
            if (debouncedKeyword) params.append("keyword", debouncedKeyword);
            if (debouncedLocation) params.append("location", debouncedLocation);

            const data = await getBusinessesApi(`/api/businesses?${params.toString()}`);
            if (mounted && data) {
                setBusinesses(data.businesses);
                setTotalPages(data.totalPages || 1);
            }
        };
        load();
        return () => { mounted = false; };
    }, [getBusinessesApi, currentPage, limit, filterCategory, filterStatus, filterMinRating, debouncedKeyword, debouncedLocation]);

    const handleConfirmDelete = async () => {
        try {
            await bulkDeleteBusinesses(selectedIds);
            setBusinesses(prev => prev.filter(b => !selectedIds.includes(b.id)));
            setSelectedIds([]);
            toast.success("Deleted successfully");
        } catch {
            toast.error("Failed to delete");
        }
        setDeleteDialogOpen(false);
    };

    const handleViewDetails = (business: Business) => {
        setSelectedBusiness(business);
        setIsModalOpen(true);
    };

    const { post: sendEmailApi } = useApi();

    const handleSendEmail = async (business: Business) => {
        const toastId = toast.loading(`Sending email to ${business.name}...`);
        try {
            await sendEmailApi("/api/email/send", { businessId: business.id }, { throwOnError: true });

            toast.success(`Email sent to ${business.email}`, { id: toastId });

            // Update local state
            setBusinesses(prev => prev.map(b =>
                b.id === business.id
                    ? { ...b, emailStatus: "sent", emailSent: true }
                    : b
            ));
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to send email";
            toast.error(errorMessage, { id: toastId });
        }
    };

    return (
        <div className="space-y-6 pt-6">
            <div className="flex justify-start items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Your Businesses</h2>
                    <p className="text-muted-foreground">Manage and filter all your collected leads</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Leads ({businesses.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 mb-6">
                        {/* Search Row */}
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or category..."
                                    className="pl-9"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                />
                            </div>
                            <div className="relative flex-1">
                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filter by location (e.g. New York)..."
                                    className="pl-9"
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex flex-wrap gap-4">
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filterMinRating} onValueChange={setFilterMinRating}>
                                    <SelectTrigger className="w-[150px]">
                                        <div className="flex items-center gap-2">
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            <SelectValue placeholder="Rating" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any Rating</SelectItem>
                                        <SelectItem value="3">3+ Stars</SelectItem>
                                        <SelectItem value="4">4+ Stars</SelectItem>
                                        <SelectItem value="4.5">4.5+ Stars</SelectItem>
                                        <SelectItem value="5">5 Stars</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedIds.length > 0 && (
                                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete ({selectedIds.length})
                                </Button>
                            )}
                        </div>
                    </div>

                    <BusinessTable
                        businesses={businesses}
                        onViewDetails={handleViewDetails}
                        onSendEmail={handleSendEmail}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        isLoading={loadingBusinesses}
                    />

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <BusinessDetailModal
                business={selectedBusiness}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSendEmail={handleSendEmail}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedIds.length} businesses from your list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
