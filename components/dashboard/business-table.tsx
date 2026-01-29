"use client";

import { Business } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";


import { Skeleton } from "@/components/ui/skeleton";

interface BusinessTableProps {
  businesses: Business[];
  onViewDetails: (business: Business) => void;
  onSendEmail: (business: Business) => void;
  isLoading?: boolean;
}

export function BusinessTable({
  businesses,
  onViewDetails,
  onSendEmail,
  selectedIds = [],
  onSelectionChange,
  isLoading = false,
}: BusinessTableProps & {
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}) {
  const getStatusBadge = (status: Business["emailStatus"]) => {
    if (!status || status === "pending")
      return <Badge variant="default">Pending</Badge>;
    if (status === "sent") return <Badge variant="success">Sent</Badge>;
    if (status === "opened") return <Badge variant="info">Opened</Badge>;
    if (status === "clicked") return <Badge variant="success">Clicked</Badge>;
    if (status === "failed") return <Badge variant="error">Failed</Badge>;
    if (status === "bounced") return <Badge variant="warning">Bounced</Badge>;
    return <Badge variant="default">Unknown</Badge>;
  };

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange(businesses.map((b) => b.id));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter((sid) => sid !== id));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center py-4">
          {/* Optional header skeleton if needed, but table structure usually suffices */}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"><Skeleton className="h-4 w-4" /></TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Email Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[80px]" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {onSelectionChange && (
            <TableHead className="w-[50px]">
              <Checkbox
                checked={businesses.length > 0 && selectedIds.length === businesses.length}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                aria-label="Select all"
              />
            </TableHead>
          )}
          <TableHead>Business Name</TableHead>
          <TableHead>Website</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Email Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {businesses.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">
              No businesses found.
            </TableCell>
          </TableRow>
        ) : (
          businesses.map((business) => (
          <TableRow key={business.id}>
            {onSelectionChange && (
              <TableCell>
                
                <Checkbox
                  checked={selectedIds.includes(business.id)}
                  onCheckedChange={(checked) => handleSelectOne(business.id, checked as boolean)}
                  />
                
              </TableCell>
            )}
            <TableCell className="font-medium">{business.name}</TableCell>
            <TableCell>
              {business.website ? (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
                >
                  Visit <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
            <TableCell>
              {business.email || (
                <span className="text-muted-foreground">No email</span>
              )}
            </TableCell>
            <TableCell>
              {business.phone || (
                <span className="text-muted-foreground">No phone</span>
              )}
            </TableCell>
            <TableCell>{business.category}</TableCell>
            <TableCell>{getStatusBadge(business.emailStatus)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {business.website && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(business.website!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                {business.email && !business.emailSent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSendEmail(business)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(business)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )))}
      </TableBody>
    </Table>
  );
}
