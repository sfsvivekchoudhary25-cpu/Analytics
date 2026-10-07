"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  App,
  Tooltip,
  Spin,
  Empty,
  Progress,
  Modal,
} from "antd";
import {
  SearchOutlined,
  FireOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  CheckOutlined,
  InstagramOutlined,
  HeartFilled,
  HeartOutlined,
  MessageFilled,
  MessageOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  ExportOutlined,
  RiseOutlined,
  BarChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api";

type HashtagMediaItem = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  permalink?: string;
  like_count?: number;
  comments_count?: number;
  timestamp: string;
};

type HashtagDetail = {
  id: string;
  name: string;
  isLive: boolean;
  searchedAt: string;
  appReviewRequired?: boolean;
  analytics?: {
    estimatedPosts: number;
    competitionLevel: "Low" | "Medium" | "High";
    avgLikes: number;
    avgComments: number;
    viralityScore: number;
    relatedTags: string[];
    bestPostingWindow: string;
  };
};

type RecentlySearchedResponse = {
  searches: { id: string; name: string; searchedAt: string }[];
  count: number;
  limit: number;
  rollingWindowDays: number;
};

const SUGGESTED_TAGS = [
  "explore",
  "viral",
  "creator",
  "reels",
  "marketing",
  "photography",
  "fashion",
  "fitness",
  "travel",
  "design",
];

