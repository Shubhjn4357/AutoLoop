import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  if (id) {
    try {
      // Update click status
      // Also mark as opened if not already (since they clicked it)
      await db.transaction(async (tx) => {
        await tx
          .update(emailLogs)
          .set({
            status: "clicked",
            clickedAt: new Date(),
          })
          .where(eq(emailLogs.id, id));

        // Optional: Ensure openedAt is set if it was missed
        /* 
        // Logic to check if openedAt is null is complex in one query with drizzle sometimes.
        // Simpler to just update status to clicked. Applications usually check "clicked" implies "opened".
        */
      });

    } catch (error) {
      console.error("Failed to track click:", error);
    }
  }

  return NextResponse.redirect(url);
};
