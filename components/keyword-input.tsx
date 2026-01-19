"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_TYPES } from "@/lib/constants/business-types";

interface KeywordInputProps {
  businessTypeId?: string;
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
}

export function KeywordInput({
  businessTypeId,
  value,
  onChange,
  placeholder = "Add keywords...",
}: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (!businessTypeId) return [];

    const businessType = BUSINESS_TYPES.find((type) => type.id === businessTypeId);
    if (!businessType) return [];

    // Filter out already selected keywords
    return businessType.keywords.filter(
      (keyword) => !value.includes(keyword) &&
        keyword.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [businessTypeId, value, inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
      setShowSuggestions(false);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const addKeyword = (keyword: string) => {
    if (!value.includes(keyword)) {
      onChange([...value, keyword]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeKeyword = (keyword: string) => {
    onChange(value.filter((k) => k !== keyword));
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((keyword) => (
          <Badge
            key={keyword}
            variant="default"
            className="gap-1 cursor-pointer"
          >
            {keyword}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => removeKeyword(keyword)}
            />
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 p-2 bg-popover border rounded-md shadow-lg">
          <div className="text-xs text-muted-foreground mb-2">Suggestions:</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 8).map((suggestion) => (
              <Badge
                key={suggestion}
                variant="default"
                className="cursor-pointer hover:bg-accent"
                onClick={() => addKeyword(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