function cleanTag(tag: string): string {
  return String(tag || "")
    .replace(/^#+/, "")
    .trim()
    .toLowerCase();
}

function formatLikes(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) {
    const formatted = (num / 1_000).toFixed(num >= 10_000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, "")}K`;
  }
  return String(num);
}

export function HashtagSearch() {
  const { message } = App.useApp();
  const [query, setQuery] = useState("viral");
  const [loading, setLoading] = useState(false);
  const [hashtag, setHashtag] = useState<HashtagDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"top" | "recent" | "all" | "photos" | "reels">("top");
  const [mediaList, setMediaList] = useState<HashtagMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<RecentlySearchedResponse | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [sortBy, setSortBy] = useState<"likes" | "comments" | "newest">("likes");

  // Selected media modal
  const [selectedPost, setSelectedPost] = useState<HashtagMediaItem | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // References to keep handleSearch stable and prevent re-render search reset loops
  const queryRef = useRef(query);
  queryRef.current = query;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const mountedRef = useRef(false);

  // Load recently searched quota info on mount
  const loadQuota = useCallback(async () => {
    try {
      const data = await api<RecentlySearchedResponse>("/hashtags/recently-searched");
      setQuotaInfo(data);
    } catch {
      // non-critical
    }
  }, []);

  // Load media items when active hashtag changes
  const loadMedia = useCallback(async (hashtagId: string, edgeType: "top" | "recent") => {
    setLoadingMedia(true);
    try {
      const res = await api<{
        hashtagId: string;
        type: string;
        data: HashtagMediaItem[];
        isDemoData?: boolean;
      }>(`/hashtags/${hashtagId}/media?type=${edgeType}&limit=24`);
      setMediaList(res.data || []);
    } catch {
      message.error("Failed to fetch media for this hashtag.");
      setMediaList([]);
    } finally {
      setLoadingMedia(false);
    }
  }, [message]);

  // Search handler - stable across query state changes
  const handleSearch = useCallback(
    async (tagToSearch?: string) => {
      const raw = tagToSearch !== undefined ? tagToSearch : queryRef.current;
      const clean = cleanTag(raw);

      if (!clean) {
        message.warning("Please enter a hashtag name to search.");
        return;
      }

      if (/[\s\p{Extended_Pictographic}]/u.test(clean)) {
        message.error("Hashtags cannot contain spaces or emojis per Meta API rules.");
        return;
      }

      setLoading(true);
      try {
        const result = await api<HashtagDetail>(`/hashtags/search?q=${encodeURIComponent(clean)}`);
        setHashtag(result);
        setQuery(clean);
        loadQuota();
        loadMedia(result.id, activeTabRef.current === "recent" ? "recent" : "top");
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Hashtag search failed");
      } finally {
        setLoading(false);
      }
    },
    [loadQuota, loadMedia, message],
  );

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    loadQuota();
    handleSearch("viral");
  }, [loadQuota, handleSearch]);

  const handleTabChange = (tab: "top" | "recent" | "all" | "photos" | "reels") => {
    setActiveTab(tab);
    if (hashtag?.id) {
      if (tab === "recent") {
        loadMedia(hashtag.id, "recent");
      } else if (tab === "top" || tab === "all" || tab === "photos" || tab === "reels") {
        loadMedia(hashtag.id, "top");
      }
    }
  };

  const handleCopyTag = (tagName: string) => {
    const text = `#${cleanTag(tagName)}`;
    navigator.clipboard.writeText(text);
    setCopiedTag(tagName);
    message.success(`Copied ${text}`);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleCopyAllRelated = () => {
    if (!hashtag?.analytics?.relatedTags) return;
    const tagsText = hashtag.analytics.relatedTags
      .map((t) => `#${cleanTag(t)}`)
      .join(" ");
    navigator.clipboard.writeText(tagsText);
    setCopiedAll(true);
    message.success(`Copied ${hashtag.analytics.relatedTags.length} hashtags`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyPostCaption = (caption?: string) => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    message.success("Caption copied");
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  // Filtered & sorted media list
  const processedMedia = useMemo(() => {
    let list = [...mediaList];

    if (activeTab === "photos") {
      list = list.filter((m) => m.media_type === "IMAGE");
    } else if (activeTab === "reels") {
      list = list.filter((m) => m.media_type === "VIDEO");
    }

    if (sortBy === "likes") {
      list.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
    } else if (sortBy === "comments") {
      list.sort((a, b) => (b.comments_count ?? 0) - (a.comments_count ?? 0));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return list;
  }, [mediaList, activeTab, sortBy]);

  const usedCount = quotaInfo?.count ?? 2;
  const quotaLimit = quotaInfo?.limit ?? 30;
  const remainingCount = Math.max(0, quotaLimit - usedCount);

  return (
    <div className="space-y-6 w-full">
      {/* ── 1. Header Card (Search & Quota) ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle background ambient purple glow */}
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-l from-purple-100/30 via-indigo-50/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Hashtag Search
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 font-normal">
              Discover top viral media, analyze engagement benchmarks, and search public Instagram hashtags.
            </p>
          </div>

          {/* Quota Badge */}
          <div className="inline-flex items-center gap-1.5 self-start md:self-auto bg-slate-50/90 border border-slate-200/80 px-3 py-1.5 rounded-full text-xs text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-slate-900">{remainingCount} of {quotaLimit}</span>
            <span className="text-slate-500 font-normal">searches left this week</span>
            <Tooltip title="Meta enforces a limit of 30 unique hashtags searched per Instagram account within any rolling 7-day period. Repeated queries on the same hashtag within 7 days do not count against your limit.">
              <InfoCircleOutlined className="text-slate-400 hover:text-slate-600 cursor-pointer ml-0.5" />
            </Tooltip>
          </div>
        </div>

        {/* Search Input Row */}
        <div className="mt-6 relative z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-3 max-w-2xl"
          >
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-base select-none">
                #
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any hashtag..."
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <SearchOutlined className="text-sm" />
              <span>Search</span>
            </button>
          </form>

          {/* Suggestions row */}
          <div className="mt-3.5 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-normal mr-1">Suggestions:</span>
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSearch(tag)}
                className="px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-normal transition-colors border border-slate-200/70 text-xs cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Active Hashtag Card (Topic Overview & 5 KPI Cards) ──── */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <Spin size="large" />
          <p className="mt-3 text-sm text-slate-500 font-normal">
            Fetching hashtag insights and media...
          </p>
        </div>
      ) : hashtag ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Soft purple/indigo # squircle */}
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-2xs">
                #
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    #{cleanTag(hashtag.name)}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Meta Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Copy Tag, Refresh, Open on Instagram */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleCopyTag(hashtag.name)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedTag === hashtag.name ? (
                  <CheckOutlined className="text-emerald-600" />
                ) : (
                  <CopyOutlined className="text-slate-400" />
                )}
                <span>{copiedTag === hashtag.name ? "Copied" : "Copy Tag"}</span>
              </button>
              <button
                onClick={() => handleSearch(hashtag.name)}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs shadow-2xs transition-all cursor-pointer"
                title="Refresh"
              >
                <ReloadOutlined />
              </button>
              <a
                href={`https://www.instagram.com/explore/tags/${cleanTag(hashtag.name)}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 font-medium text-xs shadow-2xs transition-all flex items-center gap-1.5"
              >
                <InstagramOutlined className="text-sm text-indigo-600" />
                <span>Open on Instagram</span>
                <ExportOutlined className="text-[10px]" />
              </a>
            </div>
          </div>

          {/* 5 KPI Metric Cards Row */}
          {hashtag.analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 1. Global Volume */}
              <div className="bg-gradient-to-br from-blue-50/50 via-white to-blue-50/70 rounded-2xl p-4.5 border border-blue-100/80 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                <svg
                  className="absolute -bottom-1 -right-1 w-28 h-16 text-blue-100/70 pointer-events-none"
                  viewBox="0 0 100 50"
                  fill="currentColor"
                >
                  <path d="M0 50 Q 30 20, 60 35 T 100 15 L 100 50 Z" opacity="0.6" />
                  <path d="M20 50 Q 50 30, 80 40 T 100 25 L 100 50 Z" opacity="0.4" />
                </svg>

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center text-sm">
                      <BarChartOutlined />
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Global Volume
                    </span>
                  </div>
                  <div className="text-2xl lg:text-[26px] font-bold tracking-tight text-slate-900 mt-2">
                    {formatLikes(hashtag.analytics.estimatedPosts)}+
                  </div>
                </div>
                <div className="relative z-10 mt-2">
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <RiseOutlined /> {hashtag.analytics.estimatedPosts > 1_000_000 ? "High Activity" : hashtag.analytics.estimatedPosts > 150_000 ? "Moderate Activity" : "Steady Activity"}
                  </span>
                </div>
              </div>

              {/* 2. Competition */}
              <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-50/70 rounded-2xl p-4.5 border border-amber-100/80 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                <svg
                  className="absolute -bottom-1 -right-1 w-28 h-16 text-amber-100/70 pointer-events-none"
                  viewBox="0 0 100 50"
                  fill="currentColor"
                >
                  <path d="M0 50 Q 40 15, 70 30 T 100 10 L 100 50 Z" opacity="0.6" />
                  <path d="M15 50 Q 45 25, 75 35 T 100 20 L 100 50 Z" opacity="0.4" />
                </svg>

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center text-sm">
                      <TrophyOutlined />
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Competition
                    </span>
                  </div>
                  <div className="text-2xl lg:text-[26px] font-bold tracking-tight text-slate-900 mt-2">
                    {hashtag.analytics.competitionLevel}
                  </div>
                </div>
                <div className="relative z-10 mt-2">
                  <span className="text-xs font-normal text-slate-500">
                    {hashtag.analytics.competitionLevel === "High"
                      ? "Optimal for 10k–100k"
                      : hashtag.analytics.competitionLevel === "Medium"
                      ? "Optimal for 5k–25k"
                      : "Optimal for <10k"}
                  </span>
                </div>
              </div>

              {/* 3. Virality Score */}
              <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/60 rounded-2xl p-4.5 border border-indigo-100/80 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center text-sm">
                      <HeartOutlined />
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Virality Score
                    </span>
                  </div>
                  <div className="text-2xl lg:text-[26px] font-bold tracking-tight text-slate-900 mt-2">
                    {hashtag.analytics.viralityScore} <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                </div>
                <div className="relative z-10 mt-2">
                  <Progress
                    percent={hashtag.analytics.viralityScore}
                    showInfo={false}
                    size="small"
                    strokeColor="#3b82f6"
                    railColor="#e2e8f0"
                  />
                </div>
              </div>

              {/* 4. Avg Likes / Post */}
              <div className="bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/60 rounded-2xl p-4.5 border border-emerald-100/80 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center text-sm">
                      <MessageOutlined />
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Avg Likes / Post
                    </span>
                  </div>
                  <div className="text-2xl lg:text-[26px] font-bold tracking-tight text-slate-900 mt-2">
                    {hashtag.analytics.avgLikes.toLocaleString()}
                  </div>
                </div>
                <div className="relative z-10 mt-2">
                  <span className="text-xs font-normal text-slate-500">
                    ~{hashtag.analytics.avgComments} comments/post
                  </span>
                </div>
              </div>

              {/* 5. Peak Posting Slot */}
              <div className="bg-gradient-to-br from-rose-50/40 via-white to-rose-50/60 rounded-2xl p-4.5 border border-rose-100/80 shadow-2xs relative overflow-hidden sm:col-span-2 lg:col-span-1 flex flex-col justify-between min-h-[135px]">
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center text-sm">
                      <ClockCircleOutlined />
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Peak Posting Slot
                    </span>
                  </div>
                  <div className="text-lg lg:text-xl font-bold tracking-tight text-slate-900 mt-2">
                    {hashtag.analytics.bestPostingWindow || "6:00 PM – 9:00 PM"}
                  </div>
                </div>
                <div className="relative z-10 mt-2">
                  <span className="text-xs font-normal text-slate-500">
                    Optimal audience activity
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Related Hashtags Row */}
          {hashtag.analytics?.relatedTags && hashtag.analytics.relatedTags.length > 0 && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-normal text-slate-400 mr-1">Related:</span>
                {hashtag.analytics.relatedTags.map((rawTag) => {
                  const tagItem = cleanTag(rawTag);
                  return (
                    <button
                      key={tagItem}
                      onClick={() => handleSearch(tagItem)}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-normal transition-colors border border-slate-200/60 cursor-pointer"
                    >
                      #{tagItem}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleCopyAllRelated}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedAll ? <CheckOutlined className="text-emerald-600" /> : <CopyOutlined className="text-slate-400" />}
                <span>{copiedAll ? "Copied" : `Copy All (${hashtag.analytics.relatedTags.length})`}</span>
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* ── 3. Bottom Media Explorer ─────────────────────────────────── */}
      <div className="space-y-4">
        {/* Navigation / Tabs & Sorter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 px-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
            {/* Top Media (Viral) - Active tab */}
            <button
              onClick={() => handleTabChange("top")}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-all py-1 cursor-pointer whitespace-nowrap ${
                activeTab === "top"
                  ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                  : "text-slate-500 hover:text-slate-900 font-normal"
              }`}
            >
              <FireOutlined className="text-amber-500" />
              <span>Top Media (Viral)</span>
            </button>

            {/* Recent Media */}
            <button
              onClick={() => handleTabChange("recent")}
              className={`flex items-center gap-1.5 text-xs transition-all py-1 cursor-pointer whitespace-nowrap ${
                activeTab === "recent"
                  ? "text-indigo-600 border-b-2 border-indigo-600 pb-1 font-semibold"
                  : "text-slate-500 hover:text-slate-900 font-normal"
              }`}
            >
              <ClockCircleOutlined className="text-blue-500" />
              <span>Recent Media</span>
            </button>

            {/* All */}
            <button
              onClick={() => handleTabChange("all")}
              className={`flex items-center gap-1 text-xs transition-all py-1 cursor-pointer whitespace-nowrap ${
                activeTab === "all"
                  ? "text-indigo-600 border-b-2 border-indigo-600 pb-1 font-semibold"
                  : "text-slate-500 hover:text-slate-900 font-normal"
              }`}
            >
              <AppstoreOutlined />
              <span>All</span>
            </button>

            {/* Photos */}
            <button
              onClick={() => handleTabChange("photos")}
              className={`flex items-center gap-1 text-xs transition-all py-1 cursor-pointer whitespace-nowrap ${
                activeTab === "photos"
                  ? "text-indigo-600 border-b-2 border-indigo-600 pb-1 font-semibold"
                  : "text-slate-500 hover:text-slate-900 font-normal"
              }`}
            >
              <PictureOutlined />
              <span>Photos</span>
            </button>

            {/* Reels */}
            <button
              onClick={() => handleTabChange("reels")}
              className={`flex items-center gap-1 text-xs transition-all py-1 cursor-pointer whitespace-nowrap ${
                activeTab === "reels"
                  ? "text-indigo-600 border-b-2 border-indigo-600 pb-1 font-semibold"
                  : "text-slate-500 hover:text-slate-900 font-normal"
              }`}
            >
              <VideoCameraOutlined />
              <span>Reels</span>
            </button>
          </div>

          {/* Sorter */}
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span className="font-normal">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-normal focus:outline-none cursor-pointer"
            >
              <option value="likes">Most Likes</option>
              <option value="comments">Most Comments</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* 4-Column Media Grid (Landscape Ratio Cards) */}
        {loadingMedia ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <Spin size="large" />
            <p className="mt-3 text-sm text-slate-500 font-normal">Loading media...</p>
          </div>
        ) : processedMedia.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <Empty description="No media found for this view." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {processedMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedPost(item)}
                className="group relative aspect-[16/11] rounded-2xl overflow-hidden bg-slate-900 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {/* Media Image */}
                <img
                  src={item.media_url}
                  alt={item.caption || "Instagram media"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=80";
                  }}
                />

                {/* Top-Left Badge (Photo / Carousel / Reel) */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-normal flex items-center gap-1.5 shadow-xs">
                    {item.media_type === "CAROUSEL_ALBUM" ? (
                      <>
                        <AppstoreOutlined className="text-white text-xs" /> Carousel
                      </>
                    ) : item.media_type === "VIDEO" ? (
                      <>
                        <VideoCameraOutlined className="text-pink-400 text-xs" /> Reel
                      </>
                    ) : (
                      <>
                        <PictureOutlined className="text-white text-xs" /> Photo
                      </>
                    )}
                  </span>
                </div>

                {/* Bottom Overlay: Stats on Left, Bookmark on Right */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-xs font-normal z-10">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <HeartFilled className="text-rose-500 text-xs" />
                      {formatLikes(item.like_count ?? 128000)}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <MessageFilled className="text-white text-xs" />
                      {formatLikes(item.comments_count ?? 1200)}
                    </span>
                  </div>

                  {/* Bookmark ribbon icon */}
                  <svg
                    className="w-4 h-4 text-white/90 hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Focused Post Lightbox Modal ─────────────────────────────── */}
      <Modal
        open={!!selectedPost}
        onCancel={() => setSelectedPost(null)}
        footer={null}
        width={720}
        centered
      >
        {selectedPost && (
          <div className="flex flex-col md:flex-row gap-6 p-2">
            <div className="w-full md:w-1/2 aspect-[4/5] bg-black rounded-xl overflow-hidden relative shadow-md">
              <img
                src={selectedPost.media_url}
                alt="Post preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-xs font-normal">
                  {selectedPost.media_type === "CAROUSEL_ALBUM"
                    ? "Carousel"
                    : selectedPost.media_type === "VIDEO"
                    ? "Reel"
                    : "Photo"}
                </span>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <InstagramOutlined className="text-base text-pink-500" />
                    <span>Instagram Discovery Post</span>
                  </div>
                  <span className="text-xs text-slate-400 font-normal">
                    {new Date(selectedPost.timestamp).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <HeartFilled className="text-rose-500" /> Likes
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {(selectedPost.like_count ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <MessageFilled className="text-blue-500" /> Comments
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {(selectedPost.comments_count ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Caption
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto border border-slate-200/80 font-normal">
                    {selectedPost.caption || "No caption available."}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleCopyPostCaption(selectedPost.caption)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedCaption ? <CheckOutlined className="text-emerald-600" /> : <CopyOutlined />}
                  <span>{copiedCaption ? "Copied" : "Copy Caption"}</span>
                </button>
                {selectedPost.permalink && (
                  <a
                    href={selectedPost.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <InstagramOutlined className="text-pink-400" />
                    <span>View on Instagram</span>
                    <ExportOutlined className="text-[10px]" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
