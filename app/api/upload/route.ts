import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public/uploads");
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // Ignore if exists
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${nanoid()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: publicUrl, filename: file.name });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
