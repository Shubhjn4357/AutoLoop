
'use client'
import { useState, useCallback, useEffect } from "react";
import { Business } from "@/types";
import { useApi } from "./use-api";

// Override Date types for API response
export interface BusinessResponse extends Omit<Business, "createdAt" | "updatedAt" | "lastContactedAt" | "emailSentAt"> {
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string | null;
  emailSentAt: string | null;
  reviewCount?: number;
}

export function useBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { get, loading: fetching } = useApi<{ businesses: BusinessResponse[] }>();
  const { del, loading: deleting } = useApi<unknown>();
  const { patch, loading: updating } = useApi<unknown>();

  const fetchBusinesses = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterCategory !== "all") params.append("category", filterCategory);
    if (filterStatus !== "all") params.append("status", filterStatus);

    const result = await get(`/api/businesses?${params}`);
    if (result) {
      setBusinesses(result.businesses || []);
    }
  }, [filterCategory, filterStatus, get]);

  useEffect(() => {
    const init = async () => {
      await fetchBusinesses();
    };
    init();
  }, [fetchBusinesses]);

  const deleteBusiness = async (id: string) => {
    if (!confirm("Are you sure you want to delete this business?")) return;

    const result = await del(`/api/businesses?id=${id}`);
    if (result !== null) { // Expecting success to even complete the call
      setBusinesses((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const updateBusiness = async (id: string, updates: Partial<BusinessResponse>) => {
    const result = await patch("/api/businesses", { id, ...updates });
    if (result) {
      await fetchBusinesses();
      return true;
    }
    return false;
  };

  return {
    businesses,
    loading: fetching || deleting || updating,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    refetch: fetchBusinesses,
    deleteBusiness,
    updateBusiness,
  };
}
