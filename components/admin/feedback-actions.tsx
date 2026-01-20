"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FeedbackActionsProps {
    id: string;
    status: string;
}

export function FeedbackActions({ id, status }: FeedbackActionsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (status === "resolved") return null;

    const handleResolve = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/feedback", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: "resolved" }),
            });

            if (!res.ok) throw new Error("Failed");

            toast.success("Marked as resolved");
            router.refresh();
        } catch {
            toast.error("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handleResolve}
            disabled={loading}
            className="h-8"
        >
            {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
            )}
            Resolve
        </Button>
    );
}
