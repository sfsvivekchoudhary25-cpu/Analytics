import { NextRequest, NextResponse } from "next/server";

export interface RealInstagramProfile {
  username: string;
  displayName: string;
  profilePictureUrl: string | null;
  source: string;
  category: string;
  isKnownCustomer: boolean;
  verifiedBadge: boolean;
  profileUrl: string;
}

// In-memory cache for fast repeat searches (15 minutes TTL)
const searchCache = new Map<string, { timestamp: number; data: RealInstagramProfile[] }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().replace(/^@/, "").toLowerCase() || "";

  if (!q) {
    return NextResponse.json([]);
  }

  // Check memory cache
  const cached = searchCache.get(q);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(`https://imginn.com/search?q=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 300 }, // Cache 5 min in Next.js
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const html = await res.text();
    const itemRegex =
      /<a[^>]*class="[^"]*user-item[^"]*"[^>]*href="\/([a-zA-Z0-9._]+)\/"[\s\S]*?<div class="fullname"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div class="username"[^>]*>([\s\S]*?)<\/div>/g;
    const imgRegex = /data-src="([^"]+)"/;

    const results: RealInstagramProfile[] = [];
    const seen = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(html)) !== null) {
      const username = match[1].toLowerCase().trim();
      if (!username || seen.has(username)) continue;
      seen.add(username);

      const block = match[0];
      const fullnameRaw = match[2].replace(/<[^>]+>/g, "").trim();
      const imgMatch = block.match(imgRegex);
      const avatar = imgMatch ? imgMatch[1].replace(/&#38;/g, "&") : null;

      results.push({
        username,
        displayName: fullnameRaw || username,
        profilePictureUrl: avatar,
        source: "Live Instagram Search",
        category: "Instagram Account",
        isKnownCustomer: false,
        verifiedBadge: true,
        profileUrl: `https://instagram.com/${username}`,
      });
    }

    // If exact match isn't present in top results, prepend it
    if (!seen.has(q) && /^[a-z0-9._]{1,30}$/.test(q)) {
      const baseName = q.charAt(0).toUpperCase() + q.slice(1);
      results.unshift({
        username: q,
        displayName: baseName,
        profilePictureUrl: null,
        source: "Exact Match",
        category: "Instagram Account",
        isKnownCustomer: false,
        verifiedBadge: false,
        profileUrl: `https://instagram.com/${q}`,
      });
    }

    searchCache.set(q, { timestamp: Date.now(), data: results });
    return NextResponse.json(results);
  } catch (err: any) {
    console.error("Live Instagram search error:", err?.message);
    return NextResponse.json([]);
  }
}
