"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Button,
  Tag,
  Badge,
  Progress,
  Alert,
  Table,
  Dropdown,
  Tooltip,
  Empty,
  Skeleton,
  Segmented,
  Modal,
  Input,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CommentOutlined,
  SendOutlined,
  MessageOutlined,
  CameraOutlined,
  ReloadOutlined,
  PlusOutlined,
  CalendarOutlined,
  EllipsisOutlined,
  InstagramOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DownOutlined,
  UpOutlined,
  EyeOutlined,
  HeartOutlined,
  ShareAltOutlined,
  BookOutlined,
  LinkOutlined,
  LineChartOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  PlayCircleOutlined,
  AppstoreOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api";
import { LineChart, Point } from "./LineChart";
import { MultiLineChart } from "./MultiLineChart";
import { NotificationBell, AccountAvatar } from "./HeaderControls";
import { PostDetail } from "./PostDetail";

// ── Types ─────────────────────────────────────────────────────────────

type Profile = {
  username: string;
  name?: string;
  biography?: string;
  website?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url?: string;
};

type Media = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
};

type InsightsOverview = {
  days: number;
  profile: Profile | null;
  media: Media[];
  totals: Record<string, number | null>;
  series: { reach: Point[]; followers: Point[] };
  errors: Record<string, string>;
};

type DashboardOverview = {
  days: number;
  commentsReceived: number;
  dmsSent: number;
  replies: number;
  conversions: number;
  deltas: {
    commentsReceived: number | null;
    dmsSent: number | null;
    replies: number | null;
    conversions: number | null;
  };
  series: {
    date: string;
    comments: number;
    dmsSent: number;
    replies: number;
    conversions: number;
  }[];
  recentDms: {
    username: string;
    message: string;
    type: string;
    status: "sent" | "replied" | "failed";
    time: string;
  }[];
};

type Props = {
  onOpenAutomations?: () => void;
  pendingPhotos?: number;
  onOpenPhotos?: () => void;
  username?: string;
  onOpenAccount?: () => void;
  onOpenMessages?: (user?: string, text?: string) => void;
};

// ── Helper Utilities ──────────────────────────────────────────────────

const compact = (n: number | null | undefined) =>
  n == null ? "—" : Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

const dateRangeLabel = (days: number) => {
  const end = new Date();
  const start = new Date(Date.now() - (days - 1) * 86_400_000);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
};

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const fmtPostDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function trend(series: Point[]): { pct: number; up: boolean } | null {
  if (!series || series.length < 2) return null;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  if (!first) return null;
  return { pct: Math.round(Math.abs(((last - first) / first) * 100)), up: last >= first };
}

// ── Resilient Post Thumbnail Component ────────────────────────────────

