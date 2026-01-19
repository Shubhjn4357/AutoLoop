"use client";

import { Business } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  ExternalLink,
} from "lucide-react";

interface BusinessDetailModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
  onSendEmail?: (business: Business) => void;
}

export function BusinessDetailModal({
  business,
  isOpen,
  onClose,
  onSendEmail,
}: BusinessDetailModalProps) {
  if (!business) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={business.name}
      description={business.category}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Contact Information</h3>
          <div className="grid gap-3">
            {business.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${business.email}`}
                  className="hover:underline"
                >
                  {business.email}
                </a>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${business.phone}`} className="hover:underline">
                  {business.phone}
                </a>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  {business.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {business.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{business.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating */}
        {business.rating && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Rating</h3>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{business.rating.toFixed(1)}</span>
              {business.reviewCount && (
                <span className="text-sm text-muted-foreground">
                  ({business.reviewCount} reviews)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Email Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Email Status</h3>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                business.emailStatus === "sent"
                  ? "success"
                  : business.emailStatus === "failed"
                  ? "error"
                  : "default"
              }
            >
              {business.emailStatus || "Not sent"}
            </Badge>
            {business.emailSentAt && (
              <span className="text-sm text-muted-foreground">
                Sent on {new Date(business.emailSentAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t pt-4">
          {business.email && !business.emailSent && onSendEmail && (
            <Button onClick={() => onSendEmail(business)}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          )}
          {business.website && (
            <Button
              variant="outline"
              onClick={() => window.open(business.website!, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Website
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
