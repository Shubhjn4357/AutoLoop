"use client";

import { useEffect, useState } from "react";
import { X, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function SupportPopup() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenPopup = localStorage.getItem("hasSeenSupportPopup");
        const lastShown = localStorage.getItem("lastSupportPopupShown");
        const now = Date.now();

        // Show if never seen or if it's been more than 7 days
        if (!hasSeenPopup || (lastShown && now - parseInt(lastShown) > 7 * 24 * 60 * 60 * 1000)) {
            setTimeout(() => setIsVisible(true), 3000); // Show after 3 seconds
        }
    }, []);

    const handleClose = (dontShowAgain?: boolean) => {
        setIsVisible(false);
        if (dontShowAgain) {
            localStorage.setItem("hasSeenSupportPopup", "true");
        }
        localStorage.setItem("lastSupportPopupShown", Date.now().toString());
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full animate-in zoom-in-95 shadow-2xl">
                <CardHeader className="relative">
                    <button
                        onClick={() => handleClose()}
                        className="absolute top-4 right-4 rounded-full p-1 hover:bg-accent cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Coffee className="h-6 w-6 text-yellow-600" />
                        <CardTitle>Support AutoLoop</CardTitle>
                    </div>
                    <CardDescription>
                        Help us keep this platform running and improving
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        AutoLoop is built with ❤️ to help you automate your outreach. Your support helps us:
                    </p>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>✅ Keep servers running 24/7</li>
                        <li>✅ Add new features regularly</li>
                        <li>✅ Provide free updates</li>
                        <li>✅ Maintain and improve the platform</li>
                    </ul>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                window.open("https://buymeacoffee.com/autoloop", "_blank");
                                handleClose(true);
                            }}
                            className="flex-1 cursor-pointer bg-yellow-600 hover:bg-yellow-700"
                        >
                            <Coffee className="mr-2 h-4 w-4" />
                            Buy Me a Coffee
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleClose()}
                            className="cursor-pointer"
                        >
                            Maybe Later
                        </Button>
                    </div>
                    <button
                        onClick={() => handleClose(true)}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        Don&apos;t show this again
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}