function PostMediaThumbnail({ post }: { post: Media }) {
  const [loadFailed, setLoadFailed] = useState(false);

  // For VIDEO/REELS: Instagram provides thumbnail_url for the JPEG image; media_url is the MP4 file!
  const preferredUrl =
    post.media_type === "VIDEO"
      ? post.thumbnail_url || post.media_url
      : post.media_url || post.thumbnail_url;

  if (loadFailed || !preferredUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-900 p-4 text-center text-white">
        <InstagramOutlined className="text-3xl text-pink-400 mb-2" />
        <span className="text-[11px] font-medium text-slate-300 line-clamp-2 px-2 leading-relaxed">
          {post.caption || (post.media_type === "VIDEO" ? "Instagram Video" : "Instagram Post")}
        </span>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={preferredUrl}
      alt={post.caption?.slice(0, 60) || "Instagram post"}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setLoadFailed(true)}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

// ── Granular Per-Element Skeletons ─────────────────────────────────────

function ProfileHeroSkeleton() {
  return (
    <Card
      className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs"
      styles={{ body: { padding: 0 } }}
    >
      <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-center gap-3.5 min-w-0">
          <Skeleton.Avatar active size={52} shape="circle" className="!shrink-0" />
          <div className="space-y-2 py-1 min-w-0 flex-1">
            <Skeleton.Input active size="small" style={{ width: 140, height: 18 }} />
            <Skeleton.Input active size="small" style={{ width: 180, height: 14 }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-3 shrink-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 px-2 py-2 sm:px-3.5 sm:py-2.5 shadow-2xs space-y-1.5 text-center min-w-0"
            >
              <Skeleton.Input active size="small" style={{ width: 36, height: 16 }} />
              <Skeleton.Input active size="small" style={{ width: 48, height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function KpiCardSkeleton() {
  return (
    <Card
      className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs"
      styles={{ body: { padding: "20px 22px" } }}
    >
      <div className="flex flex-col justify-between min-h-[110px]">
        <div>
          <div className="flex items-center justify-between">
            <Skeleton.Input active size="small" style={{ width: 85, height: 14 }} />
            <Skeleton.Avatar active size={32} shape="square" className="!rounded-xl" />
          </div>
          <div className="mt-2.5">
            <Skeleton.Input active size="large" style={{ width: 75, height: 28 }} />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <Skeleton.Button active size="small" style={{ width: 56, height: 20 }} className="!rounded-full" />
          <Skeleton.Input active size="small" style={{ width: 60, height: 12 }} />
        </div>
      </div>
    </Card>
  );
}

function AnalyticsChartSkeleton() {
  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <Skeleton.Button active size="small" style={{ width: 95, height: 24 }} className="!rounded-lg" />
          <Skeleton.Button active size="small" style={{ width: 85, height: 24 }} className="!rounded-lg" />
        </div>
        <Skeleton.Button active size="small" style={{ width: 120, height: 24 }} className="!rounded-lg" />
      </div>

      <div className="relative h-[220px] w-full flex items-end justify-between gap-2.5 px-6 pb-6 pt-4 rounded-xl bg-slate-50/50 border border-dashed border-slate-200">
        {[25, 45, 30, 65, 50, 75, 40, 85, 60, 95, 70, 45, 80, 55, 90].map((h, i) => (
          <div
            key={i}
            className="w-full rounded-t-md bg-slate-200/70 skeleton-pulse"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FunnelCardSkeleton() {
  return (
    <div className="flex-1 flex flex-col justify-between space-y-2.5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Skeleton.Avatar active size={28} shape="square" className="!rounded-lg" />
              <Skeleton.Input active size="small" style={{ width: 110, height: 14 }} />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton.Input active size="small" style={{ width: 36, height: 14 }} />
              <Skeleton.Input active size="small" style={{ width: 32, height: 12 }} />
            </div>
          </div>
          <Skeleton.Button active block size="small" style={{ height: 6 }} className="!rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EngagementCardSkeleton() {
  return (
    <div className="flex-1 flex flex-col justify-between space-y-3">
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2">
            <div className="flex items-center gap-2.5">
              <Skeleton.Avatar active size={10} shape="circle" />
              <Skeleton.Input active size="small" style={{ width: 75, height: 14 }} />
            </div>
            <Skeleton.Input active size="small" style={{ width: 50, height: 14 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2.5 border-t border-slate-100 pt-3">
        <div className="flex-1 rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100 space-y-1">
          <Skeleton.Input active size="small" style={{ width: 45, height: 18 }} />
          <Skeleton.Input active size="small" style={{ width: 75, height: 12 }} />
        </div>
        <div className="flex-1 rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100 space-y-1">
          <Skeleton.Input active size="small" style={{ width: 45, height: 18 }} />
          <Skeleton.Input active size="small" style={{ width: 65, height: 12 }} />
        </div>
      </div>
    </div>
  );
}

function PostsShowcaseSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
        >
          <div className="relative aspect-square w-full bg-slate-100 skeleton-pulse" />
          <div className="flex flex-1 flex-col p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton.Input active size="small" style={{ width: 60, height: 12 }} />
              <Skeleton.Input active size="small" style={{ width: 50, height: 12 }} />
            </div>
            <Skeleton.Input active block size="small" style={{ height: 12 }} />
            <Skeleton.Input active size="small" style={{ width: "70%", height: 12 }} />
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <Skeleton.Button active size="small" style={{ width: 45, height: 22 }} className="!rounded-lg" />
              <Skeleton.Button active size="small" style={{ width: 45, height: 22 }} className="!rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentDmsTableSkeleton() {
  return (
    <div className="space-y-3.5 py-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
        >
          <div className="flex items-center gap-2.5 w-1/4">
            <Skeleton.Avatar active size={32} shape="circle" />
            <Skeleton.Input active size="small" style={{ width: 90, height: 14 }} />
          </div>
          <Skeleton.Input active size="small" style={{ width: "35%", height: 14 }} />
          <Skeleton.Button active size="small" style={{ width: 75, height: 22 }} className="!rounded-full" />
          <Skeleton.Button active size="small" style={{ width: 55, height: 20 }} className="!rounded-full" />
          <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard Component ──────────────────────────────────────────

export function Dashboard({
  onOpenAutomations,
  pendingPhotos = 0,
  onOpenPhotos,
  username,
  onOpenAccount,
  onOpenMessages,
}: Props) {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [insights, setInsights] = useState<InsightsOverview | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [dashError, setDashError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Media | null>(null);

  const [dashLoading, setDashLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const [tick, setTick] = useState(0);
  const [activeChart, setActiveChart] = useState<"reach" | "automations">("reach");
  const [postSort, setPostSort] = useState<"recent" | "top">("recent");
  const [rightWidgetTab, setRightWidgetTab] = useState<"funnel" | "engagement">("funnel");

  const [showAllPostsModal, setShowAllPostsModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalMediaType, setModalMediaType] = useState<string>("ALL");
  const [modalSort, setModalSort] = useState<"recent" | "top">("recent");

  useEffect(() => {
    let cancelled = false;
    setDashLoading(true);
    setInsightsLoading(true);

    api<DashboardOverview>(`/dashboard/overview?days=${days}`).then(
      (d) => {
        if (!cancelled) {
          setData(d);
          setDashError(null);
          setDashLoading(false);
        }
      },
      (e: Error) => {
        if (!cancelled) {
          setDashError(e.message);
          setDashLoading(false);
        }
      }
    );

    api<InsightsOverview>(`/instagram/insights/overview?days=${days}`).then(
      (i) => {
        if (!cancelled) {
          setInsights(i);
          setInsightsError(null);
          setInsightsLoading(false);
        }
      },
      (e: Error) => {
        if (!cancelled) {
          setInsightsError(e.message);
          setInsightsLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [days, tick]);

  const profile = insights?.profile;
  const totals = insights?.totals ?? {};
  const reachSeries = insights?.series?.reach ?? [];
  const reachTrend = trend(reachSeries);

  const isAnyLoading = dashLoading || insightsLoading;

  // Engagement calculation
  const engagement = [
    { label: "Likes", value: totals.likes, dot: "bg-rose-500", icon: <HeartOutlined className="text-rose-500" /> },
    { label: "Comments", value: totals.comments, dot: "bg-blue-500", icon: <CommentOutlined className="text-blue-500" /> },
    { label: "Shares", value: totals.shares, dot: "bg-amber-500", icon: <ShareAltOutlined className="text-amber-500" /> },
    { label: "Saves", value: totals.saves, dot: "bg-emerald-500", icon: <BookOutlined className="text-emerald-500" /> },
  ];
  const engTotal = engagement.reduce((n, e) => n + (e.value ?? 0), 0);
  const engagementRate = totals.reach ? Math.round(((totals.total_interactions ?? 0) / totals.reach) * 1000) / 10 : null;
  const saveRate = totals.reach ? Math.round(((totals.saves ?? 0) / totals.reach) * 1000) / 10 : null;

  // Funnel setup
  const funnel = data
    ? [
        {
          key: "comments",
          icon: <CommentOutlined className="text-base text-blue-600" />,
          badgeBg: "bg-blue-50 border-blue-200/60",
          progressColor: "#2563eb",
          label: "Comments received",
          value: data.commentsReceived,
        },
        {
          key: "dms",
          icon: <SendOutlined className="text-base text-indigo-600" />,
          badgeBg: "bg-indigo-50 border-indigo-200/60",
          progressColor: "#6366f1",
          label: "Comment DMs sent",
          value: data.dmsSent,
        },
        {
          key: "replies",
          icon: <MessageOutlined className="text-base text-emerald-600" />,
          badgeBg: "bg-emerald-50 border-emerald-200/60",
          progressColor: "#10b981",
          label: "Replies to those DMs",
          value: data.replies,
        },
        {
          key: "conversions",
          icon: <CameraOutlined className="text-base text-purple-600" />,
          badgeBg: "bg-purple-50 border-purple-200/60",
          progressColor: "#9333ea",
          label: "Converted to a photo",
          value: data.conversions,
        },
      ]
    : [];

  const funnelTop = Math.max(1, funnel[0]?.value || 1);

  // Posts sorting
  const score = (m: Media) => (m.like_count ?? 0) + (m.comments_count ?? 0);
  const posts = [...(insights?.media ?? [])].sort((a, b) =>
    postSort === "top" ? score(b) - score(a) : +new Date(b.timestamp) - +new Date(a.timestamp)
  );

  // Media counts for filters
  const reelsCount = useMemo(() => (insights?.media ?? []).filter((p) => p.media_type === "VIDEO").length, [insights?.media]);
  const photosCount = useMemo(() => (insights?.media ?? []).filter((p) => p.media_type === "IMAGE").length, [insights?.media]);
  const carouselsCount = useMemo(() => (insights?.media ?? []).filter((p) => p.media_type === "CAROUSEL_ALBUM").length, [insights?.media]);

  // Filtered and sorted posts for the All Posts modal
  const modalFilteredPosts = useMemo(() => {
    return posts
      .filter((p) => {
        if (modalMediaType !== "ALL" && p.media_type !== modalMediaType) return false;
        if (modalSearch.trim()) {
          const q = modalSearch.toLowerCase().trim();
          return (p.caption || "").toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) =>
        modalSort === "top" ? score(b) - score(a) : +new Date(b.timestamp) - +new Date(a.timestamp)
      );
  }, [posts, modalMediaType, modalSearch, modalSort]);

  // Show Post Detail page if a post is selected
  if (selectedPost) {
    return (
      <PostDetail
        mediaId={selectedPost.id}
        mediaThumb={selectedPost.thumbnail_url || selectedPost.media_url}
        mediaPermalink={selectedPost.permalink}
        caption={selectedPost.caption}
        postedAt={selectedPost.timestamp}
        likeCount={selectedPost.like_count}
        commentsCount={selectedPost.comments_count}
        mediaType={selectedPost.media_type}
        onBack={() => setSelectedPost(null)}
        onOpenMessages={onOpenMessages}
      />
    );
  }

  // Table columns for Recent DMs
  const dmColumns: ColumnsType<DashboardOverview["recentDms"][number]> = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (u: string) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white shadow-xs">
            {u ? u.charAt(0).toUpperCase() : "?"}
          </span>
          <a
            href={`https://instagram.com/${u}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>@{u || "unknown"}</span>
          </a>
        </div>
      ),
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (m: string) => (
        <Tooltip title={m} placement="topLeft">
          <span className="text-slate-700 font-normal">{m}</span>
        </Tooltip>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (t: string) => {
        const colorMap: Record<string, string> = {
          "Comment DM": "purple",
          "Auto DM": "blue",
          "AI DM": "magenta",
          "Manual DM": "default",
          "System DM": "gold",
        };
        return (
          <Tag color={colorMap[t] || "default"} className="!rounded-full px-2.5 py-0.5 text-xs font-medium">
            {t}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: "sent" | "replied" | "failed") => {
        if (s === "replied") {
          return <Badge status="success" text={<span className="text-xs font-medium text-emerald-700">Replied</span>} />;
        }
        if (s === "sent") {
          return <Badge status="processing" color="#2563eb" text={<span className="text-xs font-medium text-blue-700">Sent</span>} />;
        }
        return <Badge status="error" text={<span className="text-xs font-medium text-rose-700">Failed</span>} />;
      },
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      render: (iso: string) => <span className="text-xs text-slate-500 whitespace-nowrap">{when(iso)}</span>,
    },
    {
      title: "",
      key: "actions",
      width: 48,
      align: "right",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "profile",
                icon: <InstagramOutlined />,
                label: (
                  <a href={`https://instagram.com/${record.username}`} target="_blank" rel="noreferrer">
                    View profile on Instagram
                  </a>
                ),
              },
              ...(onOpenAutomations
                ? [
                    {
                      key: "automation",
                      icon: <ThunderboltOutlined />,
                      label: "Open automation",
                      onClick: onOpenAutomations,
                    },
                  ]
                : []),
            ],
          }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            shape="circle"
            icon={<EllipsisOutlined className="text-slate-400 hover:text-slate-700" />}
            size="small"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-8 md:gap-10">
      {/* ── Top Hero Card (Exact Match to Design Reference) ───────────── */}
      <div className="relative overflow-hidden rounded-[26px] border border-slate-100 bg-white p-3.5 sm:p-6 md:p-7 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.03)]">
        {/* Subtle ambient violet/purple and blue gradient glow on the right */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-gradient-to-br from-purple-200/40 via-pink-100/25 to-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute right-4 bottom-0 h-48 w-48 rounded-full bg-gradient-to-tr from-blue-100/30 to-purple-100/25 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          {/* Title & Live Hub Badge */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                Dashboard
              </h1>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 border border-blue-200/60 px-3 py-1 text-xs font-semibold text-blue-600 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live Hub</span>
              </div>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed truncate lg:max-w-md xl:max-w-xl">
              Instagram performance, account growth analytics, and automated messaging.
            </p>
          </div>

          {/* Action Toolbar & Header Controls - Single row on desktop, responsive toolbar on mobile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 lg:flex-initial min-w-0">
              {/* 1. Date Range Dropdown with calendar icon and right chevron */}
              <Dropdown
                menu={{
                  items: [
                    { key: "7", label: "Last 7 days", onClick: () => setDays(7) },
                    { key: "14", label: "Last 14 days", onClick: () => setDays(14) },
                    { key: "30", label: "Last 30 days", onClick: () => setDays(30) },
                  ],
                  selectedKeys: [String(days)],
                }}
                trigger={["click"]}
                disabled={isAnyLoading}
              >
                <Button className="!flex-1 lg:!flex-initial !flex !items-center !justify-between !gap-2 sm:!gap-2.5 !h-10 sm:!h-10.5 md:!h-11 !rounded-xl sm:!rounded-2xl !border-slate-200/90 !bg-white !px-3 sm:!px-4 !text-xs sm:!text-sm !font-semibold !text-slate-800 hover:!border-slate-300 hover:!bg-slate-50/50 !shadow-2xs transition-all active:scale-[0.99] whitespace-nowrap min-w-0">
                  <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap min-w-0">
                    <CalendarOutlined className="text-slate-600 text-xs sm:text-sm md:text-base shrink-0" />
                    <span className="whitespace-nowrap font-medium text-slate-800 text-[11px] sm:text-xs md:text-sm truncate">{dateRangeLabel(days)}</span>
                  </span>
                  <DownOutlined className="text-[9px] sm:text-[10px] text-slate-400 shrink-0 ml-1.5" />
                </Button>
              </Dropdown>

              {/* 2. Refresh Button */}
              <Tooltip title="Refresh data">
                <Button
                  icon={isAnyLoading ? <LoadingOutlined className="text-blue-600 text-sm" /> : <ReloadOutlined className="text-slate-700 text-sm" />}
                  onClick={() => setTick((n) => n + 1)}
                  disabled={isAnyLoading}
                  className="!flex !items-center !justify-center !h-10 !w-10 sm:!h-10.5 sm:!w-10.5 md:!h-11 md:!w-11 !shrink-0 !rounded-xl sm:!rounded-2xl !border-slate-200/90 !bg-white hover:!border-slate-300 hover:!bg-slate-50/50 !shadow-2xs transition-colors active:scale-95"
                  aria-label="Refresh data"
                />
              </Tooltip>

              {/* 3. Automations Primary CTA */}
              {onOpenAutomations && (
                <Button
                  type="primary"
                  icon={<PlusOutlined className="text-xs sm:text-sm font-bold" />}
                  onClick={onOpenAutomations}
                  className="!flex !items-center !justify-center !gap-1 sm:!gap-1.5 !h-10 sm:!h-10.5 md:!h-11 !shrink-0 !rounded-xl sm:!rounded-2xl !bg-[#1677ff] hover:!bg-[#155dfc] !px-3.5 sm:!px-4.5 !text-xs sm:!text-sm !font-bold !text-white !shadow-[0_4px_14px_rgba(22,119,255,0.28)] hover:!shadow-[0_6px_20px_rgba(22,119,255,0.38)] active:scale-98 transition-all whitespace-nowrap"
                >
                  <span>Automations</span>
                </Button>
              )}
            </div>

            {/* Desktop-only secondary header controls (Bell & Avatar) in the same line */}
            {(onOpenPhotos || (username && onOpenAccount)) && (
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200/80 ml-1.5 shrink-0">
                {onOpenPhotos && <NotificationBell pendingPhotos={pendingPhotos} onClick={onOpenPhotos} />}
                {username && onOpenAccount && <AccountAvatar username={username} onClick={onOpenAccount} />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Notices */}
      {dashError && (
        <Alert
          type="error"
          showIcon
          title="Could not load automations overview"
          description={dashError}
          closable
          className="rounded-xl border-red-200 bg-red-50/80"
        />
      )}

      {insightsError && (
        <Alert
          type="warning"
          showIcon
          title="Some Instagram analytics could not be retrieved"
          description={insightsError}
          closable
          className="rounded-xl border-amber-200 bg-amber-50/80"
        />
      )}

      {/* ── Main Dashboard Elements with Reinforced Spacing ─────────── */}
      <div className="flex flex-col gap-8 md:gap-10">
        {/* ── 1. Instagram Profile & Account Hero Banner ──────────────── */}
        {insightsLoading ? (
          <ProfileHeroSkeleton />
        ) : profile ? (
          <Card
            className="!rounded-2xl !border-slate-200/80 !bg-gradient-to-r !from-white !via-slate-50/40 !to-blue-50/20 !shadow-xs"
            styles={{ body: { padding: 0 } }}
          >
            <div className="p-4 sm:p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
              {/* User Profile Header (Mobile & Desktop) */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="relative shrink-0">
                  {profile.profile_picture_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={profile.profile_picture_url}
                      alt={profile.username}
                      referrerPolicy="no-referrer"
                      className="h-13 w-13 sm:h-16 sm:w-16 rounded-full object-cover ring-2 ring-blue-500/20 shadow-sm"
                    />
                  ) : (
                    <span className="flex h-13 w-13 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-900 text-base sm:text-lg font-bold text-white shadow-sm">
                      {profile.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-white ring-2 ring-white">
                    <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <h2 className="text-sm sm:text-lg font-bold text-slate-950 truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
                      @{profile.username}
                    </h2>
                    <Tag
                      color="success"
                      className="!m-0 !rounded-full !px-2 !py-0.5 !text-[10px] sm:!text-[11px] !font-medium flex items-center gap-1 shrink-0"
                    >
                      <CheckCircleFilled className="text-[10px]" /> Connected
                    </Tag>
                  </div>
                  {profile.name && (
                    <p className="text-xs font-normal text-slate-500 mt-0.5 truncate">{profile.name}</p>
                  )}
                  {profile.biography && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600 max-w-xl">{profile.biography}</p>
                  )}
                </div>
              </div>

              {/* Account Metric Pills - Responsive 3-Column Grid on Mobile, Flex on Desktop */}
              <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-3 shrink-0 pt-1 sm:pt-0">
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white/95 px-2 py-2.5 sm:px-4 sm:min-w-[84px] shadow-2xs hover:shadow-xs transition-shadow text-center min-w-0">
                  <span className="text-sm sm:text-base font-bold text-slate-950 tabular-nums">
                    {compact(profile.followers_count)}
                  </span>
                  <span className="text-[11px] sm:text-xs font-normal text-slate-500 mt-0.5">Followers</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white/95 px-2 py-2.5 sm:px-4 sm:min-w-[84px] shadow-2xs hover:shadow-xs transition-shadow text-center min-w-0">
                  <span className="text-sm sm:text-base font-bold text-slate-950 tabular-nums">
                    {compact(profile.follows_count)}
                  </span>
                  <span className="text-[11px] sm:text-xs font-normal text-slate-500 mt-0.5">Following</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white/95 px-2 py-2.5 sm:px-4 sm:min-w-[84px] shadow-2xs hover:shadow-xs transition-shadow text-center min-w-0">
                  <span className="text-sm sm:text-base font-bold text-slate-950 tabular-nums">
                    {compact(profile.media_count)}
                  </span>
                  <span className="text-[11px] sm:text-xs font-normal text-slate-500 mt-0.5">Posts</span>
                </div>

                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 text-xs font-medium text-blue-600 hover:text-blue-700 shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    <LinkOutlined />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        {/* ── 2. Primary KPI Strip (Growth & Reach + Automations) ──────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Key Performance Indicators
            </h2>
            <span className="text-xs text-slate-400">Past {days} days</span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Metric 1: Total Reach */}
            {insightsLoading ? (
              <KpiCardSkeleton />
            ) : (
              <Card
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!border-blue-300 hover:!shadow-md transition-all duration-200 group"
                styles={{ body: { padding: "20px 22px" } }}
              >
                <div className="flex flex-col justify-between min-h-[110px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">
                        Total Reach
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                        <LineChartOutlined className="text-sm" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                        {compact(totals.reach)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center">
                    {reachTrend ? (
                      <Tag
                        color={reachTrend.up ? "success" : "error"}
                        className="!rounded-full px-2 py-0.2 text-xs font-medium !m-0"
                      >
                        {reachTrend.up ? <ArrowUpOutlined className="mr-0.5" /> : <ArrowDownOutlined className="mr-0.5" />}
                        {reachTrend.pct}%
                      </Tag>
                    ) : (
                      <span className="text-xs text-slate-400">Total accounts seen</span>
                    )}
                    <span className="ml-1.5 text-xs text-slate-400">in period</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Metric 2: Impressions / Views */}
            {insightsLoading ? (
              <KpiCardSkeleton />
            ) : (
              <Card
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!border-indigo-300 hover:!shadow-md transition-all duration-200 group"
                styles={{ body: { padding: "20px 22px" } }}
              >
                <div className="flex flex-col justify-between min-h-[110px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">
                        Content Views
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                        <EyeOutlined className="text-sm" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                        {compact(totals.views)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{compact(totals.accounts_engaged)}</span>
                    <span className="ml-1 text-slate-400">accounts engaged</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Metric 3: Total Interactions */}
            {insightsLoading ? (
              <KpiCardSkeleton />
            ) : (
              <Card
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!border-rose-300 hover:!shadow-md transition-all duration-200 group"
                styles={{ body: { padding: "20px 22px" } }}
              >
                <div className="flex flex-col justify-between min-h-[110px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">
                        Interactions
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                        <HeartOutlined className="text-sm" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                        {compact(totals.total_interactions)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center">
                    {engagementRate != null ? (
                      <Tag color="magenta" className="!rounded-full px-2 py-0.2 text-xs font-medium !m-0">
                        {engagementRate}% engagement
                      </Tag>
                    ) : (
                      <span className="text-xs text-slate-400">Likes, comments & shares</span>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Metric 4: Comment DMs Sent */}
            {dashLoading ? (
              <KpiCardSkeleton />
            ) : data ? (
              <Card
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!border-emerald-300 hover:!shadow-md transition-all duration-200 group"
                styles={{ body: { padding: "20px 22px" } }}
              >
                <div className="flex flex-col justify-between min-h-[110px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">
                        Comment DMs Sent
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                        <SendOutlined className="text-sm" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                        {compact(data.dmsSent)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center">
                    {data.deltas.dmsSent != null ? (
                      <Tag
                        color={data.deltas.dmsSent >= 0 ? "success" : "error"}
                        className="!rounded-full px-2 py-0.2 text-xs font-medium !m-0"
                      >
                        {data.deltas.dmsSent >= 0 ? <ArrowUpOutlined className="mr-0.5" /> : <ArrowDownOutlined className="mr-0.5" />}
                        {Math.abs(data.deltas.dmsSent)}%
                      </Tag>
                    ) : (
                      <span className="text-xs text-slate-400">{data.replies} replies received</span>
                    )}
                    <span className="ml-1.5 text-xs text-slate-400">vs last period</span>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        {/* ── 3. Deep Dive Charts & Engagement Breakdown ──────────────── */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_24rem] items-stretch">
          {/* Left: Tabbed Analytics Chart Card */}
          <Card
            className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!shadow-md transition-shadow flex flex-col h-full"
            styles={{ body: { padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column" } }}
            title={
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-1">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {activeChart === "reach" ? "Daily Reach Performance" : "Automated Messages Over Time"}
                  </h2>
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    {activeChart === "reach"
                      ? `Organic account reach trend over the last ${days} days`
                      : `Comment-to-DM triggers, dispatches, and replies over ${days} days`}
                  </p>
                </div>
                <Segmented
                  size="small"
                  value={activeChart}
                  onChange={(val) => setActiveChart(val as "reach" | "automations")}
                  options={[
                    { label: "Daily Reach", value: "reach", icon: <LineChartOutlined /> },
                    { label: "Automations", value: "automations", icon: <ThunderboltOutlined /> },
                  ]}
                  className="!rounded-lg !bg-slate-100 !p-0.5 text-xs self-start sm:self-auto shrink-0"
                />
              </div>
            }
          >
            {activeChart === "reach" ? (
              insightsLoading ? (
                <AnalyticsChartSkeleton />
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <LineChart data={reachSeries} label="Reach" />
                  {reachSeries.length === 0 && (
                    <p className="mt-3 text-xs text-slate-400 text-center">
                      Instagram reach insights are populated as soon as post impressions occur.
                    </p>
                  )}
                </div>
              )
            ) : dashLoading ? (
              <AnalyticsChartSkeleton />
            ) : data ? (
              <div className="flex-1 flex flex-col justify-between">
                <MultiLineChart
                  dates={data.series.map((s) => s.date)}
                  series={[
                    {
                      key: "comments",
                      label: "Comments",
                      color: "#2563eb",
                      data: data.series.map((s) => s.comments),
                    },
                    {
                      key: "dmsSent",
                      label: "Comment DMs Sent",
                      color: "#60a5fa",
                      data: data.series.map((s) => s.dmsSent),
                    },
                    {
                      key: "replies",
                      label: "Replies",
                      color: "#10b981",
                      data: data.series.map((s) => s.replies),
                    },
                    {
                      key: "conversions",
                      label: "Converted",
                      color: "#9333ea",
                      data: data.series.map((s) => s.conversions),
                    },
                  ]}
                />
              </div>
            ) : null}
          </Card>

          {/* Right: Funnel & Engagement Unified Card (Locked Height & Sleek Tabs) */}
          <Card
            className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!shadow-md transition-shadow flex flex-col h-full"
            styles={{
              body: {
                padding: "20px 22px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              },
            }}
            title={
              <div className="py-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                    {rightWidgetTab === "funnel" ? "Conversion Funnel" : "Engagement Breakdown"}
                  </span>
                  <Segmented
                    size="small"
                    value={rightWidgetTab}
                    onChange={(val) => setRightWidgetTab(val as "funnel" | "engagement")}
                    options={[
                      { label: "Funnel", value: "funnel" },
                      { label: "Engagement", value: "engagement" },
                    ]}
                    className="!rounded-lg !bg-slate-100 !p-0.5 text-xs shrink-0"
                  />
                </div>
                <p className="text-xs font-normal text-slate-500 mt-0.5 truncate">
                  {rightWidgetTab === "funnel"
                    ? "Comments reaching each lead stage"
                    : `Total ${compact(engTotal)} actions over ${days} days`}
                </p>
              </div>
            }
          >
            {rightWidgetTab === "funnel" ? (
              dashLoading ? (
                <FunnelCardSkeleton />
              ) : (
                <div className="flex-1 flex flex-col justify-between space-y-2.5">
                  {funnel.map((f) => {
                    const percentOfTop = Math.round((f.value / funnelTop) * 1000) / 10;
                    return (
                      <div
                        key={f.key}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${f.badgeBg}`}>
                              {f.icon}
                            </span>
                            <span className="text-xs font-medium text-slate-700">{f.label}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold tabular-nums text-slate-900">
                              {f.value.toLocaleString()}
                            </span>
                            <span className="ml-1 text-[11px] font-medium tabular-nums text-blue-600">
                              {percentOfTop}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress
                            percent={percentOfTop}
                            showInfo={false}
                            strokeColor={f.progressColor}
                            size="small"
                            className="!m-0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : insightsLoading ? (
              <EngagementCardSkeleton />
            ) : (
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  {engagement.map((e) => {
                    const pct = engTotal > 0 && e.value != null ? Math.round((e.value / engTotal) * 100) : 0;
                    return (
                      <div
                        key={e.label}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <span className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${e.dot}`} />
                          {e.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tabular-nums text-slate-900">
                            {e.value != null ? e.value.toLocaleString() : "—"}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(engagementRate != null || saveRate != null) && (
                  <div className="flex gap-2.5 border-t border-slate-100 pt-3">
                    {engagementRate != null && (
                      <div className="flex-1 rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
                        <div className="text-base font-semibold text-slate-900">{engagementRate}%</div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5">Engagement Rate</div>
                      </div>
                    )}
                    {saveRate != null && (
                      <div className="flex-1 rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
                        <div className="text-base font-semibold text-slate-900">{saveRate}%</div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5">Save Rate</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ── 4. Recent & Top Instagram Posts Showcase ────────────────── */}
        {insightsLoading ? (
          <Card
            className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs"
            styles={{ body: { padding: "24px" } }}
            title={
              <div>
                <h2 className="text-base font-semibold text-slate-900">Instagram Posts & Media</h2>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  Recent posts and engagement metrics on your connected account
                </p>
              </div>
            }
          >
            <PostsShowcaseSkeleton />
          </Card>
        ) : posts.length > 0 ? (
          <Card
            className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!shadow-md transition-shadow"
            styles={{ body: { padding: "24px" } }}
            title={
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-1">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Instagram Posts & Media</h2>
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    Recent posts and engagement metrics on your connected account
                  </p>
                </div>
                <Segmented
                  size="small"
                  value={postSort}
                  onChange={(val) => setPostSort(val as "recent" | "top")}
                  options={[
                    { label: "Most Recent", value: "recent" },
                    { label: "Top Engaged", value: "top" },
                  ]}
                  className="!rounded-lg !bg-slate-100 !p-0.5 text-xs self-start sm:self-auto"
                />
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {posts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPost(p)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all hover:border-blue-300 hover:shadow-md cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                    <PostMediaThumbnail post={p} />
                    <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs shadow-xs">
                      {p.media_type === "VIDEO" ? <PlayCircleOutlined /> : null}
                      {p.media_type === "VIDEO" ? "Reel" : p.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Photo"}
                    </span>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-600/70 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow">
                        <EyeOutlined />
                        View Analytics
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{fmtPostDate(p.timestamp)}</span>
                        <a
                          href={p.permalink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <span>Instagram</span>
                          <LinkOutlined className="text-[10px]" />
                        </a>
                      </div>

                      {p.caption ? (
                        <p className="line-clamp-2 text-xs text-slate-700 leading-relaxed font-normal">
                          {p.caption}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No caption</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium">
                      <span className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-rose-600 border border-rose-100/80">
                        <HeartOutlined />
                        <span className="tabular-nums font-semibold">{p.like_count ?? 0}</span>
                      </span>
                      <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-600 border border-blue-100/80">
                        <CommentOutlined />
                        <span className="tabular-nums font-semibold">{p.comments_count ?? 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Centered "View All" Button Action */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <Button
                type="primary"
                size="middle"
                onClick={() => setShowAllPostsModal(true)}
                className="!h-10 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !px-6 !text-xs !font-semibold !text-white shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer transition-all"
                icon={<AppstoreOutlined className="text-sm" />}
              >
                <span>View All Posts</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">
                  {posts.length}
                </span>
                <RightOutlined className="text-[10px]" />
              </Button>
            </div>

            {/* ── Modal: All Instagram Posts & Media ───────────────────── */}
            <Modal
              open={showAllPostsModal}
              onCancel={() => setShowAllPostsModal(false)}
              footer={null}
              width={1160}
              centered
              destroyOnHidden
              styles={{
                body: {
                  padding: "20px 24px",
                  maxHeight: "82vh",
                  overflowY: "auto",
                },
              }}
              title={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      <AppstoreOutlined className="text-lg" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">All Instagram Posts & Media</h2>
                        <Tag color="blue" className="!rounded-md !px-2 !py-0.5 text-xs font-semibold !border-0">
                          {posts.length} Posts
                        </Tag>
                      </div>
                      <p className="text-xs font-normal text-slate-500 mt-0.5">
                        Click on any post card to open its detailed analytics, performance metrics & DM rules
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              {/* Modal Filters & Search Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 my-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
                <div className="w-full md:w-72">
                  <Input
                    placeholder="Search captions..."
                    prefix={<SearchOutlined className="text-slate-400 mr-1" />}
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    allowClear
                    size="middle"
                    className="!rounded-lg !bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Segmented
                    size="middle"
                    value={modalMediaType}
                    onChange={(val) => setModalMediaType(val as string)}
                    options={[
                      { label: `All (${posts.length})`, value: "ALL" },
                      { label: `Reels (${reelsCount})`, value: "VIDEO" },
                      { label: `Photos (${photosCount})`, value: "IMAGE" },
                      { label: `Carousels (${carouselsCount})`, value: "CAROUSEL_ALBUM" },
                    ]}
                    className="!rounded-lg !bg-slate-200/60 !p-0.5 text-xs font-medium"
                  />

                  <Segmented
                    size="middle"
                    value={modalSort}
                    onChange={(val) => setModalSort(val as "recent" | "top")}
                    options={[
                      { label: "Most Recent", value: "recent" },
                      { label: "Top Engaged", value: "top" },
                    ]}
                    className="!rounded-lg !bg-slate-200/60 !p-0.5 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Posts Grid */}
              {modalFilteredPosts.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Empty
                    description={
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-700">No posts matched your filters</p>
                        <p className="text-xs text-slate-400 mt-1">Try clearing your search query or choosing another media type.</p>
                      </div>
                    }
                  >
                    {(modalSearch || modalMediaType !== "ALL") && (
                      <Button
                        size="small"
                        onClick={() => {
                          setModalSearch("");
                          setModalMediaType("ALL");
                        }}
                        className="!rounded-lg !text-xs !font-medium"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Empty>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1">
                  {modalFilteredPosts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setShowAllPostsModal(false);
                        setSelectedPost(p);
                      }}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all hover:border-blue-400 hover:shadow-lg cursor-pointer hover:-translate-y-0.5"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                        <PostMediaThumbnail post={p} />
                        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs shadow-xs">
                          {p.media_type === "VIDEO" ? <PlayCircleOutlined /> : null}
                          {p.media_type === "VIDEO" ? "Reel" : p.media_type === "CAROUSEL_ALBUM" ? "Carousel" : "Photo"}
                        </span>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600/75 opacity-0 transition-opacity group-hover:opacity-100 gap-2 p-3 text-center">
                          <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-md">
                            <EyeOutlined />
                            View Analytics
                          </span>
                          <span className="text-[11px] text-white/90 font-medium">Click to see reach & metrics</span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-3.5 gap-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{fmtPostDate(p.timestamp)}</span>
                            <a
                              href={p.permalink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <span>Instagram</span>
                              <LinkOutlined className="text-[10px]" />
                            </a>
                          </div>

                          {p.caption ? (
                            <p className="line-clamp-2 text-xs text-slate-700 leading-relaxed font-normal">
                              {p.caption}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No caption</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-medium">
                          <span className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-rose-600 border border-rose-100/80">
                            <HeartOutlined />
                            <span className="tabular-nums font-semibold">{p.like_count ?? 0}</span>
                          </span>
                          <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-600 border border-blue-100/80">
                            <CommentOutlined />
                            <span className="tabular-nums font-semibold">{p.comments_count ?? 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Modal>
          </Card>
        ) : null}

        {/* ── 5. Recent Instagram DMs Table ───────────────────────────── */}
        <Card
          className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!shadow-md transition-shadow"
          styles={{ body: { padding: "24px" } }}
          title={
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Instagram DMs</h2>
              <p className="text-xs font-normal text-slate-500 mt-0.5">
                Every DM sent from any source (Comment-to-DM, AI replies, keywords)
              </p>
            </div>
          }
          extra={
            onOpenAutomations && (
              <Button
                onClick={onOpenAutomations}
                className="!rounded-lg !border-slate-200 !text-xs !font-medium text-slate-700 hover:!border-blue-400 hover:!text-blue-600 shadow-2xs"
              >
                View All Automations
              </Button>
            )
          }
        >
          {dashLoading ? (
            <RecentDmsTableSkeleton />
          ) : !data || data.recentDms.length === 0 ? (
            <Empty
              description={
                <span className="text-sm text-slate-500">
                  No automated DMs sent yet. Turn on Comment-to-DM automation to see them appear here.
                </span>
              }
              className="py-10"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table
                dataSource={data.recentDms.map((d, index) => ({
                  ...d,
                  key: `${d.username}-${d.time}-${index}`,
                }))}
                columns={dmColumns}
                pagination={false}
                size="middle"
                className="modern-antd-table"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
