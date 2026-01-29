import crypto from "crypto";
import { cookies } from "next/headers";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get("csrf-token")?.value;
  return storedToken === token;
}
