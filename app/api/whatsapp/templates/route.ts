import { NextResponse } from "next/server";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
// const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_PHONE_ID; // unused
// However, the Graph API for templates is usually: GET /{whatsapp-business-account-id}/message_templates
// Let's assume PHONE_ID might be WABA ID or we need WABA ID env var. 
// For now, let's try using the PHONE_ID's parent WABA if possible, or just assume the user provides the correct ID.
// Actually, Env var says WHATSAPP_PHONE_ID. We likely need WHATSAPP_BUSINESS_ACCOUNT_ID (WABA) for templates.
// Let's assume there is a WHATSAPP_BUSINESS_ACCOUNT_ID env var or we try to use the Phone ID (which might fail if it's not the WABA).
// Best practice: Fetch WABA from Phone ID? Or just use env var.
// STARTUP: We check for WHATSAPP_BUSINESS_ID or fall back to a placeholder.

// We will assume the user has a WHATSAPP_BUSINESS_ID env var for now.
const WABA_ID = process.env.WHATSAPP_BUSINESS_ID;

export async function GET() {
  if (!WHATSAPP_ACCESS_TOKEN || !WABA_ID) {
    if (!WABA_ID) console.warn("Missing WHATSAPP_BUSINESS_ID env var for templates");
    return NextResponse.json({ templates: [] }); // Return empty if not configured
  }

  try {
    // Fetch templates from Meta Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WABA_ID}/message_templates?status=APPROVED&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error fetching templates:", errorBody);
      return NextResponse.json({ templates: [] }, { status: 500 });
    }

    const data = await response.json();

    // Transform to simple format with safe typing
    const templates = (Array.isArray(data?.data) ? data.data : []).map((t: unknown) => {
      const tt = t as { name?: string; language?: string; status?: string };
      return {
        id: tt.name || "",
        name: tt.name || "",
        language: tt.language || "",
        status: tt.status || "unknown",
      };
    });

    return NextResponse.json({ templates });
  } catch (error: unknown) {
    console.error("Template Fetch Error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ templates: [] }, { status: 500 });
  }
}
