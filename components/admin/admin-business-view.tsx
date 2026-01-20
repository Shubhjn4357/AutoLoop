"use client";

import { useState } from "react";
import { Business } from "@/types"; // Ensure Business type is compatible or inferred
import { BusinessTable } from "@/components/dashboard/business-table";
import { BusinessDetailModal } from "@/components/dashboard/business-detail-modal";
import { Button } from "@/components/ui/button";
import { adminBulkDeleteBusinesses } from "@/app/admin/actions/business";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminBusinessViewProps {
    initialBusinesses: Business[];
}

export function AdminBusinessView({ initialBusinesses }: AdminBusinessViewProps) {
    const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDeleteSelected = async () => {
        if (!confirm(`Delete ${selectedIds.length} businesses?`)) return;

        try {
            await adminBulkDeleteBusinesses(selectedIds);
            setBusinesses(prev => prev.filter(b => !selectedIds.includes(b.id)));
            setSelectedIds([]);
            toast.success("Deleted successfully");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const handleViewDetails = (business: Business) => {
        setSelectedBusiness(business);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Businesses</h2>
                    <p className="text-muted-foreground">Manage scraped leads and business data</p>
                </div>
                {selectedIds.length > 0 && (
                     <Button variant="destructive" onClick={handleDeleteSelected}>
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
                        onSendEmail={() => {}} // Admin doesn't send emails from here typically
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                    />
                </CardContent>
            </Card>

            <BusinessDetailModal
              business={selectedBusiness}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
