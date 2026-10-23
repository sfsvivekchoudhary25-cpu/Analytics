import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mediaUrl = searchParams.get("url") || "";
  const rawFilename = searchParams.get("filename") || "instagram-reel.mp4";
  const type = searchParams.get("type") || "video";

  if (!mediaUrl) {
    return NextResponse.json({ error: "Missing media url" }, { status: 400 });
  }

  // Ensure safe filename
  const safeFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

  try {
    const upstreamRes = await fetch(mediaUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return NextResponse.json(
        { error: `Upstream media server responded with ${upstreamRes.status}` },
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
  } catch (err: any) {
    console.error("Media download proxy error:", err?.message);
    return NextResponse.json(
      { error: "Failed to download media stream." },
      { status: 500 }
    );
  }
}
