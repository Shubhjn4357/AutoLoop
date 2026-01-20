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

interface BusinessTableProps {
  businesses: Business[];
  onViewDetails: (business: Business) => void;
  onSendEmail: (business: Business) => void;
}

export function BusinessTable({
  businesses,
  onViewDetails,
  onSendEmail,
  selectedIds = [],
  onSelectionChange,
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {onSelectionChange && (
            <TableHead className="w-[50px]">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300"
                checked={businesses.length > 0 && selectedIds.length === businesses.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
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
        {businesses.map((business) => (
          <TableRow key={business.id}>
            {onSelectionChange && (
              <TableCell>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={selectedIds.includes(business.id)}
                  onChange={(e) => handleSelectOne(business.id, e.target.checked)}
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
        ))}
      </TableBody>
    </Table>
  );
}
