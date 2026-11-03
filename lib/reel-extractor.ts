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
  const match = inputUrl.match(
    /(?:instagram\.com\/(?:p|reel|reels|tv)\/|instagr\.am\/(?:p|reel|reels|tv)\/)([A-Za-z0-9_-]+)/i
  );
  return match ? match[1] : null;
}

/**
 * Fetch official Instagram oEmbed + OpenGraph meta tags
 */
export async function fetchOEmbedFallback(
  shortcode: string,
  originalUrl?: string
): Promise<Partial<ReelInfo>> {
  const permalink = originalUrl || `https://www.instagram.com/reel/${shortcode}/`;
  let title = "";
  let author = "";
  let authorUrl = "";
  let thumbnail: string | null = null;
  let embedHtml = "";
  let likes = 0;
  let comments = 0;
  let views = 0;
  let uploadDate: string | null = null;

  try {
    const oembedRes = await fetch(
      `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(permalink)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        },
        next: { revalidate: 300 },
      }
    );

    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      title = oembed.title || "";
      author = oembed.author_name || "";
      authorUrl = oembed.author_url || (author ? `https://www.instagram.com/${author}` : "");
      thumbnail = oembed.thumbnail_url || null;
      embedHtml = oembed.html || "";
    }
  } catch (err) {
    console.warn("[Extractor] oEmbed fetch failed:", err);
  }

  // Scrape OpenGraph metadata for exact likes and comments
  try {
    const ogRes = await fetch(permalink, {
      headers: {
        "User-Agent":
          "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (ogRes.ok) {
      const html = await ogRes.text();
      const descMatch = html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
      );
      const imageMatch = html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
      );

      if (imageMatch && !thumbnail) {
        thumbnail = imageMatch[1].replace(/&amp;/g, "&");
      }

      if (descMatch) {
        const desc = descMatch[1];
        const countMatch = desc.match(
          /([\d,]+)\s+likes?,\s+([\d,]+)\s+comments?(?:\s*-\s*([^\s]+)\s+on\s+([^:]+))?/i
        );
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
    console.warn("[Extractor] OpenGraph scraper failed:", err);
  }

  const cleanAuthor = author && !/^\d+$/.test(author) ? author : author || "instagram_user";

  return {
    id: shortcode,
    shortcode,
    url: permalink,
    caption: title,
    author: cleanAuthor,
    authorName: cleanAuthor,
    authorUrl: authorUrl || `https://www.instagram.com/${cleanAuthor}`,
    thumbnail,
    likes,
    comments,
    views: views || 0,
    quality: "1080p",
    uploadDate,
    embedHtml,
  };
}

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
        if r:
            fmts = r.get('formats') or []
            # 1. Select best video stream: prioritize progressive MP4 (audio + video)
            video_url = None
            progressive_fmts = [f for f in fmts if f.get('ext') == 'mp4' and ('progressive' in str(f.get('url', '')) or 'progressive' in str(f.get('efg', '')) or str(f.get('format_id', '')) in ['1', '2', '3'])]
            if progressive_fmts:
                video_url = progressive_fmts[-1].get('url')
            else:
                valid_fmts = [f for f in fmts if f.get('url') and f.get('vcodec') != 'none']
                if valid_fmts:
                    video_url = valid_fmts[-1].get('url')
            if not video_url:
                video_url = r.get('url')

            # 2. Select best thumbnail
            thumb = r.get('thumbnail')
            if not thumb and r.get('thumbnails'):
                thumb = r['thumbnails'][-1].get('url')

            # 3. Clean author handle (prefer channel or non-numeric username over numeric ID)
            channel = r.get('channel')
            uploader = r.get('uploader')
            uploader_id = r.get('uploader_id')

            author = None
            if channel and not channel.isdigit():
                author = channel
            elif uploader and not uploader.isdigit() and ' ' not in uploader:
                author = uploader
            elif uploader_id and not uploader_id.isdigit():
                author = uploader_id
            elif channel:
                author = channel
            elif uploader:
                author = uploader
            else:
                author = uploader_id or 'instagram_user'

            author_name = uploader or channel or author

            # 4. Dates & stats
            u = None
            if r.get('upload_date'):
                ud = str(r['upload_date'])
                if len(ud) == 8: u = f'{ud[:4]}-{ud[4:6]}-{ud[6:8]}'

            # 5. Quality resolution
            q = '1080p' if video_url else None
            if fmts:
                best_fmt = progressive_fmts[-1] if progressive_fmts else (valid_fmts[-1] if valid_fmts else fmts[-1])
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

            if video_url or thumb:
                print(json.dumps({'success': True, 'data': {
                    'id': r.get('id') or code,
                    'shortcode': code,
                    'url': url,
                    'videoUrl': video_url,
                    'thumbnail': thumb,
                    'caption': r.get('description') or r.get('title') or '',
                    'author': author,
                    'authorName': author_name,
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

/**
 * Resolve full reel data by shortcode with multi-tier extraction
 */
export async function resolveReelData(shortcode: string): Promise<ReelInfo | null> {
  const cached = reelCache.get(shortcode);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const normalizedUrl = `https://www.instagram.com/reel/${shortcode}/`;
  let reelData: ReelInfo | null = null;

  // 1. Python yt-dlp / instaloader extraction
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
      }
    }
  } catch (err: any) {
    console.warn("[Extractor] Python extract failed:", err?.message || err);
  }

  // 2. Fallback to oEmbed + OpenGraph scraper
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

  if (reelData && (reelData.videoUrl || reelData.thumbnail)) {
    reelCache.set(shortcode, { timestamp: Date.now(), data: reelData });
    return reelData;
  }

  return null;
}

/**
 * Fast resolution for a fresh thumbnail URL
 */
export async function getFreshThumbnailUrl(shortcode: string): Promise<string | null> {
  // First try instant oEmbed (fastest, lightweight)
  try {
    const oembedRes = await fetch(
      `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(
        `https://www.instagram.com/reel/${shortcode}/`
      )}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        },
      }
    );
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data.thumbnail_url) return data.thumbnail_url;
    } else if (oembedRes.status === 404) {
      return null;
    }
  } catch {}

  // Fallback to full extraction
  const data = await resolveReelData(shortcode);
  return data?.thumbnail || null;
}

/**
 * Fast resolution for a fresh progressive MP4 video URL
 */
export async function getFreshVideoUrl(shortcode: string): Promise<string | null> {
  const data = await resolveReelData(shortcode);
  return data?.videoUrl || null;
}
