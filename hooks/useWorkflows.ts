'use client'
import { useState, useCallback, useEffect } from "react";
import { AutomationWorkflow } from "@/types";
import { useApi } from "./use-api";

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const { get, loading, error } = useApi<{ workflows: AutomationWorkflow[] }>();

  const fetchWorkflows = useCallback(async () => {
    const result = await get("/api/workflows");
    if (result) {
      setWorkflows(result.workflows || []);
    }
  }, [get]);

  useEffect(() => {
    const init = async () => {
      await fetchWorkflows();
    };
    init();
  }, [fetchWorkflows]);

  return {
    workflows,
    isLoading: loading,
    error,
    refetch: fetchWorkflows 
  };
}
