"use client";

import { useApi } from "./useApi";
import { type automations } from "@/lib/db/schema";
import { useCallback } from "react";

type Automation = typeof automations.$inferSelect;

export function useAutomations() {
  const { data, loading, error, request, setData } = useApi<Automation[]>();

  const fetchAutomations = useCallback(() => {
    return request("/api/automation");
  }, [request]);

  const createAutomation = async (automation: Partial<Automation>) => {
    const result = await request("/api/automation", {
      method: "POST",
      body: JSON.stringify(automation),
    });
    if (result) {
      fetchAutomations();
    }
    return result;
  };

  const deleteAutomation = async (id: string) => {
    const result = await request(`/api/automation?id=${id}`, {
      method: "DELETE",
    });
    if (result) {
      setData(prev => prev ? prev.filter(a => a.id !== id) : null);
    }
    return result;
  };

  return {
    automations: data || [],
    loading,
    error,
    fetchAutomations,
    createAutomation,
    deleteAutomation,
  };
}
