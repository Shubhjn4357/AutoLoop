"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InfoBannerProps {
    message: string;
    id: string;
}

export function InfoBanner({ message, id }: InfoBannerProps) {
    const [isVisible, setIsVisible] = useState(false); // Default hidden to avoid flash
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Delay check slightly to allow mount and avoid synchronous update warning
        // This also ensures we are safely on the client
        const timer = setTimeout(() => {
            const dismissed = localStorage.getItem(`banner-dismissed-${id}`);
            if (!dismissed) {
                setIsVisible(true);
            }
            setShouldRender(true);
        }, 0);
        return () => clearTimeout(timer);
    }, [id]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(`banner-dismissed-${id}`, "true");
    };

    if (!shouldRender || !isVisible) return null;

    return (
        <div className="bg-primary/10 text-primary px-4 py-2 relative flex items-center overflow-hidden border-b border-primary/20">
            <div className="flex-1 overflow-hidden whitespace-nowrap">
                <div className="animate-marquee inline-block whitespace-nowrap">
                    <span className="mr-8 font-medium">{message}</span>
                    <span className="mr-8 font-medium">{message}</span>
                    <span className="mr-8 font-medium">{message}</span>
                    <span className="mr-8 font-medium">{message}</span>
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-2 hover:bg-primary/20 absolute right-2 z-10"
                onClick={handleDismiss}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
