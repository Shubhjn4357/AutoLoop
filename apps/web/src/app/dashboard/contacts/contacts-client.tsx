"use client";

import { useState } from "react";
import { formatDistanceToNowSimple } from "@/lib/date-utils";
import { serverFetch } from "@/lib/api-client";

import { Search, Users, UserPlus, User, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { contacts } from "@/lib/db/schema";
import { ContactImportModal } from "@/components/contacts/contact-import-modal";
import type { IGUserProfile } from "@autoloop/types";


type Contact = typeof contacts.$inferSelect & { tags: string[] };

interface Props {
  contacts: Contact[];
  userId: string;
}

export function ContactsClient({ contacts, userId }: Props) {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [addingTagContactId, setAddingTagContactId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [localContacts, setLocalContacts] = useState(contacts);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const allTags = Array.from(
    new Set(localContacts.flatMap((c) => c.tags))
  ).sort();

  const filtered = localContacts.filter((c) => {
    const matchesSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.senderId.includes(search);
    const matchesTag = !tagFilter || c.tags.includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  async function addTag(contactId: string) {
    if (!newTag.trim()) return;
    try {
      const res = await serverFetch("/api/contacts/tags", userId, {
        method: "POST",
        body: JSON.stringify({ contactId, tag: newTag.trim() }),
      });
      if (res.ok) {
        setLocalContacts((prev) =>
          prev.map((c) =>
            c.id === contactId
              ? { ...c, tags: [...c.tags, newTag.trim()] }
              : c
          )
        );
        setNewTag("");
        setAddingTagContactId(null);
      }
    } catch (err) {
      console.error("Failed to add tag:", err);
    }
  }

  async function removeTag(contactId: string, tag: string) {
    try {
      const res = await serverFetch("/api/contacts/tags", userId, {
        method: "DELETE",
        body: JSON.stringify({ contactId, tag }),
      });
      if (res.ok) {
        setLocalContacts((prev) =>
          prev.map((c) =>
            c.id === contactId
              ? { ...c, tags: c.tags.filter((t) => t !== tag) }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to remove tag:", err);
    }
  }

  const handleImportUsers = async (users: IGUserProfile[]) => {
    try {
      const res = await serverFetch("/api/contacts/import", userId, {
        method: "POST",
        body: JSON.stringify({ users }),
      });

      if (!res.ok) {
        throw new Error("Import failed");
      }

      const { imported } = await res.json();

      setLocalContacts((prev) => [...imported, ...prev]);
    } catch (err) {
      console.error("Failed to import contacts:", err);
    }
  };

  return (
    <div className="space-y-4">
      <ContactImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportUsers}
      />

      {/* Search + Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Button onClick={() => setImportModalOpen(true)} className="gap-2">
            <UserPlus className="size-4" />
            Import
          </Button>
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={tagFilter === null ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setTagFilter(null)}
            >
              All
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={tagFilter === tag ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 text-center">
          <Users className="size-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{localContacts.length}</p>
          <p className="text-xs text-muted-foreground">Total Contacts</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">
            {localContacts.filter((c) => c.isFollower).length}
          </p>
          <p className="text-xs text-muted-foreground">Followers</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">
            {localContacts.filter((c) => c.status === "human_needed").length}
          </p>
          <p className="text-xs text-muted-foreground">Needs Human</p>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card/30">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="size-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No contacts found.</p>
            <p className="text-xs mt-1">Contacts appear when someone messages your Instagram.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tags</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Seen</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          {contact.profilePic ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={contact.profilePic} alt="" className="size-9 rounded-full object-cover" />
                          ) : (
                            <User className="size-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{contact.name ?? contact.username ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{contact.senderId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium",
                          contact.status === "automated"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : contact.status === "human_needed"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {contact.status === "automated" ? "Automated" : "Human Needed"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {contact.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] cursor-pointer hover:bg-rose-500/10 hover:text-rose-500"
                            onClick={() => removeTag(contact.id, tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {addingTagContactId === contact.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addTag(contact.id)}
                              placeholder="Tag..."
                              className="h-6 w-24 text-xs py-0"
                              autoFocus
                            />
                            <Button size="icon" className="h-6 w-6" onClick={() => addTag(contact.id)}>
                              <Tag className="size-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-muted-foreground"
                            onClick={() => setAddingTagContactId(contact.id)}
                          >
                            + Tag
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDistanceToNowSimple(new Date(contact.lastSeenAt))}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {contact.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
