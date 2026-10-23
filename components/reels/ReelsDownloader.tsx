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
  CheckCircle2,
  Calendar,
  Layers,
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
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "likes" | "comments">("newest");
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{ loading: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"downloader" | "vault">("downloader");

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
        setActiveTab("downloader");
      } catch (err: any) {
        setError(err.message || "Could not fetch reel. Make sure the Instagram link is public.");
      } finally {
        setLoading(false);
      }
    },
    [inputUrl]
  );

  // Auto-fetch if initialUrl was provided or preloaded
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

  // Clear search input and active reel preview
  const handleClear = useCallback(() => {
    setInputUrl("");
    setActiveReel(null);
    setError(null);
    setDownloadStatus(null);
  }, []);

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

  // Safe clipboard copy helper with fallback for unfocused document or denied permissions
  const safeCopyText = async (text: string): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Document not focused or clipboard permission denied; try execCommand fallback
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.setAttribute("readonly", "");
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  };

  // Copy URL with visual checkmark
  const handleCopy = async (url: string) => {
    await safeCopyText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Copy hashtag
  const handleCopyTag = async (tag: string) => {
    await safeCopyText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1800);
  };

  // Download media file via server proxy with blob + direct device file-save
  const triggerDownload = async (url: string, filename: string, type: "video" | "image") => {
    if (type === "video") setDownloadingVideo(true);
    setDownloadStatus({
      loading: true,
      message: `Saving ${type === "video" ? "1080p video" : "cover image"} directly to your device...`,
    });

    try {
      const proxyUrl = `/api/instagram/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&type=${type}`;

      // Fetch as Blob for guaranteed device filesystem saving
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Proxy download returned non-200");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      setDownloadStatus({
        loading: false,
        message: `Saved ${filename} to your device!`,
      });
      setTimeout(() => setDownloadStatus(null), 4000);
    } catch (err) {
      console.warn("Direct blob download failed, falling back to direct proxy anchor:", err);
      const proxyUrl = `/api/instagram/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&type=${type}`;
      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadStatus({
        loading: false,
        message: `Download initiated for ${filename}.`,
      });
      setTimeout(() => setDownloadStatus(null), 4000);
    } finally {
      if (type === "video") setDownloadingVideo(false);
    }
  };

  // Extract hashtags from caption
  const hashtags = useMemo(() => {
    if (!activeReel?.caption) return [];
    const matches = activeReel.caption.match(/#[a-zA-Z0-9_\u0590-\u05ff\u0600-\u06ff]+/g);
    return matches ? Array.from(new Set(matches)).slice(0, 16) : [];
  }, [activeReel]);

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
    <div className="w-full space-y-5 sm:space-y-6 pb-20 animate-page-entrance">
      {/* ── Responsive Header & Mode Switcher ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#e2e2fc] text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
            <Film size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight leading-none">
                Reels Studio
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fceef4] text-[11px] font-bold text-slate-900 border-0">
                <Sparkles size={11} className="text-rose-600" />
                <span>1080p HD</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              Download 1080p MP4 videos & high-resolution cover posters
            </p>
          </div>
        </div>

        {/* Segmented Pill Switcher */}
        <div className="inline-flex self-start sm:self-auto p-1 rounded-full bg-[#f1f3f7] border border-[#e9e9ee] shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("downloader")}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "downloader"
                ? "bg-black text-white shadow-xs"
                : "text-slate-600 hover:text-black"
            }`}
          >
            Downloader
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vault")}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "vault"
                ? "bg-black text-white shadow-xs"
                : "text-slate-600 hover:text-black"
            }`}
          >
            <span>Vault</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === "vault" ? "bg-white/25 text-white" : "bg-[#e2e2fc] text-slate-950"
              }`}
            >
              {savedReels.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: DOWNLOADER VIEW ────────────────────────────────────── */}
      {activeTab === "downloader" && (
        <div className="space-y-5 sm:space-y-6">
          {/* Omnibar Form & Quick Sample Chips */}
          <div className="w-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFetchReel();
              }}
              className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-full bg-white border border-[#e9e9ee] shadow-xs hover:border-black/40 focus-within:border-black focus-within:shadow-md transition-all"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e2e2fc] text-slate-950 flex items-center justify-center shrink-0">
                <LinkIcon size={15} />
              </div>

              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste Instagram Reel link (e.g. https://www.instagram.com/reel/...)"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-xs sm:text-sm font-medium text-slate-950 placeholder-slate-400 pl-1"
              />

              {(inputUrl || activeReel) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-7 h-7 rounded-full text-slate-400 hover:text-black hover:bg-slate-100 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                  title="Clear search and reel"
                >
                  ✕
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                className="px-3 py-1.5 rounded-full bg-[#f1f3f7] hover:bg-slate-200 text-slate-700 hover:text-slate-950 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95"
              >
                Paste
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: "#000000", color: "#ffffff" }}
                className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-full !bg-black hover:!bg-neutral-800 !text-white flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-60 shrink-0 active:scale-95 text-xs font-bold"
                title="Fetch Reel"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin !text-white" />
                ) : (
                  <>
                    <Download size={15} className="!text-white" />
                    <span className="hidden sm:inline !text-white">Fetch Reel</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick tips & sample launcher */}
            <div className="flex flex-wrap items-center gap-2 pt-2 px-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Quick:</span>
              <button
                type="button"
                onClick={() => {
                  const sample = "https://www.instagram.com/reel/Dew3_NSKnoc/";
                  setInputUrl(sample);
                  handleFetchReel(sample);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-neutral-50 text-slate-800 border border-[#e9e9ee] hover:border-black text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Sparkles size={11} className="text-amber-500" />
                <span>Try Sample (Karan Aujla)</span>
              </button>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                • 1080p MP4 device downloads • Full covers • Zero watermarks
              </span>
            </div>
          </div>

          {/* Enhanced Error / Notice Card (Soft Peach Coral #feece4) */}
          {error && (
            <div
              style={{ backgroundColor: "#feece4" }}
              className="p-4 rounded-[24px] border-0 text-slate-950 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in w-full"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={14} />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-slate-950">Reel Unavailable or Private</div>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const sample = "https://www.instagram.com/reel/Dew3_NSKnoc/";
                    setInputUrl(sample);
                    handleFetchReel(sample);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-slate-950 border border-black/80 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  Try Sample Reel
                </button>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-slate-600 hover:text-black text-xs font-bold px-2 py-1 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Live Download Status Banner (Soft Periwinkle #e2e2fc) */}
          {downloadStatus && (
            <div
              style={{ backgroundColor: "#e2e2fc" }}
              className="p-3.5 rounded-[22px] border-0 text-slate-950 shadow-xs flex items-center justify-between gap-3 animate-fade-in w-full"
            >
              <div className="flex items-center gap-2.5">
                {downloadStatus.loading ? (
                  <RefreshCw size={15} className="animate-spin text-slate-950 shrink-0" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-bold text-slate-950">{downloadStatus.message}</span>
              </div>
              {!downloadStatus.loading && (
                <button
                  type="button"
                  onClick={() => setDownloadStatus(null)}
                  className="text-slate-600 hover:text-black text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Active Reel Responsive Studio Card (Mobile Single Column, Tablet & Desktop 2-Column) */}
          {activeReel ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-8 items-start animate-scale-in w-full">
              {/* ── LEFT COLUMN: REEL VIDEO / POSTER PREVIEW ── */}
              <div className="md:col-span-5 lg:col-span-5 xl:col-span-4">
                <div className="rounded-[26px] border border-[#e9e9ee] bg-white p-3 sm:p-4 shadow-2xs space-y-3">
                  {/* Media Story Frame */}
                  <div className="relative aspect-[9/13] md:aspect-[9/15] w-full max-w-[270px] md:max-w-none mx-auto rounded-[20px] overflow-hidden bg-black shadow-md border border-[#e9e9ee] flex items-center justify-center group">
                    {/* 1080p HD Badge on top left */}
                    <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-sm">
                      <Video size={11} className="text-[#e2e2fc]" />
                      <span>1080p HD</span>
                    </span>

                    {/* Instant Save Cover Badge on top right */}
                    {activeReel.thumbnail && (
                      <button
                        type="button"
                        onClick={() =>
                          triggerDownload(activeReel.thumbnail!, `cover-${activeReel.shortcode}.jpg`, "image")
                        }
                        className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/70 backdrop-blur-md hover:bg-black text-white text-[10px] sm:text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                        title="Download Cover Poster (.jpg)"
                      >
                        <ImageIcon size={11} />
                        <span>Save Cover</span>
                      </button>
                    )}

                    {activeReel.videoUrl ? (
                      <video
                        src={activeReel.videoUrl}
                        poster={activeReel.thumbnail || undefined}
                        controls
                        playsInline
                        preload="metadata"
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
                        <p className="text-xs">No media preview available</p>
                      </div>
                    )}
                  </div>

                  {/* Quick 1-tap download bar right under preview for mobile */}
                  {activeReel.videoUrl && (
                    <div className="md:hidden pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          triggerDownload(activeReel.videoUrl!, `reel-${activeReel.shortcode}.mp4`, "video")
                        }
                        disabled={downloadingVideo}
                        style={{ backgroundColor: "#000000", color: "#ffffff" }}
                        className="w-full py-2.5 px-4 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-75"
                      >
                        {downloadingVideo ? (
                          <RefreshCw size={14} className="animate-spin !text-white" />
                        ) : (
                          <FileDown size={14} className="!text-white" />
                        )}
                        <span className="!text-white">
                          {downloadingVideo ? "Saving..." : "Download Video (.mp4)"}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Sub-Player Quick Links */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <a
                      href={activeReel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-black font-semibold !no-underline"
                    >
                      <ExternalLink size={12} />
                      <span>View on Instagram</span>
                    </a>

                    {activeReel.videoUrl && (
                      <a
                        href={activeReel.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-black font-semibold !no-underline"
                      >
                        <Play size={12} />
                        <span>Direct Stream</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN: CREATOR INFO, STATS, ACTIONS & CAPTION ── */}
              <div className="md:col-span-7 lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5">
                {/* Creator Header Card */}
                <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#f1f3f7] border border-[#e9e9ee] flex items-center justify-center shrink-0 font-black text-sm text-slate-800">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm sm:text-base font-black text-slate-950 truncate">
                          @{activeReel.author}
                        </span>
                        <a
                          href={activeReel.authorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-black shrink-0"
                          title="Open Instagram Profile"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {activeReel.authorName !== activeReel.author
                          ? activeReel.authorName
                          : "Instagram Reel Creator"}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Save to Vault & Copy Link */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => toggleSaveReel(activeReel)}
                      style={isSaved ? { backgroundColor: "#feece4" } : {}}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSaved
                          ? "bg-[#feece4] text-slate-950 border-0"
                          : "bg-white text-slate-950 border border-black/80 hover:bg-neutral-50"
                      }`}
                    >
                      {isSaved ? <BookmarkCheck size={14} className="text-emerald-700" /> : <Bookmark size={14} />}
                      <span>{isSaved ? "Saved in Vault" : "Save to Vault"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(activeReel.url)}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-neutral-50 border border-[#e9e9ee] hover:border-black text-slate-950 flex items-center gap-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                      title="Copy reel URL"
                    >
                      {copiedUrl === activeReel.url ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedUrl === activeReel.url ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClear}
                      className="w-8 h-8 rounded-full bg-white hover:bg-neutral-100 border border-[#e9e9ee] hover:border-black text-slate-500 hover:text-black flex items-center justify-center text-xs font-bold shadow-2xs transition-all cursor-pointer"
                      title="Close reel preview"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 3 Soft Pastel Engagement Cards (Borderless per AGENTS.md) */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                  {/* Likes - Soft Rose Pink #fceef4 */}
                  <div
                    style={{ backgroundColor: "#fceef4" }}
                    className="rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 flex flex-col justify-between shadow-xs border-0 min-h-[85px] sm:min-h-[105px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg sm:text-2xl font-black text-slate-950 tabular-nums">
                        {activeReel.likes.toLocaleString()}
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                        <Heart size={14} className="text-rose-600" />
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2">Likes</span>
                  </div>

                  {/* Comments - Soft Butter Yellow #fff9db */}
                  <div
                    style={{ backgroundColor: "#fff9db" }}
                    className="rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 flex flex-col justify-between shadow-xs border-0 min-h-[85px] sm:min-h-[105px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg sm:text-2xl font-black text-slate-950 tabular-nums">
                        {activeReel.comments.toLocaleString()}
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                        <MessageCircle size={14} className="text-amber-700" />
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2">Comments</span>
                  </div>

                  {/* Views - Soft Periwinkle #e2e2fc */}
                  <div
                    style={{ backgroundColor: "#e2e2fc" }}
                    className="rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 flex flex-col justify-between shadow-xs border-0 min-h-[85px] sm:min-h-[105px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg sm:text-2xl font-black text-slate-950 tabular-nums">
                        {activeReel.views > 0 ? activeReel.views.toLocaleString() : "Reel"}
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                        <Play size={14} className="text-indigo-700" />
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 mt-2">Views</span>
                  </div>
                </div>

                {/* Direct 1-Tap Device Download Card */}
                <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileDown size={16} className="text-slate-950" />
                      <span className="text-xs sm:text-sm font-black text-slate-950">
                        Direct Device Downloads
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      Saves straight to your Downloads folder
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* Primary Button: 1080p MP4 Video */}
                    {activeReel.videoUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          triggerDownload(activeReel.videoUrl!, `reel-${activeReel.shortcode}.mp4`, "video")
                        }
                        disabled={downloadingVideo}
                        style={{ backgroundColor: "#000000", color: "#ffffff" }}
                        className="py-3.5 px-4 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-75"
                      >
                        {downloadingVideo ? (
                          <RefreshCw size={16} className="animate-spin !text-white" />
                        ) : (
                          <FileDown size={17} className="!text-white" />
                        )}
                        <span className="!text-white">
                          {downloadingVideo ? "Saving to device..." : "Download Video (.mp4)"}
                        </span>
                      </button>
                    ) : (
                      <a
                        href={activeReel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ backgroundColor: "#000000", color: "#ffffff" }}
                        className="py-3.5 px-4 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer !no-underline active:scale-98"
                      >
                        <ExternalLink size={16} className="!text-white" />
                        <span className="!text-white">Watch on Instagram</span>
                      </a>
                    )}

                    {/* Secondary Button: High-Res Cover Poster */}
                    {activeReel.thumbnail ? (
                      <button
                        type="button"
                        onClick={() =>
                          triggerDownload(activeReel.thumbnail!, `cover-${activeReel.shortcode}.jpg`, "image")
                        }
                        className="py-3.5 px-4 rounded-full bg-white hover:bg-neutral-50 text-slate-950 border border-[#e9e9ee] hover:border-black text-xs sm:text-sm font-bold shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                      >
                        <ImageIcon size={16} />
                        <span>Download Cover (.jpg)</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Caption & Content Card with Hashtag Cloud */}
                {activeReel.caption && (
                  <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-black text-slate-950">Caption</span>
                      {activeReel.caption.length > 120 && (
                        <button
                          type="button"
                          onClick={() => setExpandedCaption(!expandedCaption)}
                          className="text-xs font-bold text-slate-600 hover:text-black cursor-pointer"
                        >
                          {expandedCaption ? "Show Less" : "Show Full Caption"}
                        </button>
                      )}
                    </div>

                    <p
                      className={`text-xs sm:text-sm text-slate-700 leading-relaxed ${
                        expandedCaption ? "" : "line-clamp-3 sm:line-clamp-4"
                      }`}
                    >
                      {activeReel.caption}
                    </p>

                    {/* Hashtags Cloud (1-tap to copy) */}
                    {hashtags.length > 0 && (
                      <div className="pt-2 border-t border-[#e9e9ee] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">
                            Hashtags ({hashtags.length}) — Click to copy
                          </span>
                          {copiedTag && (
                            <span className="text-[11px] font-bold text-emerald-600 animate-fade-in">
                              Copied {copiedTag}!
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {hashtags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleCopyTag(tag)}
                              className="px-2.5 py-1 rounded-full bg-[#f1f3f7] hover:bg-black hover:text-white text-slate-700 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title="Click to copy hashtag"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── EMPTY STATE: FULL-WIDTH STUDIO SHOWCASE HERO ── */
            <div className="space-y-6 w-full">
              <div className="rounded-[28px] border border-[#e9e9ee] bg-white p-6 sm:p-10 lg:p-12 shadow-2xs text-center space-y-6 w-full">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#e2e2fc] text-slate-950 mx-auto flex items-center justify-center shadow-xs">
                  <Film size={26} />
                </div>

                <div className="max-w-2xl mx-auto space-y-2">
                  <h3 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight">
                    Download & Curate Instagram Reels in 1080p HD
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
                    Paste any public Instagram reel link to instantly download full high-definition MP4 video files,
                    extract crystal-clear cover posters, and curate your private vault.
                  </p>
                </div>

                {/* 4 Pastel Feature Highlights (Borderless) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left pt-2">
                  {/* Feature 1: Soft Periwinkle */}
                  <div
                    style={{ backgroundColor: "#e2e2fc" }}
                    className="rounded-[24px] p-5 flex flex-col justify-between shadow-xs border-0 min-h-[140px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-950">1080p Video</span>
                      <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                        <Video size={15} className="text-indigo-700" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed">
                      Direct device MP4 save with uncompressed audio and video streams.
                    </p>
                  </div>

                  {/* Feature 2: Soft Butter Yellow */}
                  <div
                    style={{ backgroundColor: "#fff9db" }}
                    className="rounded-[24px] p-5 flex flex-col justify-between shadow-xs border-0 min-h-[140px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-950">Original Covers</span>
                      <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                        <ImageIcon size={15} className="text-amber-700" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed">
                      Extract full uncropped thumbnail posters in high-res JPEG format.
                    </p>
                  </div>

                  {/* Feature 3: Soft Rose Pink */}
                  <div
                    style={{ backgroundColor: "#fceef4" }}
                    className="rounded-[24px] p-5 flex flex-col justify-between shadow-xs border-0 min-h-[140px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-950">Curate Vault</span>
                      <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                        <Bookmark size={15} className="text-rose-600" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed">
                      Organize, search, and curate saved reels locally in your browser.
                    </p>
                  </div>

                  {/* Feature 4: Soft Peach Coral */}
                  <div
                    style={{ backgroundColor: "#feece4" }}
                    className="rounded-[24px] p-5 flex flex-col justify-between shadow-xs border-0 min-h-[140px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-950">Zero Watermarks</span>
                      <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                        <Sparkles size={15} className="text-orange-700" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed">
                      Clean original creator uploads without overlay logos or branding.
                    </p>
                  </div>
                </div>

                {/* Primary Sample Reel Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sample = "https://www.instagram.com/reel/Dew3_NSKnoc/";
                      setInputUrl(sample);
                      handleFetchReel(sample);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-neutral-50 text-slate-950 border border-black/80 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Try Sample Reel (Karan Aujla)</span>
                  </button>
                </div>
              </div>

              {/* 3-Step Simple Guide across full width */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-5 shadow-2xs flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#e2e2fc] text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-950">Copy Reel URL</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Open Instagram on mobile or desktop, tap share on any reel, and copy link.
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-5 shadow-2xs flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#fff9db] text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-950">1-Tap Paste & Fetch</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Click Paste to extract full 1080p video stream, original cover, and stats.
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-5 shadow-2xs flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#fceef4] text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-950">Direct Device Download</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Save .mp4 video and .jpg cover straight into your Downloads folder.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Vault Preview on Downloader Tab (if saved reels exist) */}
          {savedReels.length > 0 && (
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs sm:text-sm font-black text-slate-950">
                  Recently Saved in Vault ({savedReels.length})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("vault")}
                  className="text-xs sm:text-sm font-bold text-slate-600 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Vault</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Responsive Grid: 2 cols on mobile, 4 on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {savedReels.slice(0, 4).map((item) => (
                  <div
                    key={item.shortcode}
                    className="group relative aspect-[9/14] rounded-[20px] overflow-hidden bg-slate-950 shadow-2xs border border-[#e9e9ee] flex flex-col justify-between"
                  >
                    {item.thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.thumbnail}
                        alt={item.caption || "Reel"}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white/40">
                        <Film size={26} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/50 pointer-events-none" />

                    <div className="relative z-10 p-2.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full truncate max-w-[110px]">
                        @{item.author}
                      </span>
                    </div>

                    <div className="relative z-10 p-2.5 flex items-center justify-between border-t border-white/15">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1">
                        <Heart size={11} className="fill-white" />
                        <span>{item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        {item.videoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              triggerDownload(item.videoUrl!, `reel-${item.shortcode}.mp4`, "video")
                            }
                            className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-xs cursor-pointer active:scale-90"
                            title="Download MP4 to device"
                          >
                            <Download size={12} />
                          </button>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20 !no-underline"
                          title="Open on Instagram"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: VAULT GALLERY VIEW ─────────────────────────────────── */}
      {activeTab === "vault" && (
        <div className="space-y-5 sm:space-y-6">
          {/* Vault Summary Banner (4 Soft Pastel Metric Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1: Total Saved (Soft Periwinkle #e2e2fc) */}
            <div
              style={{ backgroundColor: "#e2e2fc" }}
              className="rounded-[24px] p-4 sm:p-5 flex flex-col justify-between shadow-xs border-0 min-h-[90px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-3xl font-black text-slate-950 tabular-nums">
                  {vaultStats.count}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                  <Bookmark size={15} />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs sm:text-sm font-bold text-slate-950">Saved Reels</div>
              </div>
            </div>

            {/* Metric 2: Creators (Soft Butter Yellow #fff9db) */}
            <div
              style={{ backgroundColor: "#fff9db" }}
              className="rounded-[24px] p-4 sm:p-5 flex flex-col justify-between shadow-xs border-0 min-h-[90px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-3xl font-black text-slate-950 tabular-nums">
                  {vaultStats.creators}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                  <User size={15} />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs sm:text-sm font-bold text-slate-950">Creators</div>
              </div>
            </div>

            {/* Metric 3: Total Likes (Soft Rose Pink #fceef4) */}
            <div
              style={{ backgroundColor: "#fceef4" }}
              className="rounded-[24px] p-4 sm:p-5 flex flex-col justify-between shadow-xs border-0 min-h-[90px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-3xl font-black text-slate-950 tabular-nums">
                  {vaultStats.totalLikes > 999
                    ? `${(vaultStats.totalLikes / 1000).toFixed(1)}k`
                    : vaultStats.totalLikes}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                  <Heart size={15} className="text-rose-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs sm:text-sm font-bold text-slate-950">Total Likes</div>
              </div>
            </div>

            {/* Metric 4: Total Comments (Soft Peach Coral #feece4) */}
            <div
              style={{ backgroundColor: "#feece4" }}
              className="rounded-[24px] p-4 sm:p-5 flex flex-col justify-between shadow-xs border-0 min-h-[90px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-3xl font-black text-slate-950 tabular-nums">
                  {vaultStats.totalComments > 999
                    ? `${(vaultStats.totalComments / 1000).toFixed(1)}k`
                    : vaultStats.totalComments}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                  <MessageCircle size={15} className="text-amber-700" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xs sm:text-sm font-bold text-slate-950">Total Comments</div>
              </div>
            </div>
          </div>

          {/* Vault Search & Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search by creator handle or caption..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-[#e9e9ee] text-xs sm:text-sm focus:outline-none focus:border-black bg-white shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-xs font-semibold text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2 px-3 rounded-full border border-[#e9e9ee] text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-black cursor-pointer shadow-2xs"
              >
                <option value="newest">Newest First</option>
                <option value="likes">Most Likes</option>
                <option value="comments">Most Comments</option>
              </select>
            </div>
          </div>

          {/* Responsive Saved Reels Grid: 2-col on mobile, 3-col on tablet, 4-col on desktop */}
          {displayedSavedReels.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {displayedSavedReels.map((item) => (
                <div
                  key={item.shortcode}
                  className="group relative aspect-[9/15] rounded-[22px] overflow-hidden bg-slate-950 shadow-2xs border border-[#e9e9ee] flex flex-col justify-between hover:shadow-md transition-all duration-300"
                >
                  {item.thumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.thumbnail}
                      alt={item.caption || "Saved reel"}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white/40">
                      <Film size={32} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

                  {/* Top Bar: Creator & Delete */}
                  <div className="relative z-10 p-2.5 sm:p-3 flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-xs font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 truncate max-w-[110px]">
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

                  {/* Bottom Bar: Stats & Quick Download Actions */}
                  <div className="relative z-10 p-2.5 sm:p-3 space-y-2">
                    <p className="text-[11px] sm:text-xs text-white/90 line-clamp-2 font-medium drop-shadow-sm">
                      {item.caption || "Instagram Reel"}
                    </p>

                    <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-white/15">
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-white/90">
                        <span className="flex items-center gap-1">
                          <Heart size={11} className="fill-white" />
                          <span>{item.likes > 999 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.videoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              triggerDownload(item.videoUrl!, `reel-${item.shortcode}.mp4`, "video")
                            }
                            className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-xs cursor-pointer active:scale-90 hover:scale-105 transition-transform"
                            title="Download MP4 to device"
                          >
                            <Download size={12} />
                          </button>
                        )}

                        {item.thumbnail && (
                          <button
                            type="button"
                            onClick={() =>
                              triggerDownload(item.thumbnail!, `cover-${item.shortcode}.jpg`, "image")
                            }
                            className="w-7 h-7 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-xs cursor-pointer active:scale-90 hover:scale-105 transition-transform"
                            title="Download Cover (.jpg)"
                          >
                            <ImageIcon size={12} />
                          </button>
                        )}

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center border border-white/20 !no-underline"
                          title="View on Instagram"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-[#e9e9ee] bg-white p-8 sm:p-12 text-center space-y-3 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#f1f3f7] text-slate-400 mx-auto flex items-center justify-center">
                <Bookmark size={22} />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-950">
                {filterQuery ? "No matching reels found" : "Your Vault is Empty"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {filterQuery
                  ? "Try searching for a different keyword or username."
                  : "Save reels to your vault to organize, view, and re-download them anytime."}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("downloader")}
                className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold cursor-pointer active:scale-95"
              >
                Go to Downloader
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
