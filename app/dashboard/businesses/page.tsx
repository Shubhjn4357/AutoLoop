"use client";

import { useEffect, useState } from "react";
import { Business } from "@/types";
import { useApi } from "@/hooks/use-api";
import { BusinessTable } from "@/components/dashboard/business-table";
import { BusinessDetailModal } from "@/components/dashboard/business-detail-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bulkDeleteBusinesses } from "@/app/actions/business";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
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

export default function BusinessesPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10); // Or make this adjustable

    const { get: getBusinessesApi } = useApi<{ businesses: Business[], totalPages: number, page: number }>();

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            // Append query params manually or via options if useApi supported it, but template literal is fine here
            const data = await getBusinessesApi(`/api/businesses?page=${currentPage}&limit=${limit}`);
            if (mounted && data) {
                setBusinesses(data.businesses);
                setTotalPages(data.totalPages || 1);
            }
        };
        load();
        return () => { mounted = false; };
    }, [getBusinessesApi, currentPage, limit]);

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
            const result = await sendEmailApi("/api/email/send", { businessId: business.id });

            if (!result) {
                throw new Error("Failed to send email");
            }

            toast.success(`Email sent to ${business.email}`, { id: toastId });

            // Update local state
            setBusinesses(prev => prev.map(b =>
                b.id === business.id
                    ? { ...b, emailStatus: "sent", emailSent: true }
                    : b
            ));
        } catch (error) {
            toast.error("Failed to send email", { id: toastId });
            console.error(error);
        }
    };

    return (
        <div className="space-y-6 pt-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Your Businesses</h2>
                    <p className="text-muted-foreground">Manage all your collected leads</p>
                </div>
                {selectedIds.length > 0 && (
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ({selectedIds.length})
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Leads ({businesses.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <BusinessTable
                        businesses={businesses}
                        onViewDetails={handleViewDetails}
                        onSendEmail={handleSendEmail}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
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
