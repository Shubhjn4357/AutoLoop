"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter} from "lucide-react";
import { BUSINESS_CATEGORIES } from "@/lib/constants/business-types";

interface FilterConfig {
    minRating?: number;
    maxRating?: number;
    locationRadius?: number;
    latitude?: number;
    longitude?: number;
    industries?: string[];
    minSize?: number;
    maxSize?: number;
    hasWebsite?: boolean;
    hasPhone?: boolean;
    hasEmail?: boolean;
}

interface FilterBuilderProps {
    value?: FilterConfig;
    onChange?: (config: FilterConfig) => void;
    onApply?: (config: FilterConfig) => void;
}

export function FilterBuilder({ value = {}, onChange, onApply }: FilterBuilderProps) {
    const [config, setConfig] = useState<FilterConfig>(value);
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>(value.industries || []);
    const [isOpen, setIsOpen] = useState(false);

    const handleConfigChange = (updates: Partial<FilterConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        onChange?.(newConfig);
    };

    const handleApply = () => {
        const finalConfig = { ...config, industries: selectedIndustries };
        setConfig(finalConfig);
        onApply?.(finalConfig);
        setIsOpen(false);
    };

    const toggleIndustry = (industry: string) => {
        const newIndustries = selectedIndustries.includes(industry)
            ? selectedIndustries.filter((i) => i !== industry)
            : [...selectedIndustries, industry];
        setSelectedIndustries(newIndustries);
    };

    const getFilterSummary = () => {
        const parts: string[] = [];
        if (config.minRating) parts.push(`Rating ≥ ${config.minRating}`);
        if (config.maxRating) parts.push(`Rating ≤ ${config.maxRating}`);
        if (selectedIndustries.length > 0)
            parts.push(`Industries: ${selectedIndustries.length}`);
        if (config.minSize) parts.push(`Min ${config.minSize} reviews`);
        if (config.maxSize) parts.push(`Max ${config.maxSize} reviews`);
        if (config.hasWebsite) parts.push("Has Website");
        if (config.hasPhone) parts.push("Has Phone");
        if (config.hasEmail) parts.push("Has Email");
        if (config.locationRadius) parts.push(`Radius: ${config.locationRadius} miles`);

        return parts.length > 0 ? parts.join(" • ") : "No filters applied";
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Configure Filters
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Advanced Business Filtering</DialogTitle>
                    <DialogDescription>
                        Filter your businesses by rating, location, industry, size, and contact information
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Rating Filter */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Rating Range</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Minimum Rating (0-5)</Label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[config.minRating || 0]}
                                        onValueChange={([val]) => handleConfigChange({ minRating: val })}
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        value={config.minRating || ""}
                                        onChange={(e) =>
                                            handleConfigChange({
                                                minRating: e.target.value ? Number(e.target.value) : undefined,
                                            })
                                        }
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        className="w-20 h-8"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Maximum Rating (0-5)</Label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[config.maxRating || 5]}
                                        onValueChange={([val]) => handleConfigChange({ maxRating: val })}
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        value={config.maxRating || ""}
                                        onChange={(e) =>
                                            handleConfigChange({
                                                maxRating: e.target.value ? Number(e.target.value) : undefined,
                                            })
                                        }
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        className="w-20 h-8"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Industry Filter */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Industries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                {BUSINESS_CATEGORIES.map((category) => (
                                    <div key={category} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={category}
                                            checked={selectedIndustries.includes(category)}
                                            onCheckedChange={() => toggleIndustry(category)}
                                        />
                                        <Label htmlFor={category} className="text-xs cursor-pointer">
                                            {category}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Business Size Filter */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Business Size (by reviews)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Minimum Reviews</Label>
                                <Input
                                    type="number"
                                    value={config.minSize || ""}
                                    onChange={(e) =>
                                        handleConfigChange({
                                            minSize: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                    }
                                    min={0}
                                    placeholder="0"
                                    className="h-8"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Maximum Reviews</Label>
                                <Input
                                    type="number"
                                    value={config.maxSize || ""}
                                    onChange={(e) =>
                                        handleConfigChange({
                                            maxSize: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                    }
                                    min={0}
                                    placeholder="No limit"
                                    className="h-8"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information Filter */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hasWebsite"
                                    checked={config.hasWebsite || false}
                                    onCheckedChange={(checked) =>
                                        handleConfigChange({ hasWebsite: checked as boolean })
                                    }
                                />
                                <Label htmlFor="hasWebsite" className="text-xs cursor-pointer">
                                    Must have website
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hasPhone"
                                    checked={config.hasPhone || false}
                                    onCheckedChange={(checked) =>
                                        handleConfigChange({ hasPhone: checked as boolean })
                                    }
                                />
                                <Label htmlFor="hasPhone" className="text-xs cursor-pointer">
                                    Must have phone number
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hasEmail"
                                    checked={config.hasEmail || false}
                                    onCheckedChange={(checked) =>
                                        handleConfigChange({ hasEmail: checked as boolean })
                                    }
                                />
                                <Label htmlFor="hasEmail" className="text-xs cursor-pointer">
                                    Must have email
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Filter */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Location Radius</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Radius (miles)</Label>
                                <Input
                                    type="number"
                                    value={config.locationRadius || ""}
                                    onChange={(e) =>
                                        handleConfigChange({
                                            locationRadius: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                    }
                                    min={0}
                                    placeholder="Leave empty for no location filtering"
                                    className="h-8"
                                />
                            </div>

                            {config.locationRadius && (
                                <div className="space-y-2 pt-2 border-t">
                                    <Label className="text-xs">Center Coordinates</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Latitude</Label>
                                            <Input
                                                type="number"
                                                value={config.latitude || ""}
                                                onChange={(e) =>
                                                    handleConfigChange({
                                                        latitude: e.target.value ? Number(e.target.value) : undefined,
                                                    })
                                                }
                                                placeholder="e.g., 40.7128"
                                                className="h-8"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Longitude</Label>
                                            <Input
                                                type="number"
                                                value={config.longitude || ""}
                                                onChange={(e) =>
                                                    handleConfigChange({
                                                        longitude: e.target.value ? Number(e.target.value) : undefined,
                                                    })
                                                }
                                                placeholder="e.g., -74.0060"
                                                className="h-8"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Filter Summary */}
                    <Card className="bg-muted/50 border">
                        <CardContent className="pt-4">
                            <p className="text-xs font-medium mb-2">Active Filters:</p>
                            <div className="flex flex-wrap gap-2">
                                {getFilterSummary() === "No filters applied" ? (
                                    <p className="text-xs text-muted-foreground">{getFilterSummary()}</p>
                                ) : (
                                    getFilterSummary()
                                        .split(" • ")
                                        .map((part, i) => (
                                            <Badge key={i} variant="secondary">
                                                {part}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply}>Apply Filters</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
