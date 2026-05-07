"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const ContactsClient = dynamic(
  () => import("./contacts-client").then(mod => mod.ContactsClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }
);
