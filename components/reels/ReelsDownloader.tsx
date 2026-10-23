"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  Film,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Play,
  Heart,
  MessageCircle,
  Eye,
  Hash,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  Clock,
  User,
  Share2,
  Video,
  FileDown,
  Image as ImageIcon,
} from "lucide-react";
import { ReelInfo, extractShortcode } from "@/app/api/instagram/reel/route";

export interface SavedReelItem {
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
  savedAt: number;
}

const STORAGE_KEY = "fabroniee_saved_reels_vault_v1";

export function ReelsDownloader({ initialUrl }: { initialUrl?: string }) {
  const [inputUrl, setInputUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReel, setActiveReel] = useState<ReelInfo | null>(null);
  const [savedReels, setSavedReels] = useState<SavedReelItem[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "likes" | "comments">("newest");
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);

  // Load saved reels from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedReels(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to read saved reels:", e);
    }
  }, []);

  // Sync saved reels to localStorage
  const persistSavedReels = useCallback((items: SavedReelItem[]) => {
    setSavedReels(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to save reels to localStorage:", e);
    }
  }, []);

  // Fetch reel details from API
  const handleFetchReel = useCallback(
    async (urlToFetch?: string) => {
      const targetUrl = (urlToFetch || inputUrl).trim();
      if (!targetUrl) {
        setError("Please paste a valid Instagram Reel URL.");
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const res = await fetch("/api/instagram/reel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to fetch reel information.");
        }

        setActiveReel(json.data);
      } catch (err: any) {
        setError(err.message || "Could not fetch reel. Make sure the Instagram link is public.");
      } finally {
        setLoading(false);
      }
    },
    [inputUrl]
  );

  // Auto-fetch if initialUrl was provided or preloaded from Post Analytics
  useEffect(() => {
    if (initialUrl) {
      handleFetchReel(initialUrl);
    } else if (typeof window !== "undefined") {
      const preloaded = localStorage.getItem("fabroniee_preload_reel_url");
      if (preloaded) {
        localStorage.removeItem("fabroniee_preload_reel_url");
        setInputUrl(preloaded);
        handleFetchReel(preloaded);
      }
    }
  }, [initialUrl, handleFetchReel]);

  // Handle clipboard paste
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        handleFetchReel(text);
      }
    } catch {
      // Fallback
    }
  };

  // Check if active reel is already saved
  const isSaved = useMemo(() => {
    if (!activeReel) return false;
    return savedReels.some((r) => r.shortcode === activeReel.shortcode);
  }, [activeReel, savedReels]);

  // Toggle save to vault
  const toggleSaveReel = (reel: ReelInfo) => {
    const exists = savedReels.some((r) => r.shortcode === reel.shortcode);
    if (exists) {
      persistSavedReels(savedReels.filter((r) => r.shortcode !== reel.shortcode));
    } else {
      const newItem: SavedReelItem = {
        id: reel.id,
        shortcode: reel.shortcode,
        url: reel.url,
        videoUrl: reel.videoUrl,
        thumbnail: reel.thumbnail,
        caption: reel.caption,
        author: reel.author,
        authorName: reel.authorName,
        authorUrl: reel.authorUrl,
        likes: reel.likes,
        comments: reel.comments,
        views: reel.views,
        duration: reel.duration,
        uploadDate: reel.uploadDate,
        savedAt: Date.now(),
      };
      persistSavedReels([newItem, ...savedReels]);
    }
  };

  // Copy URL with visual checkmark
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Download media file via server proxy
  const triggerDownload = (url: string, filename: string, type: "video" | "image") => {
    if (type === "video") setDownloadingVideo(true);
    const proxyUrl = `/api/instagram/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&type=${type}`;
    const a = document.createElement("a");
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloadingVideo(false), 2000);
  };

  // Filtered and sorted saved reels
  const displayedSavedReels = useMemo(() => {
    let list = [...savedReels];
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.author.toLowerCase().includes(q) ||
          r.authorName.toLowerCase().includes(q) ||
          r.caption.toLowerCase().includes(q)
      );
    }

    if (sortBy === "likes") {
      list.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === "comments") {
      list.sort((a, b) => b.comments - a.comments);
    } else {
      list.sort((a, b) => b.savedAt - a.savedAt);
    }

    return list;
  }, [savedReels, filterQuery, sortBy]);

  // Aggregate Vault Statistics
  const vaultStats = useMemo(() => {
    const totalLikes = savedReels.reduce((sum, r) => sum + (r.likes || 0), 0);
    const totalComments = savedReels.reduce((sum, r) => sum + (r.comments || 0), 0);
    const uniqueCreators = new Set(savedReels.map((r) => r.author.toLowerCase())).size;
    return {
      count: savedReels.length,
      creators: uniqueCreators,
      totalLikes,
      totalComments,
    };
  }, [savedReels]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-36 sm:pb-24 animate-page-entrance max-w-7xl mx-auto">
      {/* ── World-Class Omnibar Hero (Arc / Raycast style) ─────────────── */}
      <div className="space-y-4 pt-1 sm:pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-950 border border-black/80 text-xs font-bold shadow-2xs">
                <Film size={12} className="text-slate-950" />
                <span>Reels Studio</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e2e2fc] text-slate-950 text-xs font-bold">
                <Bookmark size={11} />
                <span>{savedReels.length} in Vault</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight mt-2">
              Download & Curate Reels
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Watermark-free 1080p MP4 downloads, full creator engagement metrics, and an offline inspiration vault.
            </p>
          </div>
        </div>

        {/* ── Unified Capture Omnibar ─────────────────────────────────── */}
        <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchReel();
            }}
            className="flex items-center gap-2 p-1.5 sm:p-2 rounded-full bg-white border border-[#e9e9ee] shadow-sm hover:border-black/40 focus-within:border-black focus-within:shadow-md transition-all"
          >
            {/* Left Brand Badge */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#e2e2fc] text-slate-950 flex items-center justify-center shrink-0">
              <Film size={16} />
            </div>

            {/* Input Field */}
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste Instagram Reel or Post link..."
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-xs sm:text-sm font-medium text-slate-950 placeholder-slate-400 pl-1 sm:pl-2"
            />

            {/* Quick Paste Button */}
            <button
              type="button"
              onClick={handlePaste}
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-[#f1f3f7] hover:bg-slate-200 text-slate-700 hover:text-slate-950 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95"
            >
              Paste
            </button>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#000000", color: "#ffffff" }}
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 shrink-0 active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin !text-white" />
                  <span className="hidden sm:inline !text-white">Fetching...</span>
                </>
              ) : (
                <>
                  <Download size={15} className="!text-white" />
                  <span className="!text-white">Get Reel</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message Alert */}
          {error && (
            <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-500 hover:text-rose-900 font-bold ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Active Fetched Reel Showcase ─────────────────────────────── */}
      {activeReel && (
        <div className="rounded-[26px] border border-[#e9e9ee] hover:border-black/30 bg-white p-4 sm:p-6 lg:p-7 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-[#e9e9ee]">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-950 border border-black/80 text-xs font-bold shadow-2xs">
                <Video size={13} className="text-slate-950" />
                <span>Reel Cockpit</span>
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Shortcode: <strong className="text-slate-950 font-bold font-mono">{activeReel.shortcode}</strong>
              </span>
            </div>

            {/* Quick Actions (3 compact pills) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => toggleSaveReel(activeReel)}
                style={isSaved ? { backgroundColor: "#feece4" } : {}}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                  isSaved
                    ? "bg-[#feece4] text-slate-950 border-0"
                    : "bg-white text-slate-950 border border-black/80 hover:bg-neutral-50"
                }`}
              >
                {isSaved ? <BookmarkCheck size={13} className="text-emerald-700" /> : <Bookmark size={13} />}
                <span>{isSaved ? "Saved to Vault" : "Save to Vault"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(activeReel.url)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-slate-950 border border-[#e9e9ee] hover:border-black/50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                {copiedUrl === activeReel.url ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedUrl === activeReel.url ? "Copied" : "Copy link"}</span>
              </button>

              <a
                href={activeReel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-slate-950 border border-[#e9e9ee] hover:border-black/50 text-xs font-bold shadow-2xs transition-all cursor-pointer !no-underline"
              >
                <span>Instagram</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Dual-Column Reel Cockpit */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start mt-5 sm:mt-6">
            {/* Left: Video Player / Thumbnail Preview */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center">
              <div className="relative aspect-[9/16] w-full max-w-[260px] sm:max-w-[300px] rounded-[22px] overflow-hidden bg-black shadow-md border border-[#e9e9ee] group flex items-center justify-center">
                {activeReel.videoUrl ? (
                  <video
                    src={activeReel.videoUrl}
                    poster={activeReel.thumbnail || undefined}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : activeReel.thumbnail ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeReel.thumbnail}
                    alt={activeReel.caption || "Reel thumbnail"}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <Film size={36} className="mx-auto mb-2 opacity-60" />
                    <p className="text-xs">No media preview</p>
                  </div>
                )}
              </div>

              {/* Media Format Pill */}
              <div className="flex items-center justify-between w-full max-w-[260px] sm:max-w-[300px] px-2 mt-2.5 text-[11px] sm:text-xs text-slate-500">
                <span className="font-medium">Original Format</span>
                <span className="font-bold text-slate-950">1080p MP4 (Stereo Audio)</span>
              </div>
            </div>

            {/* Right: Reel Information & Engagement Metrics */}
            <div className="md:col-span-7 lg:col-span-8 space-y-4 sm:space-y-5">
              {/* Creator & Timing Banner */}
              <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[20px] border border-[#e9e9ee] bg-[#fafbff]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-950">@{activeReel.author}</span>
                      <a
                        href={activeReel.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-black transition-colors"
                        title="Open profile"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {activeReel.authorName !== activeReel.author ? activeReel.authorName : "Instagram Creator"}
                    </p>
                  </div>
                </div>

                {activeReel.uploadDate && (
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                      <Clock size={12} className="text-slate-400" />
                      <span>{activeReel.uploadDate}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">Published Date</div>
                  </div>
                )}
              </div>

              {/* 3 Core Engagement Stat Chips (Soft Pastel Minimal - BORDERLESS) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* 1. Likes - Soft Rose Pink #fceef4 */}
                <div
                  style={{ backgroundColor: "#fceef4" }}
                  className="rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs border-0 min-h-[92px]"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-lg sm:text-2xl font-black text-slate-950 tabular-nums leading-none">
                      {activeReel.likes.toLocaleString()}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                      <Heart size={12} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-bold text-slate-950 truncate">Likes</div>
                  </div>
                </div>

                {/* 2. Comments - Soft Butter Yellow #fff9db */}
                <div
                  style={{ backgroundColor: "#fff9db" }}
                  className="rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs border-0 min-h-[92px]"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-lg sm:text-2xl font-black text-slate-950 tabular-nums leading-none">
                      {activeReel.comments.toLocaleString()}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                      <MessageCircle size={12} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-bold text-slate-950 truncate">Comments</div>
                  </div>
                </div>

                {/* 3. Views - Soft Periwinkle #e2e2fc */}
                <div
                  style={{ backgroundColor: "#e2e2fc" }}
                  className="rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs border-0 min-h-[92px]"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-lg sm:text-2xl font-black text-slate-950 tabular-nums leading-none">
                      {activeReel.views > 0 ? activeReel.views.toLocaleString() : "Reel"}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                      <Play size={12} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-bold text-slate-950 truncate">Views</div>
                  </div>
                </div>
              </div>

              {/* Caption Description Card */}
              <div className="rounded-[20px] border border-[#e9e9ee] bg-[#ffffff] p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-950">
                    Caption & hashtags
                  </span>
                  {activeReel.caption && activeReel.caption.length > 180 && (
                    <button
                      type="button"
                      onClick={() => setExpandedCaption(!expandedCaption)}
                      className="text-xs font-bold text-slate-700 hover:text-black cursor-pointer"
                    >
                      {expandedCaption ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>

                <p
                  className={`text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap ${
                    expandedCaption ? "" : "line-clamp-3"
                  }`}
                >
                  {activeReel.caption || <span className="italic text-slate-400">No caption attached to this Reel.</span>}
                </p>
              </div>

              {/* ── Download Action Buttons ──────────────────────────────── */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                {activeReel.videoUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      triggerDownload(activeReel.videoUrl!, `reel-${activeReel.shortcode}.mp4`, "video")
                    }
                    disabled={downloadingVideo}
                    style={{ backgroundColor: "#000000", color: "#ffffff" }}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    <FileDown size={16} className="!text-white" />
                    <span className="!text-white">
                      {downloadingVideo ? "Preparing download..." : "Download HD video (.mp4)"}
                    </span>
                  </button>
                ) : (
                  <a
                    href={activeReel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: "#000000", color: "#ffffff" }}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer !no-underline active:scale-98"
                  >
                    <ExternalLink size={16} className="!text-white" />
                    <span className="!text-white">Watch & download on Instagram</span>
                  </a>
                )}

                {activeReel.thumbnail && (
                  <button
                    type="button"
                    onClick={() =>
                      triggerDownload(activeReel.thumbnail!, `cover-${activeReel.shortcode}.jpg`, "image")
                    }
                    className="inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-full bg-white hover:bg-neutral-50 text-slate-950 border border-[#e9e9ee] hover:border-black/50 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer shrink-0 active:scale-98"
                  >
                    <ImageIcon size={15} />
                    <span>Download cover image</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Saved Reels Vault Gallery (Cosmos / Pinterest Style Grid) ─── */}
      <div className="space-y-4 pt-4 border-t border-[#e9e9ee]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Your Vault
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e2e2fc] text-slate-950 text-xs font-bold">
                {savedReels.length} {savedReels.length === 1 ? "reel" : "reels"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Saved reels are stored locally for instant access, re-downloads, and 1-tap original viewing.
            </p>
          </div>

          {/* Search & Sort Controls */}
          {savedReels.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search creator or caption..."
                  className="w-full pl-8 pr-3 py-2 rounded-full border border-[#e9e9ee] text-xs focus:outline-none focus:border-black bg-white shadow-2xs"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2 px-3 rounded-full border border-[#e9e9ee] text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-black cursor-pointer shrink-0 shadow-2xs"
              >
                <option value="newest">Newest</option>
                <option value="likes">Most Liked</option>
                <option value="comments">Most Comments</option>
              </select>
            </div>
          )}
        </div>

        {/* Saved Reels Gallery Grid (2-col mobile, 3-col tablet, 4-col desktop) */}
        {displayedSavedReels.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {displayedSavedReels.map((item) => (
              <div
                key={item.shortcode}
                className="group relative aspect-[9/15] rounded-[22px] overflow-hidden bg-slate-950 shadow-2xs hover:shadow-lg transition-all duration-300 border border-[#e9e9ee] flex flex-col justify-between"
              >
                {/* Background Image Thumbnail */}
                {item.thumbnail ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.thumbnail}
                    alt={item.caption || "Saved reel"}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white/40">
                    <Film size={32} />
                  </div>
                )}

                {/* Ambient Cinematic Shadow Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

                {/* Top Overlay: Creator Pill & Delete Action */}
                <div className="relative z-10 p-2.5 sm:p-3 flex items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 truncate max-w-[130px]">
                    @{item.author}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      persistSavedReels(savedReels.filter((r) => r.shortcode !== item.shortcode))
                    }
                    className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 shrink-0"
                    title="Remove from vault"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Bottom Overlay: Metrics & Quick 1-Tap Actions */}
                <div className="relative z-10 p-2.5 sm:p-3 space-y-2">
                  {/* Caption line */}
                  <p className="text-[11px] sm:text-xs text-white/90 line-clamp-2 leading-snug drop-shadow-sm font-medium">
                    {item.caption || "Instagram Reel"}
                  </p>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/15">
                    {/* Likes & Comments pill */}
                    <div className="flex items-center gap-2 text-[11px] font-bold text-white/90">
                      <span className="flex items-center gap-0.5">
                        <Heart size={11} className="fill-white" />
                        <span>{item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle size={11} />
                        <span>{item.comments > 999 ? `${(item.comments / 1000).toFixed(1)}k` : item.comments}</span>
                      </span>
                    </div>

                    {/* Quick Action Icons */}
                    <div className="flex items-center gap-1">
                      {item.videoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            triggerDownload(item.videoUrl!, `reel-${item.shortcode}.mp4`, "video")
                          }
                          className="w-7 h-7 rounded-full bg-white text-slate-950 hover:bg-[#e2e2fc] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90"
                          title="Download MP4"
                        >
                          <Download size={13} />
                        </button>
                      )}

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-white hover:text-black flex items-center justify-center transition-all cursor-pointer border border-white/20 !no-underline"
                        title="View on Instagram"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Vault State */
          <div className="rounded-[24px] border border-dashed border-[#e9e9ee] bg-[#fafbff] p-8 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#e9e9ee] text-slate-400 mx-auto flex items-center justify-center shadow-2xs">
              <Film size={22} />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-sm sm:text-base font-bold text-slate-950">
                {filterQuery ? "No matching saved reels found" : "Your Vault is Empty"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {filterQuery
                  ? "Try searching for a different creator username or keyword."
                  : "Paste any Instagram Reel link into the bar above to inspect viral metrics, download 1080p video, and save it to your visual collection."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
