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

  // Forward client range request for seamless video seeking and Safari download support
  const clientRange = request.headers.get("range");

  // Helper to attempt stream fetch
  const attemptFetch = async (targetUrl: string) => {
    try {
      const headers: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
      };
      if (clientRange) {
        headers["Range"] = clientRange;
      }

      const upstreamRes = await fetch(targetUrl, { headers });
      if ((upstreamRes.ok || upstreamRes.status === 206) && upstreamRes.body) {
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
    if (shortcode) {
      // Graceful fallback: redirect to the reel directly rather than downloading a broken .mp4.json error file
      return NextResponse.redirect(`https://www.instagram.com/reel/${shortcode}/`, 307);
    }
    return new NextResponse("The requested Instagram reel media is private or unavailable.", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const contentType =
    type === "video"
      ? "video/mp4"
      : upstreamRes.headers.get("content-type") || "image/jpeg";
  const contentLength = upstreamRes.headers.get("content-length");
  const contentRange = upstreamRes.headers.get("content-range");
  const status = upstreamRes.status === 206 ? 206 : 200;

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set(
    "Content-Disposition",
    `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
  );
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }
  if (contentRange) {
    headers.set("Content-Range", contentRange);
  }
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type");

  return new NextResponse(upstreamRes.body as any, {
    status,
    headers,
  });
}

export async function HEAD(request: NextRequest) {
  const res = await GET(request);
  return new NextResponse(null, {
    status: res.status,
    headers: res.headers,
  });
}
