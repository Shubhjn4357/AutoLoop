import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    // Fire and forget update (don't await to speed up response)
    const updatePromise = db
      .update(emailLogs)
      .set({
        status: "opened",
        openedAt: new Date(),
      })
      .where(eq(emailLogs.id, id))
      .catch((err) => console.error("Failed to track open:", err));
      
      // We can await if we want to be sure, but for a pixel, speed is key. 
      // However, serverless functions might terminate. Safest to await.
      await updatePromise;
  }

  // 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
};
