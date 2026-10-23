import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

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
  quality?: string | null;
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
  let views = 0;
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
        const viewMatch = desc.match(/([\d,]+)\s+(?:views?|plays?)/i);
        if (viewMatch) {
          views = parseInt(viewMatch[1].replace(/,/g, ""), 10) || 0;
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
    views: views || 0,
    quality: "1080p",
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

const PYTHON_EXTRACT_SCRIPT = `
import sys, json, re

code = sys.argv[1].strip()
m = re.search(r'(?:instagram\\.com\\/(?:p|reel|reels|tv)\\/|instagr\\.am\\/(?:p|reel|reels|tv)\\/)([A-Za-z0-9_-]+)', code)
if m: code = m.group(1)
url = f'https://www.instagram.com/reel/{code}/'

try:
    import yt_dlp
    class L:
        def debug(self, m): pass
        def warning(self, m): pass
        def error(self, m): pass
    opts = {'quiet': True, 'no_warnings': True, 'extract_flat': False, 'logger': L()}
    with yt_dlp.YoutubeDL(opts) as y:
        r = y.extract_info(url, download=False)
        if r and (r.get('url') or r.get('thumbnail')):
            u = None
            if r.get('upload_date'):
                ud = str(r['upload_date'])
                if len(ud) == 8: u = f'{ud[:4]}-{ud[4:6]}-{ud[6:8]}'
            author = r.get('uploader_id') or r.get('uploader') or 'instagram_user'
            q = '1080p' if r.get('url') else None
            fmts = r.get('formats') or []
            if fmts:
                best_fmt = fmts[-1]
                w = best_fmt.get('width') or r.get('width')
                h = best_fmt.get('height') or r.get('height')
                if w and h:
                    dim = min(int(w), int(h))
                    if dim >= 2160: q = '4K'
                    elif dim >= 1440: q = '1440p'
                    elif dim >= 1080: q = '1080p'
                    elif dim >= 720: q = '720p'
                    elif dim >= 480: q = '480p'
                    elif dim > 0: q = f'{dim}p'
            print(json.dumps({'success': True, 'data': {
                'id': r.get('id') or code,
                'shortcode': code,
                'url': url,
                'videoUrl': r.get('url') or None,
                'thumbnail': r.get('thumbnail') or None,
                'caption': r.get('description') or r.get('title') or '',
                'author': author,
                'authorName': r.get('uploader') or author,
                'authorUrl': f'https://www.instagram.com/{author}',
                'likes': int(r.get('like_count') or 0),
                'comments': int(r.get('comment_count') or 0),
                'views': int(r.get('view_count') or r.get('play_count') or 0),
                'quality': q,
                'duration': r.get('duration'),
                'uploadDate': u,
                'timestamp': int(r['timestamp'] * 1000) if r.get('timestamp') else None,
            }}))
            sys.exit(0)
except Exception:
    pass

try:
    import instaloader
    inst = instaloader.Instaloader()
    p = instaloader.Post.from_shortcode(inst.context, code)
    if p and (p.video_url or p.url):
        author = p.owner_username or 'instagram_user'
        ud = p.date_utc.strftime('%Y-%m-%d') if p.date_utc else None
        ts = int(p.date_utc.timestamp() * 1000) if p.date_utc else None
        print(json.dumps({'success': True, 'data': {
            'id': str(p.mediaid) if hasattr(p, 'mediaid') else code,
            'shortcode': code,
            'url': url,
            'videoUrl': p.video_url,
            'thumbnail': p.url,
            'caption': p.caption or '',
            'author': author,
            'authorName': p.owner_username or 'Instagram Creator',
            'authorUrl': f'https://www.instagram.com/{author}',
            'likes': int(p.likes or 0),
            'comments': int(p.comments or 0),
            'views': int(getattr(p, 'video_play_count', 0) or getattr(p, 'video_view_count', 0) or 0),
            'quality': '1080p' if p.video_url else 'HD',
            'duration': p.video_duration if hasattr(p, 'video_duration') else None,
            'uploadDate': ud,
            'timestamp': ts,
        }}))
        sys.exit(0)
except Exception:
    pass

print(json.dumps({'success': False, 'error': 'This Instagram Reel is unavailable, private, or has been removed. Please verify that the Reel is accessible publicly on Instagram.'}))
`;

    // Strategy 1: Multi-tier python extractor (yt-dlp + instaloader)
    let reelData: ReelInfo | null = null;
    let extractorError: string | null = null;

    try {
      const { stdout } = await execFileAsync(
        "python",
        ["-c", PYTHON_EXTRACT_SCRIPT, shortcode],
        { timeout: 15000, maxBuffer: 10 * 1024 * 1024 }
      );

      if (stdout) {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.success && parsed.data && (parsed.data.videoUrl || parsed.data.thumbnail)) {
          reelData = parsed.data;
        } else if (parsed.error) {
          extractorError = parsed.error;
        }
      }
    } catch (err: any) {
      console.warn("Python extract failed or timed out:", err?.message || err);
    }

    // Strategy 2: Fallback to oEmbed + OpenGraph scraper if python extractor didn't return media
    if (!reelData || (!reelData.videoUrl && !reelData.thumbnail)) {
      const fallback = await fetchOEmbedFallback(shortcode, normalizedUrl);
      if (fallback.thumbnail || reelData?.videoUrl) {
        reelData = {
          id: shortcode,
          shortcode,
          url: normalizedUrl,
          videoUrl: reelData?.videoUrl || null,
          thumbnail: fallback.thumbnail || reelData?.thumbnail || null,
          caption: fallback.caption || reelData?.caption || "Instagram Reel",
          author: fallback.author || reelData?.author || "instagram_user",
          authorName: fallback.authorName || reelData?.authorName || "Instagram Creator",
          authorUrl: fallback.authorUrl || `https://www.instagram.com/${fallback.author}`,
          likes: fallback.likes || reelData?.likes || 0,
          comments: fallback.comments || reelData?.comments || 0,
          views: reelData?.views || 0,
          quality: reelData?.quality || (fallback.thumbnail ? "1080p" : null),
          duration: reelData?.duration || null,
          uploadDate: fallback.uploadDate || reelData?.uploadDate || null,
          timestamp: reelData?.timestamp || null,
          embedHtml: fallback.embedHtml,
        };
      }
    }

    // Verify media presence: Must have either videoUrl or thumbnail to be a valid reel preview
    if (reelData && (reelData.videoUrl || reelData.thumbnail)) {
      reelCache.set(shortcode, { timestamp: Date.now(), data: reelData });
      return NextResponse.json({ success: true, data: reelData });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          extractorError ||
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
