import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const faviconPath = join(process.cwd(), "src", "app", "favicon.ico");
    const favicon = readFileSync(faviconPath);
    
    return new NextResponse(favicon, {
      headers: {
        "Content-Type": "image/x-icon",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Fallback to 404 if file not found
    return new NextResponse(null, { status: 404 });
  }
}

