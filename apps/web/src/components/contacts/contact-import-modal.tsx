"use client";

import { useState } from "react";
import { Upload, Search, UserPlus, AtSign, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { IGUserProfile } from "@autoloop/types";
import { serverFetch } from "@/lib/api-client";

import { useDashboardContext } from "../dashboard/dashboard-context";


interface ImportResult {
  username: string;
  found: boolean;
  data?: IGUserProfile;
  error?: string;
}

interface ContactImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (users: IGUserProfile[]) => void;
}

export function ContactImportModal({ open, onClose, onImport }: ContactImportModalProps) {
  const { userId } = useDashboardContext();
  const [activeTab, setActiveTab] = useState("search");

  const [usernames, setUsernames] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    const usernameList = usernames
      .split(/[\n,;]/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (usernameList.length === 0) {
      toast.error("Please enter at least one username");
      return;
    }

    setLoading(true);
    try {
      const res = await serverFetch("/api/instagram/find-users", userId, {
        method: "POST",
        body: JSON.stringify({ usernames: usernameList }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Search failed");
        return;
      }

      setResults(data.results);

      const found = data.results.filter((r: ImportResult) => r.found);
      if (found.length > 0) {
        toast.success(`Found ${found.length} users on Instagram`);
      }
      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} users not found`);
      }
    } catch {
      toast.error("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    const usersToImport = results
      ?.filter((r) => r.found && selectedUsers.has(r.username))
      .map((r) => r.data!);

    if (!usersToImport || usersToImport.length === 0) {
      toast.error("Please select users to import");
      return;
    }

    onImport(usersToImport);
    toast.success(`Imported ${usersToImport.length} contacts`);
    handleClose();
  };

  const handleClose = () => {
    setUsernames("");
    setResults(null);
    setSelectedUsers(new Set());
    setActiveTab("search");
    onClose();
  };

  const toggleUser = (username: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    const found = results?.filter((r) => r.found).map((r) => r.username) || [];
    setSelectedUsers(new Set(found));
  };

  const deselectAll = () => {
    setSelectedUsers(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Import Contacts
          </DialogTitle>
          <DialogDescription>
            Search and import Instagram users to your contact list
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="gap-2">
              <Search className="size-4" />
              Search by Username
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="size-4" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="flex-1 flex flex-col min-h-0 mt-4">
            {!results ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instagram Usernames</label>
                  <textarea
                    value={usernames}
                    onChange={(e) => setUsernames(e.target.value)}
                    placeholder="Enter usernames (one per line or comma-separated)&#10;e.g.:&#10;zuck&#10;instagram&#10;shubh._jn"
                    className="w-full h-32 p-3 rounded-xl border border-border bg-background resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum 50 usernames per search
                  </p>
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={loading || !usernames.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Searching Instagram...
                    </>
                  ) : (
                    <>
                      <AtSign className="size-4 mr-2" />
                      Search Instagram
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    {results.filter((r) => r.found).length} of {results.length} found
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {results.map((result) => (
                    <div
                      key={result.username}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${result.found
                          ? selectedUsers.has(result.username)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                          : "border-border/50 bg-muted/30 opacity-60"
                        }`}
                      onClick={() => result.found && toggleUser(result.username)}
                    >
                      {result.found ? (
                        <>
                          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            {result.data?.profile_picture_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={result.data.profile_picture_url}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <AtSign className="size-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              @{result.data?.username || result.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.data?.followers_count?.toLocaleString()} followers
                            </p>
                          </div>
                          <CheckCircle2
                            className={`size-5 ${selectedUsers.has(result.username)
                                ? "text-primary"
                                : "text-muted-foreground/30"
                              }`}
                          />
                        </>
                      ) : (
                        <>
                          <div className="size-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="size-5 text-rose-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-muted-foreground">
                              @{result.username}
                            </p>
                            <p className="text-xs text-rose-500">Not found</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setResults(null)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={selectedUsers.size === 0}
                    className="flex-1"
                  >
                    Import {selectedUsers.size} Contacts
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center space-y-4">
              <Upload className="size-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">Upload CSV or TXT file</p>
                <p className="text-sm text-muted-foreground mt-1">
                  File should contain one Instagram username per line
                </p>
              </div>
              <Input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      setUsernames(text);
                      setActiveTab("search");
                      toast.success("File loaded. Click Search to find users.");
                    };
                    reader.readAsText(file);
                  }
                }}
              />
              <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                Select File
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
