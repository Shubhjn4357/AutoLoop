"use client";

import dynamic from "next/dynamic";

export const NotificationsContent = dynamic(
  () => import("./notifications-content").then(mod => mod.NotificationsContent),
  { ssr: false }
);
