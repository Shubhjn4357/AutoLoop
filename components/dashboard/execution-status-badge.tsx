import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, PlayCircle } from "lucide-react";

type Status = "pending" | "running" | "success" | "failed";

interface ExecutionStatusBadgeProps {
  status: string;
}

export function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as Status;

  switch (normalizedStatus) {
    case "success":
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    case "running":
      return (
        <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600 gap-1 animate-pulse">
          <PlayCircle className="h-3 w-3" />
          Running
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {status}
        </Badge>
      );
  }
}
