"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Building2, Mail, Workflow, FileText } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";

interface SearchResult {
    type: 'business' | 'template' | 'workflow';
    id: string;
    title: string;
    subtitle: string;
    url: string;
}

export function GlobalSearch() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const debouncedQuery = useDebounce(query, 300);
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const { get, loading } = useApi<{ results: SearchResult[] }>();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    React.useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            const data = await get(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
            if (data && data.results) {
                setResults(data.results);
            }
        };

        fetchResults();
    }, [debouncedQuery, get]);

    const handleSelect = (url: string) => {
        setOpen(false);
        router.push(url);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'business': return <Building2 className="mr-2 h-4 w-4" />;
            case 'template': return <Mail className="mr-2 h-4 w-4" />;
            case 'workflow': return <Workflow className="mr-2 h-4 w-4" />;
            default: return <FileText className="mr-2 h-4 w-4" />;
        }
    };

    return (
        <>
            <Button
                variant="outline"
                className={cn(
                    "relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
                )}
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-4 overflow-hidden shadow-2xl">
                    <DialogTitle className="sr-only">Global Search</DialogTitle>
                    <Command className="**:[cmdk-group-heading]:px-4 **:[cmdk-group-heading]:font-medium **:[cmdk-group-heading]:text-muted-foreground **:[cmdk-group]:not([hidden])_~[cmdk-group]:pt-0 **:[cmdk-group]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 **:[cmdk-input]:h-12 **:[cmdk-item]:px-2 **:[cmdk-item]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                        <CommandInput
                            placeholder="Type to search..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : query.length > 0 && query.length < 2 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        Type at least 2 characters...
                                    </div>
                                ) : (
                                    "No results found."
                                )}
                            </CommandEmpty>

                            {results.length > 0 && (
                                <CommandGroup heading="Results">
                                    {results.map((result) => (
                                        <CommandItem
                                            key={`${result.type}-${result.id}`}
                                            onSelect={() => handleSelect(result.url)}
                                            className="cursor-pointer"
                                        >
                                            {getIcon(result.type)}
                                            <span>{result.title}</span>
                                            {result.subtitle && (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    - {result.subtitle}
                                                </span>
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>
        </>
    );
}
