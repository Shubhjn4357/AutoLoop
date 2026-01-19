'use client'
import { useState, useCallback, useEffect } from "react";
import { EmailTemplate } from "@/types";
import { useApi } from "./use-api";

export function useTemplates() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const { get, loading: fetching } = useApi<{ templates: EmailTemplate[] }>();
    const { post, patch, del, loading: saving } = useApi<unknown>();

    const fetchTemplates = useCallback(async () => {
        const result = await get("/api/templates");
        if (result) {
            setTemplates(result.templates || []);
        }
    }, [get]);

    // Initial fetch
    useEffect(() => {
        const init = async () => {
            await fetchTemplates();
        };
        init();
    }, [fetchTemplates]);

    const saveTemplate = async (template: Partial<EmailTemplate>) => {
        let result;
        if (template.id) {
            // Update existing
            result = await patch(`/api/templates/${template.id}`, template);
        } else {
            // Create new
            result = await post("/api/templates", template);
        }

        if (result) {
            await fetchTemplates();
            return true;
        }
        return false;
    };

    const deleteTemplate = async (id: string) => {
        const result = await del(`/api/templates/${id}`);
        if (result !== null) {
            await fetchTemplates();
            return true;
        }
        return false;
    };

    return {
        templates,
        loading: fetching || saving,
        refetch: fetchTemplates,
        saveTemplate,
        deleteTemplate,
    };
}
