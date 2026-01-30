"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AdminUser } from "@/types/admin";
import { MoreHorizontal, Search, UserCog, Ban, CheckCircle } from "lucide-react";

interface UserManagementTableProps {
  users: AdminUser[];
  onUpdateStatus: (userId: string, newStatus: "active" | "suspended") => void;
  onUpdateRole: (userId: string, newRole: "user" | "admin") => void;
}

export function UserManagementTable({
  users,
  onUpdateStatus,
  onUpdateRole,
}: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback>
                          {user.name?.slice(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`capitalize ${getStatusColor(user.status)}`}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.lastActive
                      ? new Date(user.lastActive).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            onUpdateRole(
                              user.id,
                              user.role === "admin" ? "user" : "admin"
                            )
                          }
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          {user.role === "admin"
                            ? "Remove Admin"
                            : "Make Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "suspended" ? (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(user.id, "active")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate Account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(user.id, "suspended")}
                            className="text-red-600"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend Account
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
