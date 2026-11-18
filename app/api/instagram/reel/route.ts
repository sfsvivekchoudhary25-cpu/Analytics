import { NextRequest, NextResponse } from "next/server";
import {
  ReelInfo,
  extractShortcode,
  resolveReelData,
} from "@/lib/reel-extractor";

export type { ReelInfo };
export { extractShortcode };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = (body.url || "").trim();

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: "Please enter an Instagram Reel or post URL." },
        { status: 400 }
      );
    }

    const shortcode = extractShortcode(rawUrl);
    if (!shortcode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Instagram link. Please paste a valid Reel link (e.g., https://www.instagram.com/reel/...).",
        },
        { status: 400 }
      );
    }

    const reelData = await resolveReelData(shortcode);

    if (reelData && (reelData.videoUrl || reelData.thumbnail)) {
      return NextResponse.json({ success: true, data: reelData });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "This Instagram Reel is unavailable, private, or has been removed. Please verify that the Reel is accessible publicly on Instagram.",
      },
      { status: 404 }
    );
  } catch (err: any) {
    console.error("Reel processing error:", err?.message);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while processing the Reel." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get("url") || "";
  if (!urlParam) {
    return NextResponse.json(
      { success: false, error: "Missing 'url' query parameter." },
      { status: 400 }
    );
  }

  const syntheticReq = new NextRequest(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: urlParam }),
  });
  return POST(syntheticReq);
}
