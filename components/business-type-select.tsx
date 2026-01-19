"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BUSINESS_TYPES,
  BUSINESS_CATEGORIES,
  getBusinessTypesByCategory,
  getPopularBusinessTypes,
} from "@/lib/constants/business-types";

interface BusinessTypeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export function BusinessTypeSelect({ value, onValueChange }: BusinessTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedType = useMemo(
    () => BUSINESS_TYPES.find((type) => type.id === value),
    [value]
  );

  const popularTypes = getPopularBusinessTypes();

  const filteredCategories = useMemo(() => {
    if (!searchQuery) {
      return BUSINESS_CATEGORIES.map((category) => ({
        category,
        types: getBusinessTypesByCategory(category),
      }));
    }

    const query = searchQuery.toLowerCase();
    return BUSINESS_CATEGORIES.map((category) => ({
      category,
      types: getBusinessTypesByCategory(category).filter(
        (type) =>
          type.name.toLowerCase().includes(query) ||
          type.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      ),
    })).filter((group) => group.types.length > 0);
  }, [searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between cursor-pointer"
        >
          {selectedType ? selectedType.name : "Select business type..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search business types..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {!searchQuery && popularTypes.length > 0 && (
              <div className="px-2 py-1.5">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Popular
                </div>
                {popularTypes.map((type) => (
                  <div
                    key={type.id}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      value === type.id && "bg-accent"
                    )}
                    onClick={() => {
                      onValueChange(type.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === type.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{type.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="my-1 h-px bg-border" />
              </div>
            )}
            {filteredCategories.map((group) => (
              <div key={group.category} className="px-2 py-1.5">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {group.category}
                </div>
                {group.types.map((type) => (
                  <div
                    key={type.id}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      value === type.id && "bg-accent"
                    )}
                    onClick={() => {
                      onValueChange(type.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === type.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{type.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No business types found.
              </div>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
