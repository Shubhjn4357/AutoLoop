export interface AdminStats {
  totalUsers: number;
  userGrowth: number; // percentage
  activeUsers: number; // last 7 days
  totalWorkflows: number;
  systemHealth: "healthy" | "degraded" | "down";
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "user" | "admin";
  status: "active" | "inactive" | "suspended";
  lastActive: Date | null;
  createdAt: Date;
}

export interface SystemEvent {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
