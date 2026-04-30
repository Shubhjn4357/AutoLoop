"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const errorMessages: Record<string, string> = {
  internal_auth_error: "Meta connection failed. Check app credentials and permissions.",
  invalid_automation: "Automation data was incomplete or not found.",
  no_ig_business_found: "No Instagram Business account was found on that Meta account.",
  oauth_failed: "Meta authorization was cancelled or rejected.",
  missing_meta_config: "Meta app credentials are missing.",
};

export function QueryToast() {
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("success")) {
      toast.success("Instagram account connected.");
    }

    if (searchParams.get("created")) {
      toast.success("Automation saved.");
    }

    if (searchParams.get("updated")) {
      toast.success("Automation updated.");
    }

    if (searchParams.get("deleted")) {
      toast.success("Automation deleted.");
    }

    if (searchParams.get("disconnected")) {
      toast.success("Instagram account disconnected.");
    }

    const error = searchParams.get("error");
    if (error) {
      toast.error(errorMessages[error] ?? "Request failed.");
    }
  }, [searchParams]);

  return null;
}
