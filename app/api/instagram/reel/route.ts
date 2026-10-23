import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface ReelInfo {
  id: string;
  shortcode: string;
  url: string;
  videoUrl: string | null;
  thumbnail: string | null;
  caption: string;
  author: string;
  authorName: string;
  authorUrl: string;
  likes: number;
  comments: number;
  views: number;
  duration: number | null;
  uploadDate: string | null;
  timestamp: number | null;
  embedHtml?: string;
}

// In-memory cache for fast repeat reel lookups (10 minutes)
const reelCache = new Map<string, { timestamp: number; data: ReelInfo }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export function extractShortcode(inputUrl: string): string | null {
  if (!inputUrl) return null;
  const match = inputUrl.match(/(?:instagram\.com\/(?:p|reel|reels|tv)\/|instagr\.am\/(?:p|reel|reels|tv)\/)([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

// Fallback: fetch official Instagram oEmbed + OpenGraph meta tags
async function fetchOEmbedFallback(shortcode: string, originalUrl: string): Promise<Partial<ReelInfo>> {
  const permalink = `https://www.instagram.com/reel/${shortcode}/`;
  let title = "";
  let author = "";
  let authorUrl = `https://www.instagram.com/${author}`;
  let thumbnail = null;
  let embedHtml = "";
  let likes = 0;
  let comments = 0;
  let uploadDate = null;

  try {
    const oembedRes = await fetch(
      `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(permalink)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 300 },
      }
    );

    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      title = oembed.title || "";
      author = oembed.author_name || "";
      authorUrl = oembed.author_url || `https://www.instagram.com/${author}`;
      thumbnail = oembed.thumbnail_url || null;
      embedHtml = oembed.html || "";
    }
  } catch (err) {
    console.warn("oEmbed fetch failed:", err);
  }

  // Scrape OpenGraph metadata for exact likes and comments
  try {
    const ogRes = await fetch(permalink, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (ogRes.ok) {
      const html = await ogRes.text();
      const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

      if (imageMatch && !thumbnail) {
        thumbnail = imageMatch[1].replace(/&amp;/g, "&");
      }

      if (descMatch) {
        const desc = descMatch[1];
        // Typical format: "3 likes, 0 comments - fabroniee on October 21, 2026: ..."
        const countMatch = desc.match(/([\d,]+)\s+likes?,\s+([\d,]+)\s+comments?(?:\s*-\s*([^\s]+)\s+on\s+([^:]+))?/i);
        if (countMatch) {
          likes = parseInt(countMatch[1].replace(/,/g, ""), 10) || likes;
          comments = parseInt(countMatch[2].replace(/,/g, ""), 10) || comments;
          if (countMatch[3] && !author) author = countMatch[3];
          if (countMatch[4]) uploadDate = countMatch[4].trim();
        }
      }
    }
  } catch (err) {
    console.warn("OpenGraph scraper failed:", err);
  }

  return {
    id: shortcode,
    shortcode,
    url: permalink,
    caption: title,
    author: author || "instagram_user",
    authorName: author || "Instagram Creator",
    authorUrl: authorUrl || `https://www.instagram.com/${author}`,
    thumbnail,
    likes,
    comments,
    uploadDate,
    embedHtml,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = (body.url || "").trim();

    if (!rawUrl) {
      return NextResponse.json({ success: false, error: "Please enter an Instagram Reel or post URL." }, { status: 400 });
    }

    const shortcode = extractShortcode(rawUrl);
    if (!shortcode) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Instagram link. Please paste a valid Reel link (e.g., https://www.instagram.com/reel/...).",
        },
        { status: 400 }
      );
    }

    // Check memory cache
    const cached = reelCache.get(shortcode);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, data: cached.data });
    }

    const normalizedUrl = `https://www.instagram.com/reel/${shortcode}/`;

    // Strategy 1: Fast extract with yt-dlp
    let reelData: ReelInfo | null = null;
    try {
      const { stdout } = await execFileAsync(
        "python",
        ["-m", "yt_dlp", "--dump-json", "--no-warnings", normalizedUrl],
        { timeout: 9000, maxBuffer: 10 * 1024 * 1024 }
      );

      if (stdout) {
        const raw = JSON.parse(stdout);
        const caption = raw.description || raw.title || "";
        const author = raw.uploader_id || raw.uploader || "instagram_user";

        reelData = {
          id: raw.id || shortcode,
          shortcode,
          url: normalizedUrl,
          videoUrl: raw.url || null,
          thumbnail: raw.thumbnail || null,
          caption,
          author,
          authorName: raw.uploader || author,
          authorUrl: `https://www.instagram.com/${author}`,
          likes: typeof raw.like_count === "number" ? raw.like_count : 0,
          comments: typeof raw.comment_count === "number" ? raw.comment_count : 0,
          views: typeof raw.view_count === "number" ? raw.view_count : 0,
          duration: typeof raw.duration === "number" ? raw.duration : null,
          uploadDate: raw.upload_date
            ? `${raw.upload_date.slice(0, 4)}-${raw.upload_date.slice(4, 6)}-${raw.upload_date.slice(6, 8)}`
            : null,
          timestamp: raw.timestamp ? raw.timestamp * 1000 : null,
        };
      }
    } catch (err: any) {
      console.warn("yt-dlp extract failed or timed out:", err?.message || err);
    }

    // Strategy 2: Fallback to oEmbed + OpenGraph scraper if yt-dlp did not extract
    if (!reelData || !reelData.caption) {
      const fallback = await fetchOEmbedFallback(shortcode, normalizedUrl);
      reelData = {
        id: shortcode,
        shortcode,
        url: normalizedUrl,
        videoUrl: reelData?.videoUrl || null,
        thumbnail: reelData?.thumbnail || fallback.thumbnail || null,
        caption: fallback.caption || reelData?.caption || "Instagram Reel",
        author: fallback.author || reelData?.author || "instagram_user",
        authorName: fallback.authorName || reelData?.authorName || "Instagram Creator",
        authorUrl: fallback.authorUrl || `https://www.instagram.com/${fallback.author}`,
        likes: fallback.likes || reelData?.likes || 0,
        comments: fallback.comments || reelData?.comments || 0,
        views: reelData?.views || 0,
        duration: reelData?.duration || null,
        uploadDate: fallback.uploadDate || reelData?.uploadDate || null,
        timestamp: reelData?.timestamp || null,
        embedHtml: fallback.embedHtml,
      };
    }

    if (reelData) {
      reelCache.set(shortcode, { timestamp: Date.now(), data: reelData });
      return NextResponse.json({ success: true, data: reelData });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Could not fetch details for this Reel. Please make sure the Reel is from a public Instagram account.",
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
    return NextResponse.json({ success: false, error: "Missing 'url' query parameter." }, { status: 400 });
  }

  // Delegate to POST handler
  const syntheticReq = new NextRequest(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: urlParam }),
  });
  return POST(syntheticReq);
}
