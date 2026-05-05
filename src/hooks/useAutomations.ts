/**
 * Hook for managing automation rules
 */

import { useApi } from "./useApi";
import { useCallback } from "react";
import type { automations } from "@/lib/db/schema";
import { toast } from "sonner";

type Automation = typeof automations.$inferSelect;

export function useAutomations() {
  const { request, loading } = useApi<Automation[]>();
  const { request: saveReq, loading: saving } = useApi<Automation>();
  const { request: deleteReq } = useApi<{ success: boolean }>();

  const getAutomations = useCallback(async () => {
    return request("/api/automation");
  }, [request]);

  const saveAutomation = useCallback(async (data: Partial<Automation>) => {
    const res = await saveReq("/api/automation", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res) toast.success("Automation saved successfully");
    return res;
  }, [saveReq]);

  const deleteAutomation = useCallback(async (id: string) => {
    const res = await deleteReq(`/api/automation?id=${id}`, {
      method: "DELETE",
    });
    if (res) toast.success("Automation deleted");
    return res;
  }, [deleteReq]);

  return {
    getAutomations,
    saveAutomation,
    deleteAutomation,
    loading,
    saving
  };
}
