import { NextRequest, NextResponse } from "next/server";
import { getFreshVideoUrl, getFreshThumbnailUrl } from "@/lib/reel-extractor";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let mediaUrl = searchParams.get("url") || "";
  const shortcode = (searchParams.get("shortcode") || "").trim();
  const rawFilename = searchParams.get("filename") || (searchParams.get("type") === "image" ? "cover.jpg" : "instagram-reel.mp4");
  const type = searchParams.get("type") || (rawFilename.endsWith(".jpg") ? "image" : "video");

  // Ensure safe filename
  const safeFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Helper to attempt stream fetch
  const attemptFetch = async (targetUrl: string) => {
    try {
      const upstreamRes = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Referer: "https://www.instagram.com/",
        },
      });
      if (upstreamRes.ok && upstreamRes.body) {
        return upstreamRes;
      }
    } catch {}
    return null;
  };

  let upstreamRes: Response | null = null;

  // 1. Try provided mediaUrl if present
  if (mediaUrl) {
    upstreamRes = await attemptFetch(mediaUrl);
  }

  // 2. If direct fetch failed or URL was expired/missing, auto-refresh via shortcode
  if (!upstreamRes && shortcode) {
    try {
      if (type === "video") {
        const freshVideoUrl = await getFreshVideoUrl(shortcode);
        if (freshVideoUrl) {
          mediaUrl = freshVideoUrl;
          upstreamRes = await attemptFetch(freshVideoUrl);
        }
      } else {
        const freshThumbUrl = await getFreshThumbnailUrl(shortcode);
        if (freshThumbUrl) {
          mediaUrl = freshThumbUrl;
          upstreamRes = await attemptFetch(freshThumbUrl);
        }
      }
    } catch (err) {
      console.warn("[Download Proxy] Failed to auto-refresh media via shortcode:", err);
    }
  }

  if (!upstreamRes || !upstreamRes.body) {
    return NextResponse.json(
      { error: "Could not download media. The source reel may be private or unavailable." },
      { status: 502 }
    );
  }

  const contentType =
    upstreamRes.headers.get("content-type") || (type === "video" ? "video/mp4" : "image/jpeg");
  const contentLength = upstreamRes.headers.get("content-length");

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Disposition", `attachment; filename="${safeFilename}"`);
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }
  headers.set("Cache-Control", "public, max-age=86400");

  return new NextResponse(upstreamRes.body as any, {
    status: 200,
    headers,
  });
}
