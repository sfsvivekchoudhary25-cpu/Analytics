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

export function extractShortcode(inputUrl: string): string | null {
  if (!inputUrl) return null;
  const raw = inputUrl.trim();

  // 1. Direct shortcode (e.g. DezELDuyIpG)
  if (/^[A-Za-z0-9_-]{9,15}$/.test(raw)) {
    return raw;
  }

  // 2. Comprehensive Instagram URL pattern
  // Matches:
  // - https://www.instagram.com/reel/DezELDuyIpG/
  // - https://www.instagram.com/gourav_digital15/reel/DezELDuyIpG/
  // - https://www.instagram.com/share/reel/DezELDuyIpG/
  // - https://www.instagram.com/share/p/DezELDuyIpG/
  // - https://www.instagram.com/reels/DezELDuyIpG/
  // - https://www.instagram.com/p/DezELDuyIpG/
  // - https://www.instagram.com/tv/DezELDuyIpG/
  // - https://instagr.am/p/DezELDuyIpG/
  const match = raw.match(
    /(?:instagram\.com|instagr\.am)(?:\/[^\/\?#]+)*?\/(?:reel|reels|p|tv|share\/reel|share\/p)\/([A-Za-z0-9_-]+)/i
  );
  if (match && match[1]) {
    return match[1];
  }

  // 3. Fallback: general /(reel|reels|p|tv)/SHORTCODE anywhere in text (e.g. shared WhatsApp/Telegram text)
  const fallback = raw.match(/(?:\/(?:reel|reels|p|tv)\/)([A-Za-z0-9_-]+)/i);
  if (fallback && fallback[1]) {
    return fallback[1];
  }

  // 4. Share link fallback: /share/SHORTCODE/
  const shareFallback = raw.match(/\/share\/([A-Za-z0-9_-]+)/i);
  if (
    shareFallback &&
    shareFallback[1] &&
    shareFallback[1] !== "reel" &&
    shareFallback[1] !== "p"
  ) {
    return shareFallback[1];
  }

  return null;
}

