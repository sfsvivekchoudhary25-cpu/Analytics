import { NextRequest, NextResponse } from "next/server";
import { getFreshThumbnailUrl } from "@/lib/reel-extractor";

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="50%" stop-color="#d946ef" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)" rx="20"/>
  <circle cx="200" cy="270" r="50" fill="url(#accent)" fill-opacity="0.15" />
  <circle cx="200" cy="270" r="38" stroke="url(#accent)" stroke-width="3" fill="none" />
  <polygon points="193,254 214,270 193,286" fill="white" />
  <text x="200" y="360" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="700">Instagram Reel</text>
  <text x="200" y="385" text-anchor="middle" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="500">Tap to View or Download</text>
</svg>`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shortcode = (searchParams.get("shortcode") || "").trim();
  const directUrl = searchParams.get("url") || "";

  if (!shortcode && !directUrl) {
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // 1. If directUrl provided, try fetching it directly
  if (directUrl) {
    try {
      const res = await fetch(directUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Referer: "https://www.instagram.com/",
        },
      });

      if (res.ok && res.body) {
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        return new NextResponse(res.body as any, { status: 200, headers });
      }
    } catch (err) {
      console.warn("[Thumbnail Proxy] Direct fetch failed, attempting refresh:", err);
    }
  }

  // 2. Direct fetch failed or no directUrl: fetch fresh thumbnail URL for this shortcode
  if (shortcode) {
    try {
      const freshThumbUrl = await getFreshThumbnailUrl(shortcode);
      if (freshThumbUrl) {
        const res = await fetch(freshThumbUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            Referer: "https://www.instagram.com/",
          },
        });

        if (res.ok && res.body) {
          const contentType = res.headers.get("content-type") || "image/jpeg";
          const headers = new Headers();
          headers.set("Content-Type", contentType);
          headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
          headers.set("X-Refreshed-Thumbnail-Url", freshThumbUrl);
          return new NextResponse(res.body as any, { status: 200, headers });
        }
      }
    } catch (err) {
      console.warn("[Thumbnail Proxy] Fresh thumbnail fetch failed:", err);
    }
  }

  // 3. Fallback SVG if upstream unavailable
  return new NextResponse(FALLBACK_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

