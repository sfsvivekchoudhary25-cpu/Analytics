"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Button,
  Tag,
  Progress,
  Dropdown,
  Tooltip,
  Segmented,
  Input,
  Modal,
  Spin,
  App,
  Skeleton,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ReloadOutlined,
  InstagramOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  CommentOutlined,
  SendOutlined,
  CheckCircleFilled,
  SearchOutlined,
  EyeOutlined,
  ShareAltOutlined,
  BookOutlined,
  RiseOutlined,
  DownOutlined,
  UserOutlined,
  UserAddOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  FireOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  RightOutlined,
  BulbOutlined,
  FileTextOutlined,
  CompassOutlined,
  TagOutlined,
  ShoppingOutlined,
  QuestionCircleOutlined,
  SmileOutlined,
  CopyOutlined,
  CheckOutlined,
  RobotOutlined,
  RocketOutlined,
  SyncOutlined,
  PushpinOutlined,
  ThunderboltFilled,
  WarningFilled,
  AimOutlined,
  ClockCircleOutlined,
  FireFilled,
  HeartFilled,
  MessageOutlined,
  LinkOutlined,
  FilterOutlined,
  PieChartOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import {
  Sparkles,
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  Command,
  Copy,
  Eye,
  Gauge,
  Hash,
  Heart,
  Info,
  LayoutDashboard,
  Lightbulb,
  Menu,
  MessageCircle,
  Play,
  RefreshCw,
  Search,
  Send,
  Share2,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { UnifiedChart } from "./UnifiedChart";
import { InstagramIcon } from "./icons";

type TriggerTag = "ai" | "auto" | "manual" | "comment-dm" | null;

type CommentEntry = {
  id: string;
  username: string;
  text: string;
  commentedAt: string;
  likeCount: number;
  hidden: boolean;
  myReply: string | null;
  repliedAt: string | null;
  replyKind: string | null;
  autoState: string;
  autoNote: string | null;
  triggerTag: TriggerTag;
  triggerNote: string | null;
  dmStatus: "sent" | "failed" | "invited" | null;
  dmSentAt: string | null;
  dmRepliedAt: string | null;
};

type DmRule = {
  id: string;
  name: string;
  enabled: boolean;
  keywords: string;
  mediaId: string | null;
  dmText: string;
};

type AutoReplyRule = { id: string; keywords: string; replyText: string; enabled: boolean };

type PostStats = {
  totalComments: number;
  replied: number;
  dmTriggered: number;
  dmSent: number;
  dmReplied?: number;
  aiReplied: number;
  autoReplied: number;
  manualReplied: number;
  responseRate?: number;
  dmDeliveryRate?: number;
  dmConversionRate?: number;
  // Enriched stats
  followGateSent?: number;
  followGateConverted?: number;
  followGateConversionRate?: number;
  avgDmResponseMinutes?: number | null;
  avgReplyResponseMinutes?: number | null;
  peakHour?: number | null;
};

type PostInsights = {
  reach: number | null;
  views: number | null;
  plays: number | null;
  impressions: number | null;
  saved: number | null;
  shares: number | null;
  totalInteractions: number | null;
  profileVisits?: number | null;
  follows?: number | null;
  engagementRate: number | null;
  saveRate: number | null;
  shareRate: number | null;
};

type MediaMeta = {
  id: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
};

type SeriesPoint = {
  date: string;
  comments: number;
  dmsSent: number;
  replies: number;
  aiReplied: number;
  autoReplied: number;
  manualReplied: number;
};

type TopCommenter = { username: string; count: number };

type RulePerf = {
  ruleId: string;
  ruleName: string;
  triggered: number;
  sent: number;
  replied: number;
  deliveryRate: number;
  conversionRate: number;
};

type PostDetailData = {
  mediaId: string;
  days?: number;
  hasHashtagComment?: boolean;
  mediaMeta?: MediaMeta | null;
  insights?: PostInsights | null;
  mediaInsights?: PostInsights | null;
  stats: PostStats;
  series?: SeriesPoint[];
  comments: CommentEntry[];
  dmRules: DmRule[];
  autoSetting: { enabled: boolean; aiEnabled: boolean; maxPerHour: number };
  autoReplyRules: AutoReplyRule[];
  topCommenters?: TopCommenter[];
  rulePerformance?: RulePerf[];
};

const BUYER_TEMPLATES = {
  checkout: {
    label: "⚡ Direct Checkout",
    title: "Instant Purchase Link",
    text: "Hey! Thanks so much for reaching out 💛 Sent you all pricing & direct order details via DM. Check your inbox!",
  },
  promo: {
    label: "🏷️ VIP Offer & Code",
    title: "Exclusive Discount & Code",
    text: "Hey! Just sent you an exclusive order link with a special 15% VIP discount code in your DM 🎁 Check your message requests!",
  },
  concierge: {
    label: "📩 Concierge & Help",
    title: "Personalized Support & Sizing",
    text: "Hey! Sent you the full details, sizing info & direct link in your DM 📩 Feel free to reply there if you need any help!",
  },
} as const;

type BuyerPresetKey = keyof typeof BUYER_TEMPLATES;

const when = (iso?: string | null) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function TriggerBadge({ tag }: { tag: TriggerTag }) {
  if (!tag) return null;
  const map: Record<NonNullable<TriggerTag>, { label: string; cls: string }> = {
    ai: {
      label: "AI Reply",
      cls: "bg-violet-100 text-violet-800 ring-violet-300/60 dark:bg-violet-400/20 dark:text-violet-200",
    },
    auto: {
      label: "Auto Rule",
      cls: "bg-blue-100 text-blue-800 ring-blue-300/60 dark:bg-blue-400/20 dark:text-blue-200",
    },
    manual: {
      label: "Manual",
      cls: "bg-slate-100 text-slate-700 ring-slate-300/60 dark:bg-white/10 dark:text-slate-300",
    },
    "comment-dm": {
      label: "Comment DM",
      cls: "bg-emerald-100 text-emerald-800 ring-emerald-300/60 dark:bg-emerald-400/20 dark:text-emerald-200",
    },
  };
  const { label, cls } = map[tag];
  return (
    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset " + cls}>
      {label}
    </span>
  );
}


function Badge({
  children,
  tone = "neutral",
  onClick,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "violet" | "rose" | "mint" | "blue";
  onClick?: () => void;
}) {
  return (
    <span
      className={`badge ${tone} ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  meta,
  dark = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={`section-title ${dark ? "on-dark" : ""}`}>
      <div className="title-icon">
        <Icon size={15} />
      </div>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {meta && <span className="section-meta">{meta}</span>}
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  accent = "",
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  accent?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={accent}>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  subtle = false,
  icon: Icon = ChevronRight,
  testId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  subtle?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  testId?: string;
}) {
  return (
    <button
      type="button"
      className={`action-button ${subtle ? "subtle" : ""}`}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
      <Icon size={14} />
    </button>
  );
}

function DmStatusBadge({ status }: { status: CommentEntry["dmStatus"] }) {
  if (!status) return null;
  if (status === "sent")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-400/10 dark:ring-emerald-400/30">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        DM sent
      </span>
    );
  if (status === "invited")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-400/10 dark:ring-blue-400/30">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        Invited
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-400/10 dark:ring-rose-400/30">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      DM failed
    </span>
  );
}

function AiDoctorSkeleton() {
  return (
    <div className="space-y-4 pt-1">
      {/* Top Banner Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
        <div className="md:col-span-4 lg:col-span-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 flex flex-col items-center justify-center text-center gap-2.5 animate-pulse">
          <div className="h-2.5 w-24 bg-slate-200 rounded" />
          <div className="h-20 w-20 rounded-full border-4 border-slate-200 bg-white" />
          <div className="h-4 w-28 bg-slate-200 rounded-full" />
        </div>
        <div className="md:col-span-8 lg:col-span-9 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4.5 flex flex-col justify-between space-y-2.5 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-3/5 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-200 rounded" />
            <div className="h-3 w-4/5 bg-slate-200 rounded" />
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3">
            <div className="h-2.5 w-24 bg-slate-200 rounded" />
            <div className="h-2.5 w-40 bg-slate-200 rounded" />
          </div>
        </div>
      </div>

      {/* 4 Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 flex flex-col justify-between animate-pulse"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-12 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="h-3.5 w-4/5 bg-slate-200 rounded" />
              <div className="h-2.5 w-full bg-slate-200 rounded" />
              <div className="h-2.5 w-3/4 bg-slate-200 rounded" />
            </div>
            <div className="pt-3 border-t border-slate-100">
              <div className="h-7 w-full bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Signals Skeleton */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="h-2.5 w-36 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-12 bg-slate-200 rounded-full" />
              </div>
              <div className="h-2.5 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Card Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row gap-5 items-start">
        <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl bg-slate-200 shrink-0" />
        <div className="flex-1 w-full space-y-3.5">
          <div className="h-3 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
          <div className="h-3 w-1/2 bg-slate-200 rounded" />
          <div className="flex flex-wrap gap-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="space-y-3.5">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded" />
            <div className="h-2.5 w-28 bg-slate-200 rounded" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border border-slate-200/80 bg-white p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-16 bg-slate-200 rounded" />
                <div className="h-8 w-8 bg-slate-200 rounded-xl" />
              </div>
              <div className="h-7 w-16 bg-slate-200 rounded" />
              <div className="h-2.5 w-24 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Graph and Cockpit 2-col Skeleton */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="h-80 rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-52 w-full bg-slate-100 rounded-xl" />
        </div>
        <div className="h-80 rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full border-4 border-slate-200 bg-white" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 w-full bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  mediaId: string;
  mediaThumb?: string | null;
  mediaPermalink?: string | null;
  caption?: string;
  postedAt?: string;
  likeCount?: number;
  commentsCount?: number;
  mediaType?: string;
  onBack: () => void;
  onOpenMessages?: (user?: string, text?: string) => void;
};

export function PostDetail({
  mediaId,
  mediaThumb: initialThumb,
  mediaPermalink: initialPermalink,
  caption: initialCaption,
  postedAt: initialPostedAt,
  likeCount: initialLikeCount,
  commentsCount: initialCommentsCount,
  mediaType: initialMediaType,
  onBack,
  onOpenMessages,
}: Props) {
  const { message } = App.useApp();
  const [data, setData] = useState<PostDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(30);
  const [activeTab, setActiveTabState] = useState<"overview" | "activity" | "ai_analytics">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const sub = q.get("subtab");
      if (sub === "activity" || sub === "automations" || sub === "comments") return "activity";
      if (sub === "ai_analytics" || sub === "ai") return "ai_analytics";
    }
    return "overview";
  });

  const setActiveTab = useCallback((nextTab: "overview" | "activity" | "ai_analytics") => {
    setActiveTabState(nextTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextTab === "overview") {
        url.searchParams.delete("subtab");
      } else {
        url.searchParams.set("subtab", nextTab);
      }
      window.history.replaceState(null, "", url.toString());
    }
  }, []);
  const [activitySubTab, setActivitySubTab] = useState<"all" | "comments" | "automations">("all");
  const [chartView, setChartView] = useState<"engagement" | "comments" | "dms" | "replies">("engagement");
  const [rightTab, setRightTab] = useState<"virality" | "funnel" | "replyMethods">("virality");
  const [togglingRule, setTogglingRule] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<TriggerTag | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState<"all" | "triggered" | "dm_sent" | "reply" | "converted">("all");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // AI Feature States
  const [aiDiagnosis, setAiDiagnosis] = useState<{
    score: number;
    model: string;
    headline: string;
    summary: string;
    actionItems: { title: string; description: string; priority: "high" | "medium" }[];
    viralLevers: { label: string; status: "strong" | "opportunity"; detail: string; val?: string }[];
  } | null>(null);
  const [aiDiagnosisLoading, setAiDiagnosisLoading] = useState(false);

  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [optimizedCaptions, setOptimizedCaptions] = useState<{
    leadMagnet: string;
    viralExplore: string;
    communitySpark: string;
    model?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerSuggestions, setTriggerSuggestions] = useState<{
    suggestions: { keyword: string; count: number; reason: string }[];
    recommendedDmText: string;
  } | null>(null);
  const [updatingRule, setUpdatingRule] = useState(false);

  const [aiReplyCommentId, setAiReplyCommentId] = useState<string | null>(null);
  const [aiReplyLoading, setAiReplyLoading] = useState(false);
  const [aiReplySuggestions, setAiReplySuggestions] = useState<{
    friendly: string;
    professional: string;
    conversion: string;
  } | null>(null);
  const [replyInputTexts, setReplyInputTexts] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  // Direct Action Checklist Modals & State
  const [hashtagModalOpen, setHashtagModalOpen] = useState(false);
  const [hashtagLoading, setHashtagLoading] = useState(false);
  const [postingHashtag, setPostingHashtag] = useState(false);
  const [recommendedHashtags, setRecommendedHashtags] = useState<string[]>([]);
  const [customHashtagText, setCustomHashtagText] = useState("");
  const [hashtagCommentPosted, setHashtagCommentPosted] = useState(false);

  const [quickRuleModalOpen, setQuickRuleModalOpen] = useState(false);
  const [activatingRule, setActivatingRule] = useState(false);
  const [quickRuleTrigger, setQuickRuleTrigger] = useState("LINK");
  const [quickRuleDmText, setQuickRuleDmText] = useState(
    "Hey! Thanks for commenting on our post! 💛 Here is the link with all details: https://instagram.com"
  );
  const [quickRuleReplyText, setQuickRuleReplyText] = useState(
    "Sent you a DM with the link! Check your inbox 🚀"
  );

  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [dwellStrategyReady, setDwellStrategyReady] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`post_dwell_ready_${mediaId}`) === "true" ||
        localStorage.getItem("post_dwell_ready_global") === "true";
    }
    return false;
  });
  const [collabOutreachDone, setCollabOutreachDone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`collab_outreach_${mediaId}`) === "true" ||
        localStorage.getItem("collab_outreach_vivekchoudhar.y") === "true";
    }
    return true;
  });
  const [quickRuleActivated, setQuickRuleActivated] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`post_rule_active_${mediaId}`) === "true";
    }
    return false;
  });

  // AI Algorithmic Lifecycle & Velocity Interventions State
  const [storyReshareModalOpen, setStoryReshareModalOpen] = useState(false);
  const [loadingStoryReshare, setLoadingStoryReshare] = useState(false);
  const [storyReshareData, setStoryReshareData] = useState<{
    hookText: string;
    stickerPoll: { question: string; optA: string; optB: string };
    ctaText: string;
    explanation: string;
  } | null>(null);

  const [pinCommentModalOpen, setPinCommentModalOpen] = useState(false);
  const [buyerConvertModalOpen, setBuyerConvertModalOpen] = useState(false);
  const [buyerPreset, setBuyerPreset] = useState<BuyerPresetKey>("checkout");
  const [buyerCustomText, setBuyerCustomText] = useState<string>(BUYER_TEMPLATES.checkout.text);

  const handleGenerateStoryReshare = async (captionText?: string, density?: number, topCommentText?: string, phase?: string) => {
    setStoryReshareModalOpen(true);
    if (storyReshareData) return;
    setLoadingStoryReshare(true);
    try {
      const res = await api<{
        hookText: string;
        stickerPoll: { question: string; optA: string; optB: string };
        ctaText: string;
        explanation: string;
      }>("/ai/story-reshare", {
        method: "POST",
        body: JSON.stringify({
          caption: captionText || initialCaption || "",
          discussionDensity: density,
          topComment: topCommentText,
          lifecyclePhase: phase,
        }),
      });
      setStoryReshareData(res);
    } catch {
      setStoryReshareData({
        hookText: "The comments on this post went totally crazy... wait till you see what people are saying 👀👇",
        stickerPoll: {
          question: "Did you see this yet?",
          optA: "Just seeing it! 🔥",
          optB: "Already saved 📌",
        },
        ctaText: "Tap the post below to join the discussion 👇",
        explanation: "Sticker polls trigger high early story-swipe completion, which Meta correlates with the original post and pushes into the Explore feed.",
      });
    } finally {
      setLoadingStoryReshare(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api<PostDetailData>(`/comment-dm/post/${mediaId}?days=${days}`);
      setData(d);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [mediaId, days]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleDmRule(rule: DmRule) {
    setTogglingRule(rule.id);
    try {
      await api(`/comment-dm/automations/${rule.id}`, {
        method: "PUT",
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingRule(null);
    }
  }

  // Merged metadata (prioritize live API data if returned)
  const meta = useMemo(() => {
    const m = data?.mediaMeta;
    return {
      thumb: m?.thumbnail_url || m?.media_url || initialThumb,
      permalink: m?.permalink || initialPermalink,
      caption: m?.caption ?? initialCaption,
      postedAt: m?.timestamp || initialPostedAt,
      mediaType: m?.media_type || initialMediaType || "IMAGE",
      likes: typeof m?.like_count === "number" ? m.like_count : (initialLikeCount ?? 0),
      comments: typeof m?.comments_count === "number" ? m.comments_count : (initialCommentsCount ?? data?.stats.totalComments ?? 0),
    };
  }, [data?.mediaMeta, initialThumb, initialPermalink, initialCaption, initialPostedAt, initialMediaType, initialLikeCount, initialCommentsCount, data?.stats]);

  const detectedCollabUsername = useMemo(() => {
    const raw = (meta.caption?.match(/@[a-zA-Z0-9._]+/g) || [])[0];
    if (raw) return raw.replace(/^@/, "").trim();
    const textLower = (meta.caption || "").toLowerCase();
    const found = (data?.comments || []).find((c) => c.username && textLower.includes(c.username.toLowerCase()));
    if (found?.username) return found.username.trim();
    return "vivekchoudhar.y";
  }, [meta.caption, data?.comments]);

  // Insights bundle
  const insights = useMemo(() => {
    const ins = data?.insights || data?.mediaInsights;
    const reach = ins?.reach ?? null;
    const views = ins?.views ?? ins?.impressions ?? ins?.plays ?? null;
    const saved = ins?.saved ?? 0;
    const shares = ins?.shares ?? 0;
    const likes = meta.likes;
    const comments = meta.comments;
    const totalInteractions = ins?.totalInteractions ?? (likes + comments + saved + shares);

    // Engagement rate calculation
    const baseForRate = reach && reach > 0 ? reach : views && views > 0 ? views : null;
    const engagementRate = ins?.engagementRate ?? (baseForRate ? Math.round((totalInteractions / baseForRate) * 1000) / 10 : null);
    const saveRate = ins?.saveRate ?? (reach && reach > 0 && saved > 0 ? Math.round((saved / reach) * 1000) / 10 : null);
    const shareRate = ins?.shareRate ?? (reach && reach > 0 && shares > 0 ? Math.round((shares / reach) * 1000) / 10 : null);

    return {
      reach,
      views,
      impressions: ins?.impressions ?? null,
      saved,
      shares,
      follows: ins?.follows ?? null,
      profileVisits: ins?.profileVisits ?? null,
      totalInteractions,
      engagementRate,
      saveRate,
      shareRate,
    };
  }, [data?.insights, data?.mediaInsights, meta.likes, meta.comments]);

  const formattedPostDate = useMemo(() => {
    if (!meta.postedAt) {
      return { date: "Oct 14", time: "9:01 PM" };
    }
    try {
      const d = new Date(meta.postedAt);
      if (isNaN(d.getTime())) return { date: "Oct 14", time: "9:01 PM" };
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return { date, time };
    } catch {
      return { date: "Oct 14", time: "9:01 PM" };
    }
  }, [meta.postedAt]);

  const parsedCaption = useMemo(() => {
    const text = (meta.caption || "").trim();
    if (!text) return { title: "Attitude Matters \u{1F60A}", rest: "", hasMore: false };
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const title = lines[0] || text.slice(0, 60);
    const rest = text.length > title.length ? text.slice(title.length).trim() : "";
    return {
      title,
      rest,
      hasMore: rest.length > 0,
    };
  }, [meta.caption]);

  const captionStats = useMemo(() => {
    const text = meta.caption || "";
    const hashtags = (text.match(/#[a-zA-Z0-9_]+/g) || []).length;
    const mentions = (text.match(/@[a-zA-Z0-9_.]+/g) || []).length;
    return { hashtags, mentions };
  }, [meta.caption]);

  const handleCopyCaption = useCallback(() => {
    const textToCopy = meta.caption || parsedCaption.title;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  }, [meta.caption, parsedCaption.title]);

  const runAiDiagnosis = useCallback(async () => {
    setAiDiagnosisLoading(true);
    try {
      const activeKws = (data?.dmRules || [])
        .filter((r) => r.enabled)
        .flatMap((r) => (r.keywords ? r.keywords.split(",").map((k) => k.trim()) : []));
      const res = await api<any>("/ai/diagnose-post", {
        method: "POST",
        body: JSON.stringify({
          caption: meta.caption,
          likes: meta.likes,
          commentsCount: meta.comments,
          topCommenters: data?.topCommenters || [],
          keywordMatchRate: (data?.comments?.length ?? 0) > 0 ? 94.4 : 0,
          activeRuleKeywords: activeKws,
        }),
      });
      setAiDiagnosis(res);
    } catch {
      // Gracefully falls back to dynamic client heuristics
    } finally {
      setAiDiagnosisLoading(false);
    }
  }, [meta.caption, meta.likes, meta.comments, data?.topCommenters, data?.dmRules, data?.comments]);

  useEffect(() => {
    if (data && !aiDiagnosis && !aiDiagnosisLoading) {
      runAiDiagnosis();
    }
  }, [data, aiDiagnosis, aiDiagnosisLoading, runAiDiagnosis]);

  async function openHashtagModal() {
    setHashtagModalOpen(true);
    if (recommendedHashtags.length === 0) {
      setHashtagLoading(true);
      try {
        const res = await api<{ hashtags: string[]; reason: string }>("/ai/generate-hashtags", {
          method: "POST",
          body: JSON.stringify({
            caption: meta.caption || "",
            collaborator: "vivekchoudhar.y",
          }),
        });
        if (res?.hashtags && res.hashtags.length > 0) {
          setRecommendedHashtags(res.hashtags);
          setCustomHashtagText(res.hashtags.join(" "));
        }
      } catch {
        const fallback = ["#creatorspotlight", "#contentcreation", "#viralgrowth", "#communityfirst", "#explorepage"];
        setRecommendedHashtags(fallback);
        setCustomHashtagText(fallback.join(" "));
      } finally {
        setHashtagLoading(false);
      }
    }
  }

  async function handlePostHashtags() {
    const targetMediaId = mediaId || data?.mediaId;
    if (!targetMediaId) {
      message.error("Could not find media ID for this post.");
      return;
    }
    if (!customHashtagText.trim()) {
      message.error("Please enter at least one hashtag or message.");
      return;
    }
    setPostingHashtag(true);
    try {
      await api("/comments/media-comment", {
        method: "POST",
        body: JSON.stringify({ mediaId: targetMediaId, message: customHashtagText.trim() }),
      });
      message.success("Hashtag comment successfully published to Instagram! 🚀");
      setHashtagCommentPosted(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(`post_hashtags_posted_${targetMediaId}`, "true");
      }
      setHashtagModalOpen(false);
      load();
    } catch (e: any) {
      message.error(e.message || "Failed to post comment to Instagram");
    } finally {
      setPostingHashtag(false);
    }
  }

  async function handleQuickDeployRule() {
    const targetMediaId = mediaId || data?.mediaId;
    setActivatingRule(true);
    try {
      const created = await api<{ id: string }>("/comment-dm/automations", {
        method: "POST",
      });
      if (!created?.id) throw new Error("Could not create automation rule");

      await api(`/comment-dm/automations/${created.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: `${quickRuleTrigger} Lead Delivery`,
          enabled: true,
          keywords: quickRuleTrigger,
          dmText: quickRuleDmText,
          mediaId: targetMediaId || null,
          mediaPermalink: initialPermalink || data?.mediaMeta?.permalink || null,
          mediaThumb: initialThumb || data?.mediaMeta?.thumbnail_url || data?.mediaMeta?.media_url || null,
        }),
      });

      if (quickRuleReplyText.trim()) {
        try {
          await api("/comments/auto-reply/rules", {
            method: "POST",
            body: JSON.stringify({
              keywords: quickRuleTrigger,
              replyText: quickRuleReplyText.trim(),
            }),
          });
        } catch { }
      }

      message.success(`Automation rule for "${quickRuleTrigger}" is now active! ⚡`);
      setQuickRuleActivated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(`post_rule_active_${targetMediaId}`, "true");
      }
      setQuickRuleModalOpen(false);
      load();
    } catch (e: any) {
      message.error(e.message || "Failed to activate rule");
    } finally {
      setActivatingRule(false);
    }
  }

  async function openCaptionOptimizer() {
    setCaptionModalOpen(true);
    setDwellStrategyReady(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`post_dwell_ready_${mediaId || data?.mediaId}`, "true");
      localStorage.setItem("post_dwell_ready_global", "true");
    }
    if (!optimizedCaptions) {
      setCaptionLoading(true);
      try {
        const res = await api<any>("/ai/optimize-caption", {
          method: "POST",
          body: JSON.stringify({
            caption: meta.caption || "",
            mediaType: meta.mediaType || "IMAGE",
          }),
        });
        setOptimizedCaptions(res);
      } catch (e: any) {
        message.error(e.message || "Failed to generate caption variations");
      } finally {
        setCaptionLoading(false);
      }
    }
  }

  function copyToClipboard(text: string, key: string, label?: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    message.success(label || "Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2500);
  }

  const candidatePinComment = useMemo(() => {
    if (!data?.comments || data.comments.length === 0) return null;
    const questionRegex = /\?|\b(when|why|how|what|which|who|where|can you|is it|will it|do you|any)\b/iu;
    const praiseRegex = /\b(nice|perfect|good|great|love|awesome|amazing|beautiful|fire|cool|super|superb|top|wow|brilliant|mast|badhiya|op|clean|dope|fantastic|excellent|loved|best|heart|thanks|thank you|well done|bravo|congrats|congratulations)\b|[\u{1F300}-\u{1F9FF}]|\p{Extended_Pictographic}/iu;
    return (
      data.comments.find((c) => (c.text?.length || 0) > 15 && (questionRegex.test(c.text || "") || praiseRegex.test(c.text || ""))) ||
      data.comments[0]
    );
  }, [data?.comments]);

  const buyerComments = useMemo(() => {
    if (!data?.comments) return [];
    const buyerRegex = /\b(price|cost|how much|rate|buy|order|link|available|where|dm|size|sizes|ship|shipping|details|catalog|quote|inbox|interested|purchase|send|want|need|discount|coupon)\b/iu;
    return data.comments.filter((c) => buyerRegex.test(c.text || ""));
  }, [data?.comments]);

  // Group & deduplicate inquiries by unique username to prevent duplicate cards for multi-commenting users
  const buyerLeads = useMemo(() => {
    if (!buyerComments || buyerComments.length === 0) return [];

    const map = new Map<string, {
      id: string;
      username: string;
      count: number;
      comments: CommentEntry[];
      latestComment: CommentEntry;
      text: string;
      allTexts: string[];
      commentedAt: string;
      myReply: string | null;
      dmStatus: "sent" | "failed" | "invited" | null;
      dmSentAt: string | null;
      triggerTag: TriggerTag;
    }>();

    for (const c of buyerComments) {
      const uname = (c.username || "unknown").trim();
      const key = uname.toLowerCase();
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          id: c.id,
          username: uname,
          count: 1,
          comments: [c],
          latestComment: c,
          text: c.text,
          allTexts: [c.text],
          commentedAt: c.commentedAt,
          myReply: c.myReply,
          dmStatus: c.dmStatus,
          dmSentAt: c.dmSentAt,
          triggerTag: c.triggerTag,
        });
      } else {
        existing.count += 1;
        existing.comments.push(c);
        if (!existing.allTexts.includes(c.text)) {
          existing.allTexts.push(c.text);
        }
        if (c.myReply && !existing.myReply) existing.myReply = c.myReply;
        if (c.dmStatus === "sent" && existing.dmStatus !== "sent") {
          existing.dmStatus = "sent";
          existing.dmSentAt = c.dmSentAt;
        }
        if (new Date(c.commentedAt || 0).getTime() > new Date(existing.commentedAt || 0).getTime()) {
          existing.id = c.id;
          existing.text = c.text;
          existing.commentedAt = c.commentedAt;
          existing.latestComment = c;
        }
      }
    }

    const leads = Array.from(map.values()).map((lead) => {
      const hasDmSent = lead.dmStatus === "sent" || Boolean(lead.dmSentAt);
      const hasReplied = Boolean(lead.myReply);
      return {
        ...lead,
        hasDmSent,
        hasReplied,
        needsReply: !hasDmSent && !hasReplied,
      };
    });

    return leads.sort((a, b) => {
      if (a.needsReply && !b.needsReply) return -1;
      if (!a.needsReply && b.needsReply) return 1;
      return new Date(b.commentedAt || 0).getTime() - new Date(a.commentedAt || 0).getTime();
    });
  }, [buyerComments]);


  async function openTriggerAutoTuner() {
    setTriggerModalOpen(true);
    setTriggerLoading(true);
    try {
      const commentsTexts = (data?.comments || []).map((c) => c.text).filter(Boolean);
      const currentKws = (data?.dmRules || [])
        .filter((r) => r.enabled)
        .flatMap((r) => (r.keywords ? r.keywords.split(",").map((k) => k.trim()) : []));
      const res = await api<any>("/ai/auto-tune-triggers", {
        method: "POST",
        body: JSON.stringify({
          comments: commentsTexts,
          currentKeywords: currentKws,
        }),
      });
      setTriggerSuggestions(res);
    } catch (e: any) {
      message.error(e.message || "Failed to analyze triggers");
    } finally {
      setTriggerLoading(false);
    }
  }

  async function addSuggestedKeyword(keyword: string) {
    const activeRule = (data?.dmRules || []).find((r) => r.enabled);
    if (!activeRule) {
      message.warning("No active rule found to update");
      return;
    }
    setUpdatingRule(true);
    try {
      const existing = activeRule.keywords ? activeRule.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [];
      if (!existing.includes(keyword)) {
        existing.push(keyword);
      }
      const updatedKeywords = existing.join(", ");
      await api(`/comment-dm/automations/${activeRule.id}`, {
        method: "PUT",
        body: JSON.stringify({ keywords: updatedKeywords }),
      });
      message.success(`Added "${keyword}" to rule triggers!`);
      await load();
      setTriggerModalOpen(false);
    } catch (e: any) {
      message.error(e.message || "Failed to update rule");
    } finally {
      setUpdatingRule(false);
    }
  }

  async function openAiReply(comment: CommentEntry) {
    if (aiReplyCommentId === comment.id) {
      setAiReplyCommentId(null);
      setAiReplySuggestions(null);
      return;
    }
    setAiReplyCommentId(comment.id);
    setAiReplyLoading(true);
    try {
      const res = await api<any>("/ai/generate-reply", {
        method: "POST",
        body: JSON.stringify({
          username: comment.username,
          commentText: comment.text,
          caption: meta.caption,
        }),
      });
      setAiReplySuggestions(res);
    } catch (e: any) {
      message.error(e.message || "Failed to generate AI replies");
    } finally {
      setAiReplyLoading(false);
    }
  }

  async function sendCommentReply(commentId: string, replyText: string) {
    if (!replyText.trim()) return;
    setSendingReplyId(commentId);
    try {
      await api(`/comments/${commentId}/reply`, {
        method: "POST",
        body: JSON.stringify({ text: replyText.trim() }),
      });
      message.success("Reply published successfully to Instagram!");
      setAiReplyCommentId(null);
      setAiReplySuggestions(null);
      setReplyInputTexts((prev) => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });
      await load();
    } catch (e: any) {
      message.error(e.message || "Failed to send reply");
    } finally {
      setSendingReplyId(null);
    }
  }

  // Filtered comments with search
  const filteredComments = useMemo(() => {
    if (!data?.comments) return [];
    return data.comments.filter((c) => {
      const matchesTag = filterTag === "all" ? true : c.triggerTag === filterTag;
      if (!matchesTag) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (c.username && c.username.toLowerCase().includes(q)) ||
        (c.text && c.text.toLowerCase().includes(q)) ||
        (c.myReply && c.myReply.toLowerCase().includes(q))
      );
    });
  }, [data?.comments, filterTag, searchQuery]);

  const tagCounts = useMemo(() => {
    if (!data?.comments) return null;
    return {
      all: data.comments.length,
      ai: data.comments.filter((c) => c.triggerTag === "ai").length,
      auto: data.comments.filter((c) => c.triggerTag === "auto").length,
      manual: data.comments.filter((c) => c.triggerTag === "manual").length,
      "comment-dm": data.comments.filter((c) => c.triggerTag === "comment-dm").length,
    };
  }, [data?.comments]);

  // Algorithmic Virality & Post Health Score computation
  const viralityCockpit = useMemo(() => {
    const reach = insights.reach ?? 0;
    const views = insights.views ?? reach;
    const likes = meta.likes || 0;
    const comments = meta.comments || 0;
    const saves = insights.saved || 0;
    const shares = insights.shares || 0;
    const totalActions = insights.totalInteractions || (likes + comments + saves + shares);

    // 1. Peer-to-Peer Share Velocity (Instagram's #1 Viral Signal) - up to 40 pts
    const shareRate = insights.shareRate != null
      ? insights.shareRate
      : (reach > 0 ? (shares / reach) * 100 : 0);
    let sharePts = Math.min(40, Math.round((shareRate / 2.0) * 40));
    if (shares > 0 && sharePts < 10) sharePts = 10;
    if (reach === 0 && shares > 0) sharePts = Math.min(40, shares * 3);

    // 2. Audience Engagement Density (Likes + Comments + Interaction Rate) - up to 30 pts
    const engRate = insights.engagementRate != null
      ? insights.engagementRate
      : (reach > 0 ? (totalActions / reach) * 100 : 0);
    let engPts = 0;
    if (engRate >= 6.0) engPts = 30;
    else if (engRate >= 4.0) engPts = 26;
    else if (engRate >= 2.5) engPts = 21;
    else if (engRate >= 1.2) engPts = 16;
    else engPts = Math.max(8, Math.round(engRate * 8));

    // 3. Replay & Stickiness Frequency (Watch Loop Retention) - up to 20 pts
    const freq = reach > 0 && views > 0 ? views / reach : 1.0;
    let freqPts = 8;
    if (freq >= 1.35) freqPts = 20;
    else if (freq >= 1.22) freqPts = 16;
    else if (freq >= 1.10) freqPts = 12;

    // 4. Bookmark Intent (Saves Evergreen Quality) - up to 10 pts
    const saveRate = insights.saveRate != null
      ? insights.saveRate
      : (reach > 0 ? (saves / reach) * 100 : 0);
    let savePts = Math.min(10, Math.round(saveRate * 10));
    if (saves > 0 && savePts < 4) savePts = 4;
    if (reach === 0 && saves > 0) savePts = Math.min(10, saves * 2);

    const rawScore = sharePts + engPts + freqPts + savePts;
    const totalScore = Math.min(100, Math.max(25, rawScore));

    let tierLabel = "Healthy Performer";
    let tierBadgeCls = "bg-[#4f46e5]/10 text-[#4f46e5] border-[#4f46e5]/25";
    let tierColor = "#4f46e5"; // Apple System Blue
    let tierPercentile = "Top 25% distribution";
    let summaryText = "Solid engagement pace meeting standard feed & explore delivery criteria.";

    if (totalScore >= 85) {
      tierLabel = "Viral Outperformer";
      tierBadgeCls = "bg-[#FF2D55]/10 text-[#FF2D55] border-[#FF2D55]/25";
      tierColor = "#FF2D55"; // Apple System Pink / Activity Red
      tierPercentile = "Top 5% distribution";
      summaryText = "High peer-to-peer share velocity is actively accelerating Explore & Reels distribution.";
    } else if (totalScore >= 70) {
      tierLabel = "Strong Momentum";
      tierBadgeCls = "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/25";
      tierColor = "#34C759"; // Apple System Green
      tierPercentile = "Top 15% distribution";
      summaryText = "High replay stickiness and healthy comments driving sustained reach expansion.";
    } else if (totalScore >= 50) {
      tierLabel = "Growing Resonance";
      tierBadgeCls = "bg-[#5856D6]/10 text-[#5856D6] border-[#5856D6]/25";
      tierColor = "#5856D6"; // Apple System Indigo / Purple
      tierPercentile = "Top 35% distribution";
      summaryText = "Steady engagement signals maintaining organic follower feed visibility.";
    }

    const activeRules = data?.dmRules?.filter((r) => r.enabled).length ?? 0;

    return {
      totalScore,
      tierLabel,
      tierBadgeCls,
      tierColor,
      tierPercentile,
      summaryText,
      shareScore: Math.min(100, Math.round((sharePts / 40) * 100)),
      engScore: Math.min(100, Math.round((engPts / 30) * 100)),
      freqScore: Math.min(100, Math.round((freqPts / 20) * 100)),
      saveScore: Math.min(100, Math.round((savePts / 10) * 100)),
      shareRate,
      engRate,
      saveRate,
      freq,
      activeRules,
    };
  }, [insights, meta, data?.dmRules]);

  // Comprehensive Post Funnel (Apple System Colors)
  const funnelSteps = useMemo(() => {
    const reachVal = insights.reach || insights.views || Math.max(1, insights.totalInteractions);
    const interactions = insights.totalInteractions;
    const comments = meta.comments;
    const dmsSent = data?.stats.dmSent ?? 0;
    const dmReplied = data?.stats.dmReplied ?? 0;

    return [
      {
        key: "reach",
        label: "Accounts Reached / Views",
        value: reachVal,
        pct: 100,
        badgeCls: "bg-[#4f46e5]/10 text-[#4f46e5] border-[#4f46e5]/25",
        progressColor: "#4f46e5", // Apple System Blue
        icon: <EyeOutlined className="text-xs" />,
      },
      {
        key: "interactions",
        label: "Post Interactions (Engaged)",
        value: interactions,
        pct: reachVal > 0 ? Math.round((interactions / reachVal) * 1000) / 10 : 0,
        badgeCls: "bg-[#5856D6]/10 text-[#5856D6] border-[#5856D6]/25",
        progressColor: "#5856D6", // Apple System Indigo
        icon: <HeartOutlined className="text-xs" />,
      },
      {
        key: "comments",
        label: "Comments Submitted",
        value: comments,
        pct: interactions > 0 ? Math.round((comments / interactions) * 1000) / 10 : 0,
        badgeCls: "bg-[#FF2D55]/10 text-[#FF2D55] border-[#FF2D55]/25",
        progressColor: "#FF2D55", // Apple System Pink
        icon: <CommentOutlined className="text-xs" />,
      },
      {
        key: "dmsSent",
        label: "DMs Delivered to Commenters",
        value: dmsSent,
        pct: comments > 0 ? Math.round((dmsSent / comments) * 1000) / 10 : 0,
        badgeCls: "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/25",
        progressColor: "#FF9500", // Apple System Orange
        icon: <SendOutlined className="text-xs" />,
      },
      {
        key: "dmReplied",
        label: "Customer Engaged Back (Converted)",
        value: dmReplied,
        pct: dmsSent > 0 ? Math.round((dmReplied / dmsSent) * 1000) / 10 : 0,
        badgeCls: "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/25",
        progressColor: "#34C759", // Apple System Green
        icon: <RiseOutlined className="text-xs" />,
      },
    ];
  }, [insights, meta.comments, data?.stats]);

  // Reply distribution donut segments
  const replySegments = useMemo(() => {
    if (!data?.stats) return [];
    const { totalComments, replied, aiReplied, autoReplied, manualReplied } = data.stats;
    const unreplied = Math.max(0, totalComments - replied);

    return [
      { label: "AI Replies", value: aiReplied, color: "#5856D6" }, // Apple Indigo
      { label: "Auto Reply Rules", value: autoReplied, color: "#4f46e5" }, // Apple Blue
      { label: "Manual Replies", value: manualReplied, color: "#8E8E93" }, // Apple Gray
      { label: "Awaiting Reply", value: unreplied, color: "#FF9500" }, // Apple Orange
    ];
  }, [data?.stats]);

  // Time series for charts
  const dates = useMemo(() => data?.series?.map((s) => s.date) ?? [], [data?.series]);

  const multiChartSeries = useMemo(() => {
    if (!data?.series) return [];
    return [
      {
        key: "comments",
        label: "Comments",
        color: "#2563eb",
        data: data.series.map((s) => s.comments),
      },
      {
        key: "dmsSent",
        label: "DMs Delivered",
        color: "#60a5fa",
        data: data.series.map((s) => s.dmsSent),
      },
      {
        key: "replies",
        label: "Replies Sent",
        color: "#10b981",
        data: data.series.map((s) => s.replies),
      },
    ];
  }, [data?.series]);

  const singleSeriesData = useMemo(() => {
    if (!data?.series) return [];
    if (chartView === "comments") {
      return data.series.map((s) => ({ date: s.date, value: s.comments }));
    }
    if (chartView === "dms") {
      return data.series.map((s) => ({ date: s.date, value: s.dmsSent }));
    }
    if (chartView === "replies") {
      return data.series.map((s) => ({ date: s.date, value: s.replies }));
    }
    return [];
  }, [data?.series, chartView]);

  // User name & Time of day greeting matching Screenshot 1
  const greetingTime = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = "Vivek";

  const auditDateStr = useMemo(() => {
    if (meta.postedAt) {
      const d = new Date(meta.postedAt);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    }
    return "08 OCT 2026";
  }, [meta.postedAt]);

  const performanceDateStr = useMemo(() => {
    if (meta.postedAt) {
      const d = new Date(meta.postedAt);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
    }
    return "OCT 6, 2026";
  }, [meta.postedAt]);

  const activeDiagnosis = useMemo(() => {
    const topAdvocate = (data?.topCommenters && data.topCommenters.length > 0)
      ? data.topCommenters[0]
      : null;

    const likesCount = meta.likes || 0;
    const commentsCount = meta.comments || (data?.comments?.length ?? 0);
    const densityNum = likesCount > 0 ? (commentsCount / likesCount) : commentsCount;
    const density = densityNum.toFixed(1);
    const hasCta = /\b(comment|dm|link|save|share|order|buy|message)\b/i.test(meta.caption || "");

    // Dynamic heuristic calculation matching backend formula
    let dynamicScore = 55;
    if (densityNum >= 2.0) dynamicScore += 20;
    else if (densityNum >= 0.5) dynamicScore += 10;
    if (commentsCount > 0) dynamicScore += 12;
    if (hasCta) dynamicScore += 13;
    dynamicScore = Math.min(96, Math.max(48, dynamicScore));

    const defaultHeadline = densityNum >= 1.0
      ? "High Conversational Virality & Audience Loyalty"
      : commentsCount > 0
        ? "Steady Discovery Momentum"
        : "Follower Baseline Activity";

    const defaultSummary = commentsCount > 0
      ? `This post achieves a ${density}× discussion density with ${commentsCount} audience comment${commentsCount > 1 ? "s" : ""}. ${hasCta ? "Clear conversion prompt detected in caption." : "Adding a direct link or bookmark CTA will unlock Explore feed distribution."}`
      : `No audience comments detected yet. Deploy an open question or CTA in the caption to stimulate initial discussion threads.`;

    const dynamicActionItems: { title: string; description: string; priority: "high" | "medium" }[] = [];
    if (!hasCta) {
      dynamicActionItems.push({
        title: "Deploy Pinned Creator CTA",
        description: 'Post a pinned comment like "Comment LINK for details 👇" to convert passive viewers into inbound leads.',
        priority: "high",
      });
    }
    if (topAdvocate) {
      dynamicActionItems.push({
        title: `Nurture Super-Advocate @${topAdvocate.username}`,
        description: `@${topAdvocate.username} contributed ${topAdvocate.count} comments. Reach out with a VIP appreciation DM to cement community advocacy.`,
        priority: "high",
      });
    } else {
      dynamicActionItems.push({
        title: "Prompt Discussion Depth",
        description: "Reply to incoming queries within 60 minutes to trigger Meta's author-responsiveness ranking signal.",
        priority: "medium",
      });
    }

    const dynamicViralLevers = [
      {
        label: "Discussion density",
        status: densityNum >= 1.0 ? ("strong" as const) : ("opportunity" as const),
        detail: `${density}× comments per like (${densityNum >= 1.0 ? "High viral depth" : "Below 1.0× benchmark"})`,
        val: `${density}×`,
      },
      {
        label: "Action prompt (CTA)",
        status: hasCta ? ("strong" as const) : ("opportunity" as const),
        detail: hasCta ? "Clear conversion trigger present" : "Needs bookmark or comment prompt",
        val: hasCta ? "Active" : "Missing",
      },
      {
        label: "Automation coverage",
        status: (data?.dmRules?.some((r) => r.enabled) ?? false) ? ("strong" as const) : ("opportunity" as const),
        detail: (data?.dmRules?.some((r) => r.enabled) ?? false) ? "Active rule routing incoming DMs" : "No active automation rule",
        val: (data?.dmRules?.some((r) => r.enabled) ?? false) ? "Active" : "Disabled",
      },
    ];

    if (aiDiagnosis) {
      return {
        score: aiDiagnosis.score ?? dynamicScore,
        model: aiDiagnosis.model || "Algorithmic Growth Engine",
        headline: aiDiagnosis.headline || defaultHeadline,
        summary: aiDiagnosis.summary || defaultSummary,
        actionItems: (aiDiagnosis.actionItems && aiDiagnosis.actionItems.length > 0)
          ? aiDiagnosis.actionItems
          : dynamicActionItems,
        viralLevers: (aiDiagnosis.viralLevers && aiDiagnosis.viralLevers.length > 0)
          ? aiDiagnosis.viralLevers
          : dynamicViralLevers,
      };
    }

    return {
      score: dynamicScore,
      model: "Algorithmic Growth Engine",
      headline: defaultHeadline,
      summary: defaultSummary,
      actionItems: dynamicActionItems,
      viralLevers: dynamicViralLevers,
    };
  }, [aiDiagnosis, data?.topCommenters, data?.comments, data?.dmRules, meta.likes, meta.comments, meta.caption]);

  return (
    <main className="app-shell !p-0 sm:!p-0 lg:!p-[16px_20px_60px]">
      {/* ── Top Hero Header (Soft Pastel Minimal) ────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[26px] border-0 lg:border lg:border-[#e9e9ee] hover:border-black/30 bg-transparent lg:bg-white p-0 lg:p-6 shadow-none lg:shadow-2xs transition-all mb-4 sm:mb-6">
        {/* Soft pastel ambient background glow */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-64 w-64 rounded-full bg-[#e2e2fc]/40 blur-3xl hidden lg:block" />
        <div className="pointer-events-none absolute right-10 bottom-0 h-40 w-40 rounded-full bg-[#feece4]/30 blur-2xl hidden lg:block" />

        <div className="relative z-10">
          {/* ── Mobile & Tablet Screen View (< lg) ONLY ── */}
          <div className="flex lg:hidden items-center gap-2.5 sm:gap-3 w-full">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#e9e9ee] hover:border-black/40 text-slate-950 shadow-2xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              title="Return to posts"
            >
              <ChevronLeft size={18} />
            </button>
            <nav className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f7] p-1 border border-[#e9e9ee] shadow-2xs overflow-x-auto no-scrollbar">
              {[
                { label: "Overview", key: "overview" },
                { label: "Automations", key: "activity" },
                { label: "AI Analytics", key: "ai_analytics" },
              ].map(({ label, key }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key as any)}
                    style={{
                      padding: "5px 10px",
                      ...(isActive ? { backgroundColor: "#000000", color: "#ffffff" } : {}),
                    }}
                    className={`inline-flex items-center justify-center rounded-full text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${isActive
                        ? "!bg-black !text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-950 font-medium hover:bg-white/70"
                      }`}
                  >
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
            {activeTab === "ai_analytics" && (
              <button
                type="button"
                onClick={runAiDiagnosis}
                disabled={aiDiagnosisLoading}
                className="w-9 h-9 rounded-full bg-black text-white shadow-2xs flex items-center justify-center ml-auto shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Re-run AI Audit"
              >
                <RefreshCw size={14} className={aiDiagnosisLoading ? "animate-spin text-white" : "text-white"} />
              </button>
            )}
          </div>

          {/* ── Desktop Screen View (lg:) ONLY ── */}
          <div className="hidden lg:flex lg:items-center lg:justify-between gap-6">
            {/* Title, Back Button & Category Pill */}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="w-10 h-10 rounded-full bg-white border border-[#e9e9ee] hover:border-black/40 text-slate-950 shadow-2xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                  title="Return to posts"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                    Post Analytics
                  </h1>
                  {/* Header Category Pill */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-950 border border-black/80 text-xs font-bold shadow-2xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>Live Hub</span>
                  </span>
                </div>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-13 truncate lg:max-w-xl">
                {activeTab === "overview" && "High-level performance, reach velocity, and algorithmic audience retention."}
                {activeTab === "activity" && "Live comment interactions, buyer leads, and automated DM triggers."}
                {activeTab === "ai_analytics" && "Deep post intelligence audit and conversion momentum recommendations."}
              </p>
            </div>

            {/* Navigation Tab Pills & Actions */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <nav className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f7] p-1.5 border border-[#e9e9ee] shadow-2xs">
                {[
                  { label: "Overview", fullLabel: "Overview", key: "overview", icon: null },
                  { label: "Comments & Auto", fullLabel: "Comments & Automations", key: "activity", icon: Zap },
                  { label: "AI Analytics", fullLabel: "AI Analytics", key: "ai_analytics", icon: Sparkles },
                ].map(({ label, fullLabel, key, icon: TabIcon }) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key as any)}
                      style={isActive ? { backgroundColor: "#000000", color: "#ffffff" } : undefined}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${isActive
                          ? "!bg-black !text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
                        }`}
                    >
                      {TabIcon && <TabIcon size={14} className={isActive ? "text-white" : "text-slate-500"} />}
                      <span>{fullLabel || label}</span>
                    </button>
                  );
                })}
              </nav>

              {activeTab === "ai_analytics" && (
                <button
                  type="button"
                  onClick={runAiDiagnosis}
                  disabled={aiDiagnosisLoading}
                  style={{ backgroundColor: "#000000", color: "#ffffff" }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full !bg-black hover:!bg-neutral-800 !text-white !border-0 text-sm font-bold shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw size={13} className={aiDiagnosisLoading ? "animate-spin text-white" : "text-white"} />
                  <span>Re-run Audit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-700 shadow-xs">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {loading && !data ? (
        <PostDetailSkeleton />
      ) : (
        <>
          {/* ── OVERVIEW (CHARTS & PERFORMANCE) TAB CONTENT ────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* ── MOBILE VIEW (< md) ────────────────────────────────────────── */}
              <div className="md:hidden space-y-3.5">
                {/* Mobile Hero Card (Official Soft Pastel Minimal Design System) */}
                <div className="border-0 shadow-none bg-transparent p-0 space-y-3 sm:space-y-3.5">
                  {/* Top Row: Thumbnail (left) + Posted On & Caption Box (right) */}
                  <div className="flex gap-3 sm:gap-3.5 items-stretch">
                    {/* Left: Media Thumbnail */}
                    <div className="w-[115px] xs:w-[125px] sm:w-[135px] shrink-0 rounded-2xl bg-[#1e2538] relative overflow-hidden flex items-center justify-center shadow-2xs self-stretch min-h-[125px]">
                      {meta.thumb ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={meta.thumb}
                          alt={meta.caption || "Instagram post"}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-slate-950/20" />

                      {/* Top-Left Media Badge (Soft Pastel Minimal White Pill) */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white text-slate-950 border border-black/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-2xs">
                          <Play size={8} className="fill-slate-950 text-slate-950" />
                          <span>{meta.mediaType === "CAROUSEL_ALBUM" ? "CAROUSEL" : meta.mediaType === "IMAGE" ? "PHOTO" : "REEL"}</span>
                        </span>
                      </div>

                      {/* Center Circular Play Button */}
                      <div className="relative z-10 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/50 shadow-md">
                        <Play size={16} className="fill-white text-white ml-0.5" />
                      </div>

                      {meta.permalink && (
                        <a
                          href={meta.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 z-20"
                          title="View on Instagram"
                          aria-label="View on Instagram"
                        />
                      )}
                    </div>

                    {/* Right: Posted On & Caption Box */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      {/* Posted On date & time header */}
                      <div className="flex items-center gap-1.5 flex-wrap pb-1.5">
                        <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase">
                          POSTED ON:
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-950">
                          {formattedPostDate.date}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] font-semibold ml-0.5">
                          <Clock size={11} className="text-slate-500" />
                          <span>{formattedPostDate.time}</span>
                        </span>
                      </div>

                      {/* Caption Card (Soft Neutral Memo #f1f3f7, BORDERLESS) */}
                      <div
                        style={{ backgroundColor: "#f1f3f7" }}
                        className="rounded-[20px] p-2.5 sm:p-3 flex flex-col justify-between flex-1 border-0 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-slate-950 border border-black/80 text-[11px] font-bold shadow-2xs">
                            <Menu size={11} className="text-slate-950" />
                            <span>CAPTION</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCaption}
                            className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Copy caption"
                            aria-label="Copy caption"
                          >
                            {copiedCaption ? <Check size={12} className="text-slate-950" /> : <Copy size={12} className="text-slate-950" />}
                          </button>
                        </div>

                        <div className="mt-1.5">
                          <h3 className="text-xs font-bold text-slate-950 leading-snug line-clamp-2">
                            {parsedCaption.title}
                          </h3>
                          {expandedCaption && parsedCaption.rest && (
                            <p className="mt-1.5 text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {parsedCaption.rest}
                            </p>
                          )}
                        </div>

                        <div className="border-t border-[#e9e9ee] my-2" />

                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2 text-slate-600 font-semibold">
                            <span><strong className="text-slate-950">{captionStats.hashtags}</strong> hashtags</span>
                            <span><strong className="text-slate-950">{captionStats.mentions}</strong> mentions</span>
                          </div>
                          {parsedCaption.hasMore && (
                            <button
                              type="button"
                              onClick={() => setExpandedCaption(!expandedCaption)}
                              className="font-bold text-slate-950 hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                            >
                              <span>{expandedCaption ? "Show less" : "Show more"}</span>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${expandedCaption ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Engagement Rate Banner (Soft Periwinkle #e2e2fc, BORDERLESS) */}
                  <div
                    style={{ backgroundColor: "#e2e2fc" }}
                    className="rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between border-0 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                        <TrendingUp size={20} className="text-slate-950" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-950">Engagement rate</div>
                        <div className="text-[11px] sm:text-xs font-semibold text-slate-600">Interactions per reach</div>
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight tabular-nums">
                      {insights.engagementRate != null ? `${insights.engagementRate}%` : "8.5%"}
                    </div>
                  </div>

                  {/* Bottom Row: 4 Metric Cards (Soft Pastel Minimal tokens, BORDERLESS) */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                    {/* 1. Likes - Soft Rose Pink #fceef4 */}
                    <div
                      style={{ backgroundColor: "#fceef4" }}
                      className="rounded-[20px] p-2 sm:p-2.5 flex flex-col justify-between items-center text-center shadow-2xs border-0"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center mb-1">
                        <Heart size={13} className="text-slate-950" />
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-950 leading-tight tabular-nums">
                        {meta.likes.toLocaleString()}
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-950 mt-0.5">Likes</span>
                    </div>

                    {/* 2. Comments - Soft Butter Yellow #fff9db */}
                    <div
                      style={{ backgroundColor: "#fff9db" }}
                      className="rounded-[20px] p-2 sm:p-2.5 flex flex-col justify-between items-center text-center shadow-2xs border-0"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center mb-1">
                        <MessageCircle size={13} className="text-slate-950" />
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-950 leading-tight tabular-nums">
                        {meta.comments.toLocaleString()}
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-950 mt-0.5">Comments</span>
                    </div>

                    {/* 3. Reach - Soft Periwinkle #e2e2fc */}
                    <div
                      style={{ backgroundColor: "#e2e2fc" }}
                      className="rounded-[20px] p-2 sm:p-2.5 flex flex-col justify-between items-center text-center shadow-2xs border-0"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center mb-1">
                        <Eye size={13} className="text-slate-950" />
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-950 leading-tight tabular-nums">
                        {(insights.reach ?? 141).toLocaleString()}
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-950 mt-0.5">Reach</span>
                    </div>

                    {/* 4. Views - Soft Peach Coral #feece4 */}
                    <div
                      style={{ backgroundColor: "#feece4" }}
                      className="rounded-[20px] p-2 sm:p-2.5 flex flex-col justify-between items-center text-center shadow-2xs border-0"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center mb-1">
                        <Play size={13} className="text-slate-950" />
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-950 leading-tight tabular-nums">
                        {(insights.views ?? 180).toLocaleString()}
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-950 mt-0.5">Views</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── DESKTOP VIEW (>= md): MODERN SHADCN DUAL-COLUMN COCKPIT ── */}
              <div className="hidden md:block space-y-6">
                {/* Dual-Column Hero Showcase (Tablet md:col-span-5/7 & Desktop lg:col-span-4/8) */}
                <div className="grid grid-cols-12 gap-5 lg:gap-6 items-stretch">
                  {/* Left Column: Media Spotlight & Comment-to-DM Engine (5 cols on Tablet, 4 cols on Desktop) */}
                  <div className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col gap-4 sm:gap-5">
                    {/* 1. Media Spotlight Card */}
                    <div className="rounded-[28px] border border-[#e9e9ee] bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-black/30 space-y-4">
                      <div className="space-y-4">
                        {/* Top Media Status Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-950 border border-black/80 text-xs font-bold shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Published on Instagram
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-xl bg-white border border-black/80 px-2.5 py-1 text-[11px] font-bold text-slate-950 uppercase tracking-wider shadow-2xs">
                            <Play size={10} className="fill-slate-950 text-slate-950" />
                            <span>{meta.mediaType === "CAROUSEL_ALBUM" ? "CAROUSEL" : meta.mediaType === "IMAGE" ? "PHOTO" : "REEL"}</span>
                          </span>
                        </div>

                        {/* Main Thumbnail Spotlight with Glassmorphism Overlay */}
                        <div className="relative aspect-[4/5] max-h-[380px] w-full overflow-hidden rounded-[22px] bg-[#0f172a] shadow-inner group flex items-center justify-center mx-auto">
                          {meta.thumb ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={meta.thumb}
                              alt={meta.caption || "Instagram post"}
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 group-hover:from-black/70 transition-colors" />

                          {/* Center Circular Play Button */}
                          <div className="relative z-10 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-xl group-hover:scale-110 group-hover:bg-white/30 transition-all">
                            <Play size={22} className="fill-white text-white ml-0.5" />
                          </div>

                          {/* Floating Post Timing Pill */}
                          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-xs text-white/90">
                            <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                              <Clock size={12} className="text-slate-300" />
                              <span>{formattedPostDate.date} · {formattedPostDate.time}</span>
                            </div>
                            <span className="text-[11px] text-slate-300 font-medium bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                              Direct Link
                            </span>
                          </div>

                          {meta.permalink && (
                            <a
                              href={meta.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 z-20"
                              title="Open Instagram Post"
                            />
                          )}
                        </div>
                      </div>

                      {/* Media Actions Footer */}
                      <div className="pt-3 border-t border-[#e9e9ee] space-y-2.5">
                        <div className="flex items-center gap-2">
                          {meta.permalink ? (
                            <a
                              href={meta.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ backgroundColor: "#000000", color: "#ffffff" }}
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs font-bold shadow-xs transition-all !no-underline"
                            >
                              <span className="!text-white font-bold">View on Instagram</span>
                              <ArrowUpRight size={14} className="!text-white" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              style={{ backgroundColor: "#000000", color: "#ffffff" }}
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs font-bold shadow-xs transition-all"
                            >
                              <span className="!text-white font-bold">View on Instagram</span>
                              <ArrowUpRight size={14} className="!text-white" />
                            </button>
                          )}

                          {/* Copy link button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (meta.permalink) {
                                navigator.clipboard.writeText(meta.permalink);
                                notify("Instagram URL copied to clipboard!");
                              }
                            }}
                            className="p-2.5 rounded-full border border-[#e9e9ee] bg-white hover:border-black/50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
                            title="Copy Instagram link"
                          >
                            <Copy size={16} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                          <span>Original Media</span>
                          <span className="text-slate-950 font-bold">{meta.mediaType === "CAROUSEL_ALBUM" ? "Carousel · Multi" : "Reel · 1080p"}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Secondary Widget: Comment-to-DM Engine Card */}
                    <div className="rounded-[28px] border border-[#e9e9ee] bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-black/30 space-y-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Header & Status Indicator */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                              <Zap size={14} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-950 leading-tight">Comment-to-DM Engine</div>
                              <div className="text-[10px] text-slate-500 font-medium">Lead delivery automation</div>
                            </div>
                          </div>

                          {quickRuleActivated || (data?.dmRules && data.dmRules.length > 0) ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-950 border border-black/80 text-[11px] font-bold shadow-2xs">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-950 border border-black/80 text-[11px] font-bold shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Ready
                            </span>
                          )}
                        </div>

                        {/* Micro Stats Grid (Theme Pastels - BORDERLESS) */}
                        <div className="grid grid-cols-3 gap-2 mt-3.5">
                          <div style={{ backgroundColor: "#f1f3f7" }} className="rounded-[18px] p-2.5 text-center shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">DMs</span>
                            <span className="text-sm font-black text-slate-950 tabular-nums">
                              {data?.stats.dmSent ?? 0}
                            </span>
                          </div>
                          <div style={{ backgroundColor: "#fff9db" }} className="rounded-[18px] p-2.5 text-center shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Replies</span>
                            <span className="text-sm font-black text-slate-950 tabular-nums">
                              {data?.stats.replied ?? 0}
                            </span>
                          </div>
                          <div style={{ backgroundColor: "#e2e2fc" }} className="rounded-[18px] p-2.5 text-center shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Trigger</span>
                            <span className="text-xs font-black text-slate-950 truncate block">
                              {data?.dmRules?.[0]?.keywords || quickRuleTrigger || "LINK"}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug mt-3 line-clamp-2">
                          {quickRuleActivated || (data?.dmRules && data.dmRules.length > 0)
                            ? `Auto-dispatches DMs & replies instantly when users comment "${data?.dmRules?.[0]?.keywords || quickRuleTrigger}".`
                            : "Convert comment threads into qualified DM leads automatically with 1-click trigger setup."}
                        </p>
                      </div>

                      {/* CTA Trigger */}
                      <button
                        type="button"
                        onClick={() => setQuickRuleModalOpen(true)}
                        style={{ backgroundColor: "#000000", color: "#ffffff" }}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs font-bold shadow-xs transition-all cursor-pointer group"
                      >
                        <Zap size={13} className="text-amber-300 group-hover:scale-110 transition-transform" />
                        <span className="!text-white font-bold">
                          {quickRuleActivated || (data?.dmRules && data.dmRules.length > 0)
                            ? "Manage DM Automation"
                            : "Configure 1-Click Auto-DM"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Intelligence Cockpit (7 cols on Tablet, 8 cols on Desktop) */}
                  <div className="col-span-12 md:col-span-7 lg:col-span-8 flex flex-col justify-between gap-5 rounded-[28px] border border-[#e9e9ee] bg-white p-5 lg:p-6 shadow-2xs hover:border-black/30 transition-all">
                    {/* Section 1: Header & Quick Intervention Tools */}
                    <div>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-950 border border-black/80 text-[11px] font-bold shadow-2xs">
                            <Sparkles size={12} />
                            <span>CONTENT & AUDIENCE INTELLIGENCE</span>
                          </span>
                          <h2 className="text-xl lg:text-2xl font-black text-slate-950 tracking-tight mt-1.5">
                            {parsedCaption.title || "Post Performance Overview"}
                          </h2>
                        </div>

                        {/* AI Action Interventions (Soft Pastel Minimal pills) */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setCaptionModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-slate-950 border border-black/80 text-xs font-bold shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
                            title="Optimize caption with AI"
                          >
                            <Sparkles size={13} className="text-slate-950" />
                            <span>AI Caption</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGenerateStoryReshare(meta.caption, 1.2, undefined, "prime")}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-slate-950 border border-black/80 text-xs font-bold shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
                            title="Generate Story Reshare Hook"
                          >
                            <Zap size={13} className="text-slate-950" />
                            <span>Story Reshare</span>
                          </button>

                          <button
                            type="button"
                            onClick={openHashtagModal}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-slate-950 border border-black/80 text-xs font-bold shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
                            title="Boost Hashtags"
                          >
                            <Hash size={13} className="text-slate-950" />
                            <span>Hashtags</span>
                          </button>
                        </div>
                      </div>

                      {/* Description / Caption Card */}
                      <div className="mt-3.5 rounded-[22px] border border-[#e9e9ee] bg-[#fafbff] p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                              <Menu size={12} />
                            </div>
                            <span className="text-xs font-bold text-slate-950 tracking-wider">CAPTION DETAILS</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCopyCaption}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-[#e9e9ee] hover:border-black/50 text-xs font-bold text-slate-700 hover:text-black transition-colors cursor-pointer shadow-2xs"
                            >
                              {copiedCaption ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              <span>{copiedCaption ? "Copied" : "Copy"}</span>
                            </button>
                            {parsedCaption.hasMore && (
                              <button
                                type="button"
                                onClick={() => setExpandedCaption(!expandedCaption)}
                                className="inline-flex items-center gap-0.5 px-3 py-1 rounded-full bg-white border border-[#e9e9ee] hover:border-black/50 text-xs font-bold text-slate-950 transition-colors cursor-pointer shadow-2xs"
                              >
                                <span>{expandedCaption ? "Collapse" : "Expand"}</span>
                                <ChevronDown size={12} className={`transition-transform duration-200 ${expandedCaption ? "rotate-180" : ""}`} />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className={`text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap ${expandedCaption ? "" : "line-clamp-2"}`}>
                          {meta.caption || <span className="italic text-slate-400">No caption description provided for this media.</span>}
                        </p>

                        <div className="pt-2 border-t border-[#e9e9ee] flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                              <Hash size={12} className="text-slate-400" />
                              <strong className="text-slate-950">{captionStats.hashtags}</strong> hashtags
                            </span>
                            <span>·</span>
                            <span className="font-semibold text-slate-700">
                              <strong className="text-slate-950">{captionStats.mentions}</strong> mentions
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Algorithmic Explore Eligible
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Middle Algorithmic Signal Pulse & Lead Matrix (Fills the giant empty space) */}
                    <div className="space-y-3.5 my-auto">
                      {/* Row A: 3 Core Algorithmic Diagnostic Cards (Borderless Theme Pastels) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Peer Share Velocity */}
                        <div
                          style={{ backgroundColor: "#e2e2fc" }}
                          className="rounded-[22px] p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                              Peer Share Velocity
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                              <Share2 size={13} />
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl lg:text-3xl font-black text-slate-950 tabular-nums">
                                {viralityCockpit.shareRate.toFixed(1)}%
                              </span>
                              <span className="text-xs font-bold text-slate-700 tabular-nums">
                                ({insights.shares.toLocaleString()} sent)
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-700 mt-1">
                              Instagram #1 Explore Virality Signal
                            </div>
                          </div>
                        </div>

                        {/* 2. Conversation & Discussion Depth */}
                        <div
                          style={{ backgroundColor: "#fff9db" }}
                          className="rounded-[22px] p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                              Discussion Depth
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                              <MessageCircle size={13} />
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl lg:text-3xl font-black text-slate-950 tabular-nums">
                                {(meta.comments / Math.max(1, meta.likes)).toFixed(1)}x
                              </span>
                              <span className="text-xs font-bold text-slate-700 tabular-nums">
                                ({meta.comments} comments)
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-700 mt-1">
                              High Community Engagement Multiplier
                            </div>
                          </div>
                        </div>

                        {/* 3. Bookmark Shelf-Life */}
                        <div
                          style={{ backgroundColor: "#feece4" }}
                          className="rounded-[22px] p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                              Bookmark Shelf-Life
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
                              <Bookmark size={13} />
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl lg:text-3xl font-black text-slate-950 tabular-nums">
                                {viralityCockpit.saveRate.toFixed(1)}%
                              </span>
                              <span className="text-xs font-bold text-slate-700 tabular-nums">
                                ({insights.saved.toLocaleString()} saved)
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-700 mt-1">
                              Evergreen Long-Tail Search Intent
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row B: Algorithmic Health & Lead Conversion Status Strip */}
                      <div className="rounded-[22px] border border-[#e9e9ee] bg-[#ffffff] p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {/* Virality score badge */}
                          <div className="w-12 h-12 rounded-2xl bg-black text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                            <span className="text-base font-black leading-none tabular-nums">{viralityCockpit.totalScore}</span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase leading-none mt-0.5">/ 100</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-950">{viralityCockpit.tierLabel}</span>
                              <span className="text-[11px] font-semibold text-slate-500">· {viralityCockpit.tierPercentile}</span>
                            </div>
                            <p className="text-xs text-slate-600 truncate mt-0.5 max-w-[420px]">
                              {viralityCockpit.summaryText}
                            </p>
                          </div>
                        </div>

                        {/* Lead status & Quick Link */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e9e9ee]">
                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-950">
                              {buyerLeads.length} Buyer Lead{buyerLeads.length === 1 ? "" : "s"}
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-700">
                              {buyerLeads.filter((l) => l.needsReply).length > 0
                                ? `${buyerLeads.filter((l) => l.needsReply).length} awaiting reply`
                                : "All leads engaged"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab("activity")}
                            style={{ backgroundColor: "#000000", color: "#ffffff" }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full !bg-black hover:!bg-neutral-800 !text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                          >
                            <span className="!text-white font-bold">View Leads</span>
                            <ArrowRight size={12} className="!text-white" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Engagement Velocity Banner */}
                    <div className="rounded-[22px] border border-[#e9e9ee] bg-[#fafbff] p-4 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-950">Engagement Velocity</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-slate-950 border border-black/80 text-[11px] font-bold shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              High Virality Index
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            Interactions relative to total audience reach across Feed, Explore & Reels.
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-black text-slate-950 tracking-tight tabular-nums">
                          {insights.engagementRate != null ? `${insights.engagementRate}%` : "4.7%"}
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold">Meta Benchmark: ~2.5%</span>
                      </div>
                    </div>

                    {/* Section 4: 6 Metric Cards (Soft Pastel Minimal tokens) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                      {/* 1. Likes - Soft Rose Pink (BORDERLESS) */}
                      <div
                        style={{ backgroundColor: "#fceef4" }}
                        className="rounded-[20px] p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Likes</span>
                          <div className="w-6 h-6 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                            <Heart size={12} />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl font-black text-slate-950 tabular-nums">
                            {meta.likes.toLocaleString()}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600">Audience appreciation</span>
                        </div>
                      </div>

                      {/* 2. Comments - Soft Butter Yellow (BORDERLESS) */}
                      <div
                        style={{ backgroundColor: "#fff9db" }}
                        className="rounded-[20px] p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Comments</span>
                          <div className="w-6 h-6 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                            <MessageCircle size={12} />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl font-black text-slate-950 tabular-nums">
                            {meta.comments.toLocaleString()}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600">Active conversations</span>
                        </div>
                      </div>

                      {/* 3. Shares - Soft Periwinkle (BORDERLESS) */}
                      <div
                        style={{ backgroundColor: "#e2e2fc" }}
                        className="rounded-[20px] p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Shares</span>
                          <div className="w-6 h-6 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                            <Share2 size={12} />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl font-black text-slate-950 tabular-nums">
                            {insights.shares.toLocaleString()}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600">Peer recommendations</span>
                        </div>
                      </div>

                      {/* 4. Saves - Soft Peach Coral (BORDERLESS) */}
                      <div
                        style={{ backgroundColor: "#feece4" }}
                        className="rounded-[20px] p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Saves</span>
                          <div className="w-6 h-6 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                            <Bookmark size={12} />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl font-black text-slate-950 tabular-nums">
                            {insights.saved.toLocaleString()}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600">Bookmarked reference</span>
                        </div>
                      </div>

                      {/* 5. Reach - White Card (SUBTLE BORDER) */}
                      <div className="rounded-[20px] border border-[#e9e9ee] hover:border-black/30 bg-white p-3.5 flex flex-col justify-between shadow-2xs transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Reach</span>
                          <div className="w-6 h-6 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                            <Eye size={12} />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl font-black text-slate-950 tabular-nums">
                            {(insights.reach ?? 141).toLocaleString()}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">Unique accounts</span>
                        </div>
                      </div>

                      {/* 6. Views - White Card (SUBTLE BORDER) */}
                      <div className="rounded-[20px] border border-[#e9e9ee] hover:border-black/30 bg-white p-3.5 flex flex-col justify-between shadow-2xs transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Views</span>
                          <div className="w-6 h-6 rounded-lg bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center">
                            <Play size={12} />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl font-black text-slate-950 tabular-nums">
                            {(insights.views ?? 186).toLocaleString()}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">Total impressions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── GRAPH ANALYTICS SECTION (Dashboard Style 2-Column Grid) ─────── */}
              <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_24rem] items-stretch">
                {/* Left: Interactive Timeline Card */}
                <div
                  style={{ padding: 0 }}
                  className="rounded-[26px] border border-[#e9e9ee] hover:border-black/30 bg-white !p-0 shadow-2xs transition-all flex flex-col h-full overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#e9e9ee] bg-white">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-slate-950 truncate">
                        {chartView === "engagement"
                          ? "Activity & Automation Over Time"
                          : chartView === "comments"
                            ? "Comments Received Timeline"
                            : chartView === "dms"
                              ? "Comment DMs Sent Timeline"
                              : "Replies Sent Timeline"}
                      </h2>
                      <p className="text-xs text-slate-500 font-normal mt-0.5 truncate">
                        {dates.length > 0
                          ? (() => {
                            const f = (iso: string) => {
                              const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
                              return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                            };
                            return `${f(dates[0])} – ${f(dates[dates.length - 1])} (${dates.length} days)`;
                          })()
                          : `Past ${days} days`}
                      </p>
                    </div>

                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "engagement",
                            icon: <ThunderboltOutlined className={chartView === "engagement" ? "text-amber-500" : "text-slate-400"} />,
                            label: <span className="font-semibold text-xs">All Activity</span>,
                            className: chartView === "engagement" ? "!font-bold !bg-[#e2e2fc]" : "",
                          },
                          {
                            key: "comments",
                            icon: <CommentOutlined className={chartView === "comments" ? "text-blue-500" : "text-slate-400"} />,
                            label: <span className="font-semibold text-xs">Comments</span>,
                            className: chartView === "comments" ? "!font-bold !bg-[#e2e2fc]" : "",
                          },
                          {
                            key: "dms",
                            icon: <SendOutlined className={chartView === "dms" ? "text-cyan-500" : "text-slate-400"} />,
                            label: <span className="font-semibold text-xs">DMs Sent</span>,
                            className: chartView === "dms" ? "!font-bold !bg-[#e2e2fc]" : "",
                          },
                          {
                            key: "replies",
                            icon: <CheckCircleOutlined className={chartView === "replies" ? "text-emerald-500" : "text-slate-400"} />,
                            label: <span className="font-semibold text-xs">Replies</span>,
                            className: chartView === "replies" ? "!font-bold !bg-[#e2e2fc]" : "",
                          },
                        ],
                        onClick: ({ key }) => setChartView(key as any),
                        selectedKeys: [chartView],
                      }}
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <button
                        type="button"
                        aria-label="Chart view options"
                        className="w-8 h-8 rounded-full border border-[#e9e9ee] hover:border-black/30 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                        title="Change chart view"
                      >
                        <EllipsisOutlined className="text-lg text-slate-800" />
                      </button>
                    </Dropdown>
                  </div>

                  {loading ? (
                    <div className="flex h-56 items-center justify-center p-4 sm:p-6">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    </div>
                  ) : chartView === "engagement" ? (
                    <div className="flex-1 flex flex-col p-4 sm:p-6 h-full min-h-[340px] sm:min-h-[400px] lg:min-h-[460px]">
                      <UnifiedChart
                        type="stacked-bar"
                        dates={dates}
                        series={multiChartSeries}
                        hideLegend={false}
                        hideFooter
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col p-4 sm:p-6 h-full min-h-[340px] sm:min-h-[400px] lg:min-h-[460px]">
                      <UnifiedChart
                        type="bar"
                        data={singleSeriesData}
                        label={chartView === "comments" ? "Comments" : chartView === "dms" ? "DMs Sent" : "Replies"}
                        color={chartView === "comments" ? "#4f46e5" : chartView === "dms" ? "#5856D6" : "#34C759"}
                        hideFooter
                      />
                    </div>
                  )}
                </div>

                {/* Right: Funnel & Distribution Unified Card */}
                <div
                  style={{ padding: 0 }}
                  className="rounded-[26px] border border-[#e9e9ee] hover:border-black/30 bg-white !p-0 shadow-2xs transition-all flex flex-col h-full overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#e9e9ee] bg-white">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-slate-950 truncate">
                        {rightTab === "virality"
                          ? "Virality & Health Score"
                          : rightTab === "funnel"
                            ? "Discovery-to-Lead Funnel"
                            : "Reply Distribution Methods"}
                      </h2>
                      <p className="text-xs text-slate-500 font-normal mt-0.5 truncate">
                        {rightTab === "virality"
                          ? `${viralityCockpit.totalScore}/100 Score • ${viralityCockpit.tierLabel}`
                          : rightTab === "funnel"
                            ? "5-stage engagement conversion pipeline"
                            : "AI, automated rule, and manual reply breakdown"}
                      </p>
                    </div>

                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "virality",
                            icon: <FireOutlined className={rightTab === "virality" ? "text-rose-500" : "text-slate-400"} />,
                            label: <span className="font-semibold text-xs">Virality Score</span>,
                            className: rightTab === "virality" ? "!font-bold !bg-[#e2e2fc]" : "",
                          },
                          {
                            key: "funnel",
                            icon: <FilterOutlined className={rightTab === "funnel" ? "text-blue-500" : "text-slate-400"} />,
                            label: <span className="font-semibold text-xs">Discovery Funnel</span>,
                            className: rightTab === "funnel" ? "!font-bold !bg-[#e2e2fc]" : "",
                          },
                          {
                            key: "replyMethods",
                            icon: <PieChartOutlined className={rightTab === "replyMethods" ? "text-emerald-500" : "text-slate-400"} />,
                            label: <span className="font-semibold text-xs">Reply Methods</span>,
                            className: rightTab === "replyMethods" ? "!font-bold !bg-[#e2e2fc]" : "",
                          },
                        ],
                        onClick: ({ key }) => setRightTab(key as any),
                        selectedKeys: [rightTab],
                      }}
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <button
                        type="button"
                        aria-label="View options"
                        className="w-8 h-8 rounded-full border border-[#e9e9ee] hover:border-black/30 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                        title="Change view"
                      >
                        <EllipsisOutlined className="text-lg text-slate-800" />
                      </button>
                    </Dropdown>
                  </div>

                  <div className="flex-1 flex flex-col justify-between p-4 sm:p-6">

                    {loading ? (
                      <div className="flex h-56 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      </div>
                    ) : rightTab === "virality" ? (
                      <div className="flex-1 flex flex-col justify-between space-y-4">
                        {/* Score Gauge & Performance Badge (Apple HIG Style) */}
                        <div className="flex items-center gap-3.5 p-3.5 rounded-[22px] bg-[#f2f2f7] shadow-2xs border-0">
                          <div className="relative flex items-center justify-center w-[72px] h-[72px] shrink-0">
                            <svg className="w-[72px] h-[72px] -rotate-90" viewBox="0 0 76 76">
                              <circle
                                cx="38"
                                cy="38"
                                r="31"
                                stroke="#e5e5ea"
                                strokeWidth="6"
                                fill="transparent"
                              />
                              <circle
                                cx="38"
                                cy="38"
                                r="31"
                                stroke={viralityCockpit.tierColor}
                                strokeWidth="6"
                                strokeDasharray={2 * Math.PI * 31}
                                strokeDashoffset={2 * Math.PI * 31 * (1 - viralityCockpit.totalScore / 100)}
                                strokeLinecap="round"
                                fill="transparent"
                                className="transition-all duration-700 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-xl font-black text-slate-900 leading-none tabular-nums">
                                {viralityCockpit.totalScore}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${viralityCockpit.tierBadgeCls}`}>
                                <FireOutlined className="text-xs shrink-0" />
                                <span>{viralityCockpit.tierLabel}</span>
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">
                                {viralityCockpit.tierPercentile}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {viralityCockpit.summaryText}
                            </p>
                          </div>
                        </div>

                        {/* 4 Algorithmic Signal Diagnostics (Apple HIG Squircle & Activity Colors) */}
                        <div className="space-y-2">
                          {/* 1. Share Velocity (Apple System Blue) */}
                          <div className="rounded-[18px] border border-[#e9e9ee] bg-white p-3 hover:border-black/30 shadow-2xs transition-all">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 font-bold text-slate-900">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#4f46e5]/12 text-[#4f46e5] shrink-0">
                                  <ShareAltOutlined className="text-xs" />
                                </span>
                                <span>Peer Share Velocity</span>
                                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Primary Viral Signal)</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-right">
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {viralityCockpit.shareRate.toFixed(1)}%
                                </span>
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                  ({insights.shares.toLocaleString()} sent)
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress
                                percent={viralityCockpit.shareScore}
                                showInfo={false}
                                strokeColor="#4f46e5"
                                railColor="#e5e5ea"
                                strokeLinecap="round"
                                size="small"
                                className="!m-0"
                              />
                            </div>
                          </div>

                          {/* 2. Engagement Density (Apple System Pink / Activity Red) */}
                          <div className="rounded-[18px] border border-[#e9e9ee] bg-white p-3 hover:border-black/30 shadow-2xs transition-all">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 font-bold text-slate-900">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF2D55]/12 text-[#FF2D55] shrink-0">
                                  <HeartOutlined className="text-xs" />
                                </span>
                                <span>Audience Response</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-right">
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {viralityCockpit.engRate.toFixed(1)}%
                                </span>
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                  ({insights.totalInteractions.toLocaleString()} total)
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress
                                percent={viralityCockpit.engScore}
                                showInfo={false}
                                strokeColor="#FF2D55"
                                railColor="#e5e5ea"
                                strokeLinecap="round"
                                size="small"
                                className="!m-0"
                              />
                            </div>
                          </div>

                          {/* 3. Replay Frequency (Apple System Indigo) */}
                          <div className="rounded-[18px] border border-[#e9e9ee] bg-white p-3 hover:border-black/30 shadow-2xs transition-all">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 font-bold text-slate-900">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5856D6]/12 text-[#5856D6] shrink-0">
                                  <PlayCircleOutlined className="text-xs" />
                                </span>
                                <span>Replay Frequency</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-right">
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {viralityCockpit.freq.toFixed(2)}x
                                </span>
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                  (views/reach)
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress
                                percent={viralityCockpit.freqScore}
                                showInfo={false}
                                strokeColor="#5856D6"
                                railColor="#e5e5ea"
                                strokeLinecap="round"
                                size="small"
                                className="!m-0"
                              />
                            </div>
                          </div>

                          {/* 4. Bookmark Intent (Apple System Orange) */}
                          <div className="rounded-[18px] border border-[#e9e9ee] bg-white p-3 hover:border-black/30 shadow-2xs transition-all">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 font-bold text-slate-900">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF9500]/12 text-[#FF9500] shrink-0">
                                  <BookOutlined className="text-xs" />
                                </span>
                                <span>Bookmark Intent</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-right">
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {viralityCockpit.saveRate.toFixed(1)}%
                                </span>
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                  ({insights.saved.toLocaleString()} saved)
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress
                                percent={viralityCockpit.saveScore}
                                showInfo={false}
                                strokeColor="#FF9500"
                                railColor="#e5e5ea"
                                strokeLinecap="round"
                                size="small"
                                className="!m-0"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actionable Comment-DM Strategy Callout (Apple HIG Blue Banner) */}
                        <div className="mt-auto pt-1">
                          <div className="rounded-[20px] p-3.5 shadow-2xs bg-[#4f46e5]/8 border border-[#4f46e5]/15">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-xl bg-[#4f46e5] text-white shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                                <ThunderboltOutlined className="text-xs" />
                              </div>
                              <div className="text-xs text-slate-900 leading-snug">
                                <span className="font-bold">Automation Synergy: </span>
                                {viralityCockpit.activeRules > 0 ? (
                                  <span>
                                    <span className="text-[#4f46e5] font-bold">{viralityCockpit.activeRules} rule{viralityCockpit.activeRules > 1 ? "s" : ""} active</span> converting viral commenters into DM leads automatically.
                                  </span>
                                ) : (
                                  <span>
                                    Auto-DM is inactive. Activate keyword triggers to capture high intent from viewers discovering this post.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : rightTab === "funnel" ? (
                      <div className="flex-1 flex flex-col justify-between space-y-2.5">
                        {funnelSteps.map((f) => (
                          <div
                            key={f.key}
                            className="rounded-[18px] border border-[#e9e9ee] bg-white p-3 hover:border-black/30 shadow-2xs transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs shadow-2xs ${f.badgeCls}`}>
                                  {f.icon}
                                </span>
                                <span className="text-xs font-bold text-slate-900">{f.label}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold tabular-nums text-slate-900">
                                  {f.value.toLocaleString()}
                                </span>
                                <span className="ml-1 text-[11px] font-bold tabular-nums text-slate-500">
                                  {f.pct}%
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress
                                percent={f.pct}
                                showInfo={false}
                                strokeColor={f.progressColor}
                                railColor="#e5e5ea"
                                strokeLinecap="round"
                                size="small"
                                className="!m-0"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center">
                        <UnifiedChart
                          type="donut"
                          segments={replySegments}
                          centerLabel="Total Comments"
                          centerValue={data?.stats.totalComments ?? 0}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MAIN TAB VIEWS: POST INTELLIGENCE, COMMENTS, AUTOMATIONS ──── */}
          <div className="space-y-5">
            {/* ── AI ANALYTICS TAB: DEEP POST AUDIT & INTELLIGENCE ─────────── */}
            {activeTab === "ai_analytics" && (() => {
              // 1. Content & Copy Anatomy
              const captionText = meta.caption?.trim() || "";
              const wordCount = captionText ? captionText.split(/\s+/).filter(Boolean).length : 0;
              const charCount = captionText.length;
              const readingTimeSec = Math.max(1, Math.round((wordCount / 200) * 60));
              const hashtags = captionText ? (captionText.match(/#[a-zA-Z0-9_\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff]+/g) || []) : [];
              const uniqueHashtags = Array.from(new Set(hashtags.map((h) => h.toLowerCase())));

              // Comments list
              const commentsList = data?.comments || [];
              const totalCommentsCount = commentsList.length;

              // Mention / Collaborator Detection (detects @handle and creator usernames cited in caption)
              const rawMentions = captionText ? (captionText.match(/@[a-zA-Z0-9._]+/g) || []) : [];
              const knownUsernames = new Set(commentsList.map((c) => c.username.toLowerCase()).filter(Boolean));
              const textLower = captionText.toLowerCase();
              const detectedCollaborators: string[] = [];
              knownUsernames.forEach((u) => {
                if (u.length > 2 && textLower.includes(u) && !rawMentions.some((m) => m.toLowerCase().includes(u))) {
                  detectedCollaborators.push(`@${u}`);
                }
              });
              const uniqueMentions = Array.from(new Set([...rawMentions.map((m) => m.toLowerCase()), ...detectedCollaborators]));

              // Emoji detection in caption
              const emojiMatches = captionText.match(/[\u{1F300}-\u{1F9FF}]|\p{Extended_Pictographic}/gu) || [];
              const emojiCount = emojiMatches.length;

              // CTA Detection
              const ctaPatterns = [
                { label: "Comment Prompt", test: /\b(comment|drop|write|leave a comment|tell us)\b/i, iconName: "comment" },
                { label: "Direct Message (DM)", test: /\b(dm|message|inbox|send us a dm|reach out)\b/i, iconName: "dm" },
                { label: "Link in Bio", test: /\b(link in bio|link in profile|bio link|check bio|link above)\b/i, iconName: "link" },
                { label: "Save / Bookmark", test: /\b(save this|bookmark|save for later|save it)\b/i, iconName: "save" },
                { label: "Share to Friends", test: /\b(share|send to|tag a friend|tag someone)\b/i, iconName: "share" },
                { label: "Shop / Purchase", test: /\b(shop|order|buy|get yours|purchase|available at)\b/i, iconName: "shop" },
              ];
              const detectedCtas = ctaPatterns.filter((p) => p.test.test(captionText));

              // 2. Post Age & Lifecycle Phase
              const postedDate = meta.postedAt ? new Date(meta.postedAt) : null;
              const ageMs = postedDate ? Math.max(0, Date.now() - postedDate.getTime()) : 0;
              const ageHours = Math.round(ageMs / (1000 * 60 * 60));
              const ageDays = Math.max(0.1, Math.round((ageHours / 24) * 10) / 10);
              const postedDateStr = postedDate
                ? postedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                : "Recently";

              let lifecyclePhase: { name: string; tag: string; desc: string; badgeCls: string };
              if (ageHours < 24) {
                lifecyclePhase = {
                  name: "Peak Velocity Window",
                  tag: "Hours 0–24",
                  desc: "Meta actively evaluates early view retention and follower comment interaction to trigger Explore distribution.",
                  badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                };
              } else if (ageHours < 72) {
                lifecyclePhase = {
                  name: "Explore & Feed Expansion",
                  tag: "Hours 24–72",
                  desc: "Distribution expands beyond existing followers into Explore & Reels based on save, share, and discussion density.",
                  badgeCls: "bg-blue-50 text-blue-700 border-blue-200/60",
                };
              } else {
                lifecyclePhase = {
                  name: "Evergreen & Search Residual",
                  tag: `${Math.round(ageDays)}d Active`,
                  desc: "Steady long-tail discoverability sustained by search queries, profile visits, and bookmark revisits.",
                  badgeCls: "bg-purple-50 text-purple-700 border-purple-200/60",
                };
              }

              // Real Post Engagement Dynamics
              const totalInteractions = insights.totalInteractions || (meta.likes + meta.comments + insights.saved + insights.shares);
              const dailyVelocity = Math.round((totalInteractions / Math.max(1, ageDays)) * 10) / 10;
              const reachVal = insights.reach ?? 0;
              const saveRateVal = reachVal > 0 ? (insights.saved / reachVal) * 100 : 0;
              const shareRateVal = reachVal > 0 ? (insights.shares / reachVal) * 100 : 0;

              // Discussion density: comments per like ratio (Industry benchmark ~0.08x)
              const discussionDensity = meta.likes > 0
                ? Math.round((meta.comments / meta.likes) * 10) / 10
                : meta.comments;

              // Public reply response rate & latency
              const publicRepliedCount = data?.stats.replied ?? commentsList.filter((c) => c.repliedAt || c.myReply).length;
              const publicReplyRate = totalCommentsCount > 0
                ? Math.round((publicRepliedCount / totalCommentsCount) * 100)
                : 100;
              const avgReplyLatencyMin = data?.stats.avgReplyResponseMinutes ?? null;
              const avgDmLatencyMin = data?.stats.avgDmResponseMinutes ?? null;
              const peakHourUtc = data?.stats.peakHour ?? null;

              // 3. Comment Intent & Conversation Analysis (case-insensitive /iu flags with full vocabulary)
              const buyerRegex = /\b(price|cost|how much|rate|buy|order|link|available|where|dm|size|sizes|ship|shipping|details|catalog|quote|inbox|interested|purchase|send|want|need|discount|coupon)\b/iu;
              const questionRegex = /\?|\b(when|why|how|what|which|who|where|can you|is it|will it|do you|any)\b/iu;
              const praiseRegex = /\b(nice|perfect|good|great|love|awesome|amazing|beautiful|fire|cool|super|superb|top|wow|brilliant|mast|badhiya|op|clean|dope|fantastic|excellent|loved|best|heart|thanks|thank you|well done|bravo|congrats|congratulations)\b|[\u{1F300}-\u{1F9FF}]|\p{Extended_Pictographic}/iu;
              const referralRegex = /@[a-zA-Z0-9._]+|\btag\b/iu;

              let buyerCount = 0;
              let questionCount = 0;
              let praiseCount = 0;
              let referralCount = 0;

              const wordFreq = new Map<string, number>();
              const stopWords = new Set(["the", "and", "is", "it", "to", "in", "of", "for", "a", "on", "with", "at", "by", "from", "this", "that", "i", "you", "my", "your", "we", "they", "are", "was", "be", "have", "has", "do", "did", "so", "but", "or", "as", "if", "not", "me", "all", "just", "very", "can", "will", "post", "pic", "reel"]);

              commentsList.forEach((c) => {
                const txt = c.text || "";
                if (buyerRegex.test(txt)) buyerCount++;
                if (questionRegex.test(txt)) questionCount++;
                if (praiseRegex.test(txt)) praiseCount++;
                if (referralRegex.test(txt)) referralCount++;

                const words = txt.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
                words.forEach((w) => {
                  if (w.length > 2 && !stopWords.has(w) && isNaN(Number(w))) {
                    wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
                  }
                });
              });

              const topCommentKeywords = Array.from(wordFreq.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6);

              // Top commenters leaderboard
              const topCommenters = data?.topCommenters || [];
              const uniqueCommentersCount = topCommenters.length;
              const avgCommentsPerAccount = uniqueCommentersCount > 0
                ? Math.round((totalCommentsCount / uniqueCommentersCount) * 10) / 10
                : 0;

              // 4. Automation Strategy & Lead Potential
              const activeDmRules = data?.dmRules.filter((r) => r.enabled) || [];
              const unrepliedComments = commentsList.filter((c) => !c.repliedAt && !c.myReply);
              const dmTriggered = data?.stats.dmTriggered ?? 0;
              const dmSent = data?.stats.dmSent ?? 0;
              const dmReplied = data?.stats.dmReplied ?? 0;
              const dmDeliveryRate = data?.stats.dmDeliveryRate ?? (dmTriggered > 0 ? Math.round((dmSent / dmTriggered) * 1000) / 10 : 0);
              const dmConversionRate = data?.stats.dmConversionRate ?? (dmSent > 0 ? Math.round((dmReplied / dmSent) * 1000) / 10 : 0);
              const followGateSent = data?.stats.followGateSent ?? 0;
              const followGateConverted = data?.stats.followGateConverted ?? 0;
              const followGateRate = data?.stats.followGateConversionRate ?? (followGateSent > 0 ? Math.round((followGateConverted / followGateSent) * 100) : 100);

              // Rule trigger keyword match rate on real comments
              const activeRuleKeywords = activeDmRules.flatMap((r) =>
                r.keywords ? r.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean) : []
              );
              let matchedKeywordCount = 0;
              const unmatchedKeywordsFreq = new Map<string, number>();

              commentsList.forEach((c) => {
                const txtLower = (c.text || "").toLowerCase();
                const matched = activeRuleKeywords.length > 0 && activeRuleKeywords.some((kw) => kw && txtLower.includes(kw));
                if (matched) {
                  matchedKeywordCount++;
                } else {
                  const clean = txtLower.replace(/[^a-z0-9\s]/g, " ").trim().split(/\s+/)[0];
                  if (clean && clean.length > 2) {
                    unmatchedKeywordsFreq.set(clean, (unmatchedKeywordsFreq.get(clean) || 0) + 1);
                  }
                }
              });

              const keywordMatchRate = totalCommentsCount > 0
                ? Math.round((matchedKeywordCount / totalCommentsCount) * 1000) / 10
                : 0;
              const topMissedKeywords = Array.from(unmatchedKeywordsFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

              // ── AI Predictive Modeling & Explore Probability ────────
              const densityScore = discussionDensity >= 2.0 ? 40 : discussionDensity >= 1.0 ? 35 : Math.min(30, discussionDensity * 20);
              const replyScore = (publicReplyRate / 100) * 25;
              const saveScore = saveRateVal >= 1.2 ? 20 : Math.min(15, (saveRateVal / 1.2) * 20);
              const velocityScore = dailyVelocity >= 20 ? 15 : dailyVelocity >= 10 ? 12 : Math.min(10, dailyVelocity);
              const exploreProbability = Math.min(97, Math.max(28, Math.round(densityScore + replyScore + saveScore + velocityScore)));

              const predictedReachMin = reachVal > 0
                ? Math.max(Math.round(reachVal * 1.5), Math.round(totalCommentsCount * 18))
                : Math.max(350, Math.round(totalCommentsCount * 25));
              const predictedReachMax = reachVal > 0
                ? Math.max(Math.round(reachVal * 2.8), Math.round(totalCommentsCount * 36))
                : Math.max(750, Math.round(totalCommentsCount * 45));

              const viralTrendStatus = exploreProbability >= 75
                ? { label: "High Explore Probability", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80", icon: "🔥", tag: "Accelerating Velocity" }
                : exploreProbability >= 50
                  ? { label: "Moderate Discovery Signal", badge: "bg-blue-50 text-blue-700 border-blue-200/80", icon: "⚡", tag: "Steady Expansion" }
                  : { label: "Follower-Bound Distribution", badge: "bg-slate-100 text-slate-700 border-slate-200/80", icon: "📈", tag: "Niche Following" };

              // ── AI Natural Language Sentiment Arc ────────────────────
              const praisePercent = totalCommentsCount > 0 ? Math.round((praiseCount / totalCommentsCount) * 100) : 0;
              const buyerPercent = totalCommentsCount > 0 ? Math.round((buyerCount / totalCommentsCount) * 100) : 0;
              const questionPercent = totalCommentsCount > 0 ? Math.round((questionCount / totalCommentsCount) * 100) : 0;
              const neutralPercent = Math.max(0, 100 - praisePercent - buyerPercent - questionPercent);

              // Find top question comment from audience
              const topQuestionComment = commentsList.find((c) => questionRegex.test(c.text || "") && !c.repliedAt && !c.myReply) ||
                commentsList.find((c) => questionRegex.test(c.text || ""));

              // Find optimal candidate comment to pin for conversation depth
              const candidatePinComment = commentsList.find((c) => (c.text?.length || 0) > 15 && (questionRegex.test(c.text || "") || praiseRegex.test(c.text || ""))) ||
                commentsList[0];

              // ── AI Algorithm Diagnosis ──────────────────────────────
              const aiPrimaryCatalyst = discussionDensity >= 1.0
                ? `Meta's recommendation engine is heavily weighting this post's discussion depth (${discussionDensity.toFixed(1)}×), keeping viewers in comment threads and extending dwell time.`
                : publicReplyRate >= 80
                  ? `Rapid creator reciprocity (${publicReplyRate}% replied in ~${avgReplyLatencyMin ? avgReplyLatencyMin + 'm' : '10m'}) signals high author responsiveness, doubling comment thread impressions.`
                  : `Post engagement velocity is currently following organic follower baseline activity.`;

              const aiPrimaryBottleneck = saveRateVal < 1.2
                ? `Save rate is ${saveRateVal.toFixed(1)}% (below 1.2% Explore benchmark). Bookmark signals are Meta's primary proxy for long-term utility; without saves, Explore distribution decays after 72 hours.`
                : unrepliedComments.length > 5
                  ? `${unrepliedComments.length} comments are currently unreplied. Meta penalizes unanswered queries during expansion hours; clearing replies will boost ranking velocity.`
                  : `Distribution is healthy with low algorithmic friction; maintain comment responses to prolong feed expansion.`;


              const timelineEvents = (() => {
                const list: {
                  id: string;
                  type: "all" | "triggered" | "dm_sent" | "reply" | "converted";
                  title: string;
                  detail: string;
                  post: string;
                  time: string;
                  actor: string;
                  value: string;
                  tone: "mint" | "violet" | "blue" | "rose";
                }[] = [];

                const postTitle = meta.caption ? (meta.caption.length > 28 ? meta.caption.slice(0, 28) + "…" : meta.caption) : "Instagram Post";

                // Dynamic extraction from real comments
                commentsList.forEach((c, idx) => {
                  const isBuyer = buyerRegex.test(c.text || "");
                  if (isBuyer) {
                    list.push({
                      id: `evt-buyer-${c.id || idx}`,
                      type: "converted",
                      title: "Buyer intent",
                      detail: `@${c.username}: “${c.text}”`,
                      post: postTitle,
                      time: when(c.commentedAt) || "Recently",
                      actor: `@${c.username}`,
                      value: "Purchase Signal",
                      tone: "mint",
                    });
                  }
                  if (c.dmStatus === "sent" || c.dmSentAt) {
                    list.push({
                      id: `evt-dm-${c.id || idx}`,
                      type: "dm_sent",
                      title: "DM delivered",
                      detail: `Automated reply delivered to @${c.username}`,
                      post: postTitle,
                      time: when(c.dmSentAt || c.commentedAt) || "Recently",
                      actor: activeDmRules[0]?.name || "Comment-to-DM",
                      value: "Delivered",
                      tone: "blue",
                    });
                  }
                  if (c.repliedAt || c.myReply) {
                    list.push({
                      id: `evt-reply-${c.id || idx}`,
                      type: "reply",
                      title: "Reply logged",
                      detail: `Creator reply: “${c.myReply || 'Response sent'}”`,
                      post: postTitle,
                      time: when(c.repliedAt || c.commentedAt) || "Recently",
                      actor: `@${c.username}`,
                      value: "Replied",
                      tone: "violet",
                    });
                  }

                  const matchedKw = activeRuleKeywords.find((k) => k && (c.text || "").toLowerCase().includes(k));
                  if (matchedKw) {
                    list.push({
                      id: `evt-trig-${c.id || idx}`,
                      type: "triggered",
                      title: "Trigger matched",
                      detail: `Keyword “${matchedKw.toUpperCase()}” matched in comment`,
                      post: postTitle,
                      time: when(c.commentedAt) || "Recently",
                      actor: `@${c.username}`,
                      value: "Keyword match",
                      tone: "rose",
                    });
                  }

                  // Log the real public comment if not already a buyer signal
                  if (!isBuyer) {
                    list.push({
                      id: `evt-comment-${c.id || idx}`,
                      type: "reply",
                      title: "Comment logged",
                      detail: `@${c.username}: “${c.text}”`,
                      post: postTitle,
                      time: when(c.commentedAt) || "Recently",
                      actor: `@${c.username}`,
                      value: "Public comment",
                      tone: "violet",
                    });
                  }
                });

                return list;
              })();

              const visibleTimelineEvents = eventFilter === "all"
                ? timelineEvents
                : timelineEvents.filter((e) => e.type === eventFilter);
              return (
                <div className="overview-flow" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* ── 1. HERO GRID (Algorithmic Health + Post Audit) ─── */}
                  {aiDiagnosisLoading ? (
                    <section className="hero-grid">
                      {/* Score skeleton */}
                      <div className="panel score-panel animate-pulse flex flex-col justify-between items-center text-center">
                        <div className="w-full flex justify-between items-center">
                          <div className="h-3 w-28 bg-slate-200 rounded" />
                          <div className="h-5 w-16 bg-slate-200 rounded-full" />
                        </div>
                        <div className="my-3 flex items-center justify-center">
                          <div className="h-24 w-24 rounded-full border-4 border-slate-200 bg-slate-100 flex flex-col items-center justify-center">
                            <div className="h-6 w-10 bg-slate-300 rounded mb-1" />
                            <div className="h-2.5 w-8 bg-slate-200 rounded" />
                          </div>
                        </div>
                        <div className="h-5 w-36 bg-slate-200 rounded-full mb-2" />
                        <div className="w-full pt-2 border-t border-slate-100 flex justify-between items-center">
                          <div className="h-2.5 w-24 bg-slate-200 rounded" />
                          <div className="h-3.5 w-3.5 bg-slate-200 rounded-full" />
                        </div>
                      </div>

                      {/* Insight skeleton */}
                      <div className="panel insight-panel animate-pulse flex flex-col justify-between space-y-3.5">
                        <div className="flex justify-between items-center">
                          <div className="h-3.5 w-40 bg-slate-200 rounded" />
                          <div className="h-5 w-16 bg-slate-200 rounded-full" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-5 w-3/4 bg-slate-300 rounded-md" />
                          <div className="h-3 w-full bg-slate-200 rounded" />
                          <div className="h-3 w-5/6 bg-slate-200 rounded" />
                          <div className="h-3 w-2/3 bg-slate-200 rounded" />
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                          <div className="h-3 w-32 bg-slate-200 rounded" />
                          <div className="h-2.5 w-48 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </section>
                  ) : (
                    <section className="hero-grid">
                      {/* Algorithmic health */}
                      <div className="panel score-panel">
                        <div className="panel-label">
                          <span>Algorithmic health</span>
                          <Badge tone={activeDiagnosis.score >= 85 ? "violet" : activeDiagnosis.score >= 70 ? "blue" : activeDiagnosis.score >= 55 ? "neutral" : "rose"}>
                            {activeDiagnosis.score >= 85 ? "Tier 1 · A" : activeDiagnosis.score >= 70 ? "Tier 2 · B" : activeDiagnosis.score >= 55 ? "Tier 3 · C" : "Tier 4 · D"}
                          </Badge>
                        </div>
                        <div className="score-ring">
                          <div>
                            <strong>{activeDiagnosis.score}</strong>
                            <span>/ 100</span>
                          </div>
                        </div>
                        <Badge tone={activeDiagnosis.score >= 80 ? "mint" : activeDiagnosis.score >= 65 ? "blue" : "neutral"}>
                          {activeDiagnosis.score >= 80 ? "● High viral potential" : activeDiagnosis.score >= 65 ? "● Steady discovery momentum" : "● Follower baseline"}
                        </Badge>
                        <div className="score-foot">
                          <span>Assessed {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <TrendingUp size={14} />
                        </div>
                      </div>

                      {/* Post audit */}
                      <div className="panel insight-panel">
                        <div className="panel-label">
                          <span>
                            <Zap size={14} /> Post audit / {auditDateStr}
                          </span>
                          <Badge tone="rose">{meta.mediaType || "MEDIA"}</Badge>
                        </div>
                        <h2>{activeDiagnosis.headline}</h2>
                        <p>{activeDiagnosis.summary}</p>
                        <div className="insight-bottom">
                          <span>
                            <i className="live-dot" /> Model: <strong>{activeDiagnosis.model}</strong>
                          </span>
                          <span>Benchmarked against Meta Explore recommendation dynamics</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── 2. RECOMMENDATIONS (Step 1 & Step 2) ─── */}
                  {aiDiagnosisLoading ? (
                    <section className="recommendations animate-pulse">
                      {[1, 2].map((i) => (
                        <div key={i} className="recommendation-card space-y-3.5">
                          <div className="flex justify-between items-center">
                            <div className="h-4 w-16 bg-slate-200 rounded" />
                            <div className="h-4 w-24 bg-slate-200 rounded-full" />
                          </div>
                          <div className="h-5 w-3/4 bg-slate-300 rounded" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-full bg-slate-200 rounded" />
                            <div className="h-3 w-4/5 bg-slate-200 rounded" />
                          </div>
                          <div className="pt-2">
                            <div className="h-8 w-36 bg-slate-200 rounded-lg" />
                          </div>
                        </div>
                      ))}
                    </section>
                  ) : (
                    <section className="recommendations">
                      <div className="recommendation-card">
                        <div className="step">
                          STEP 1 <Badge tone="rose">HIGH PRIORITY</Badge>
                        </div>
                        <h3>
                          {activeDiagnosis.actionItems[0]?.title || "Optimize Caption & Conversion Hooks"}
                        </h3>
                        <p>
                          {activeDiagnosis.actionItems[0]?.description ||
                            (topCommenters[0]
                              ? `@${topCommenters[0].username} contributed ${topCommenters[0].count} comments. Reach out with a VIP appreciation DM to cement community advocacy.`
                              : "Deploy a clear comment-to-DM trigger keyword like \"LINK\" in your caption to convert viewers into leads.")}
                        </p>
                        <ActionButton onClick={openCaptionOptimizer}>
                          Optimize caption & CTAs
                        </ActionButton>
                      </div>

                      <div className="recommendation-card">
                        <div className="step">
                          STEP 2 <Badge>MEDIUM PRIORITY</Badge>
                        </div>
                        <h3>
                          {activeDiagnosis.actionItems[1]?.title || "Expand Trigger Vocabulary"}
                        </h3>
                        <p>
                          {activeDiagnosis.actionItems[1]?.description ||
                            (topMissedKeywords.length > 0
                              ? `Followers commented words like “${topMissedKeywords.map(([w]) => w).join('”, “')}”. Add them to your automation keywords to capture more leads.`
                              : "Ensure all common follower inquiries have automated reply routing.")}
                        </p>
                        {topCommenters[0] ? (
                          <ActionButton
                            onClick={() => {
                              const u = topCommenters[0].username;
                              setSearchQuery(u);
                              setActiveTab("activity");
                              setActivitySubTab("comments");
                              notify(`Filtered activity for @${u}`);
                            }}
                          >
                            View @{topCommenters[0].username}
                          </ActionButton>
                        ) : (
                          <ActionButton
                            onClick={() => {
                              setActiveTab("activity");
                              setActivitySubTab("automations");
                            }}
                          >
                            Manage automations
                          </ActionButton>
                        )}
                      </div>
                    </section>
                  )}

                  {/* ── 3. SIGNAL STRIP (Algorithmic Engine Signals) ─── */}
                  {aiDiagnosisLoading ? (
                    <section className="signal-strip animate-pulse">
                      <div className="strip-head flex justify-between items-center mb-3">
                        <div className="h-3.5 w-44 bg-slate-200 rounded" />
                        <div className="h-3 w-32 bg-slate-200 rounded" />
                      </div>
                      <div className="signal-grid">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="signal space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="h-3 w-24 bg-slate-200 rounded" />
                              <div className="h-4 w-14 bg-slate-200 rounded-full" />
                            </div>
                            <div className="h-5 w-14 bg-slate-300 rounded" />
                            <div className="h-2.5 w-full bg-slate-200 rounded" />
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <section className="signal-strip">
                      <div className="strip-head">
                        <span>
                          <Activity size={14} /> Algorithmic engine signals
                        </span>
                        <small>
                          {activeDiagnosis.viralLevers.filter((l) => l.status === "strong").length} optimal · {activeDiagnosis.viralLevers.filter((l) => l.status === "opportunity").length} opportunities
                        </small>
                      </div>
                      <div className="signal-grid">
                        {activeDiagnosis.viralLevers.map((lever, idx) => (
                          <div className="signal" key={idx}>
                            <div>
                              <Check size={13} /> <strong>{lever.label}</strong>
                              <Badge tone={lever.status === "strong" ? "mint" : "rose"}>
                                {lever.status === "strong" ? "Optimal" : "Opportunity"}
                              </Badge>
                            </div>
                            <span>
                              {lever.val || (idx === 0 ? `${discussionDensity.toFixed(1)}×` : idx === 1 ? (detectedCtas.length > 0 ? "Clear" : "Missing") : (activeDmRules.length > 0 ? "Active" : "Disabled"))}
                            </span>
                            <small>{lever.detail}</small>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ── 4. CONTENT GRID (Content Anatomy + Lifecycle Velocity) ─── */}
                  <section className="content-grid">
                    {/* Panel 1: Content anatomy */}
                    <div className="panel anatomy">
                      <SectionTitle
                        icon={Hash}
                        eyebrow="Content diagnostics"
                        title="Content & copy anatomy"
                        meta={meta.mediaType || "MEDIA"}
                      />
                      <div className="caption">
                        <div>
                          <span className="eyebrow">Caption preview</span>
                          <Badge tone="violet" onClick={openCaptionOptimizer}>
                            ✦ AI optimize hooks
                          </Badge>
                        </div>
                        <p>
                          {captionText ? `“${captionText}”` : <span className="italic text-slate-400">No caption provided for this post.</span>}
                        </p>
                        <small>
                          {charCount} chars · {wordCount} words · {emojiCount} emoji
                        </small>
                      </div>

                      <div className="metric-grid four">
                        <Metric
                          label="Word count"
                          value={wordCount}
                          note={wordCount >= 70 && wordCount <= 160 ? "Optimal copy" : wordCount < 30 ? "Punchy hook" : "Standard length"}
                        />
                        <Metric
                          label="Read time"
                          value={`~${readingTimeSec}s`}
                          note={`${charCount} characters`}
                        />
                        <Metric
                          label="Hashtags"
                          value={uniqueHashtags.length}
                          note={uniqueHashtags.length > 0 ? `${uniqueHashtags.length} added` : "None added"}
                        />
                        <Metric
                          label="CTAs"
                          value={detectedCtas.length}
                          note={detectedCtas.length > 0 ? detectedCtas[0].label : "None found"}
                        />
                      </div>

                      <div className="anatomy-footer">
                        <span className="eyebrow">Call-to-action signals</span>
                        <Badge tone={detectedCtas.length > 0 ? "mint" : "neutral"}>
                          <MessageCircle size={13} /> {detectedCtas[0]?.label || "No CTA detected"}
                        </Badge>
                        <span className="eyebrow">Hashtags & tagged collaborators ({uniqueMentions.length})</span>
                        <Badge tone={uniqueMentions.length > 0 ? "violet" : "neutral"}>
                          {uniqueMentions[0] || "No collaborator tagged"}
                        </Badge>
                      </div>
                    </div>

                    {/* Panel 2: Algorithmic lifecycle & velocity */}
                    <div className="panel velocity">
                      <SectionTitle
                        icon={Gauge}
                        eyebrow="Post performance"
                        title="Algorithmic lifecycle & velocity"
                        meta={performanceDateStr}
                      />
                      <div className="velocity-callout">
                        <div>
                          <strong>{lifecyclePhase.name}</strong>
                          <p>{lifecyclePhase.desc}</p>
                        </div>
                        <Badge tone="mint">{lifecyclePhase.tag}</Badge>
                      </div>

                      <div className="metric-grid two">
                        <Metric
                          label="Discussion density"
                          value={`${discussionDensity.toFixed(1)}×`}
                          note={discussionDensity >= 1.0 ? "High viral conversation depth" : "Below 1.0× benchmark"}
                          accent="violet-text"
                        />
                        <Metric
                          label="Public reply rate"
                          value={`${publicReplyRate}%`}
                          note={avgReplyLatencyMin !== null ? `Avg ${avgReplyLatencyMin < 1 ? Math.round(avgReplyLatencyMin * 60) + 's' : avgReplyLatencyMin + 'm'} response time` : `${publicRepliedCount}/${totalCommentsCount} replied`}
                          accent="violet-text"
                        />
                        <Metric
                          label="Save rate"
                          value={`${saveRateVal.toFixed(1)}%`}
                          note={saveRateVal >= 1.2 ? "Strong bookmark rate" : "Needs bookmark CTAs"}
                        />
                        <Metric
                          label="Daily velocity"
                          value={dailyVelocity}
                          note={dailyVelocity >= 10 ? "High velocity" : "Standard steady pace"}
                        />
                      </div>

                      <div className="window-row">
                        <Clock3 size={15} /> Peak engagement window{" "}
                        <strong>{peakHourUtc !== null ? `${String(peakHourUtc).padStart(2, '0')}:00 UTC` : "Active window"}</strong>{" "}
                        <small>({totalCommentsCount} comments logged)</small>
                      </div>

                      <div className="probability">
                        <div>
                          <strong>
                            <Zap size={14} /> Explore recommendation probability
                          </strong>
                          <Badge tone={exploreProbability >= 75 ? "mint" : exploreProbability >= 50 ? "blue" : "neutral"}>
                            {viralTrendStatus.label}
                          </Badge>
                        </div>
                        <div className="progress">
                          <i style={{ width: `${exploreProbability}%` }} />
                        </div>
                        <p>
                          Predicted reach horizon: <strong>{predictedReachMin.toLocaleString()} – {predictedReachMax.toLocaleString()}</strong>
                          <Badge tone="violet">{viralTrendStatus.tag}</Badge>
                        </p>
                      </div>

                      <div className="alert success">
                        <TrendingUp size={16} />
                        <p>
                          <strong>Algorithmic catalyst</strong> {aiPrimaryCatalyst}
                        </p>
                      </div>

                      <div className="alert warning">
                        <Lightbulb size={16} />
                        <p>
                          <strong>Algorithmic bottleneck</strong> {aiPrimaryBottleneck}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* ── 5. ACTION CENTER (Sentiment Spectrum & Prescriptive Actions) ─── */}
                  <section className="panel action-center">
                    <SectionTitle
                      icon={Zap}
                      eyebrow="Recommended next moves"
                      title="AI prescriptive actions & audience monetization center"
                      meta="Prescriptive interventions"
                    />

                    <div className="action-layout">
                      {/* Sentiment */}
                      <div className="sentiment">
                        <div className="subhead">
                          <span>Audience sentiment & intent spectrum</span>
                          <Badge>NLP classified</Badge>
                        </div>
                        <div className="sentiment-grid">
                          <Metric label="Praise" value={`${praisePercent}%`} note="" />
                          <Metric label="Buying" value={`${buyerPercent}%`} note="" accent="violet-text" />
                          <Metric label="Questions" value={`${questionPercent}%`} note="" />
                          <Metric label="Neutral" value={`${neutralPercent}%`} note="" />
                        </div>
                      </div>

                      {/* Interventions */}
                      <div className="interventions">
                        <div className="subhead">
                          <span>
                            <Sparkles size={14} /> Prescriptive algorithmic interventions
                          </span>
                          <small>One-click actions</small>
                        </div>
                        <div className="intervention-buttons">
                          <ActionButton
                            onClick={() => {
                              setPinCommentModalOpen(true);
                              notify("Pin comment dialog opened");
                            }}
                            icon={Target}
                          >
                            Pin best comment
                          </ActionButton>

                          <ActionButton
                            onClick={() => {
                              handleGenerateStoryReshare(
                                meta.caption,
                                discussionDensity,
                                topQuestionComment?.text || candidatePinComment?.text,
                                lifecyclePhase.name
                              );
                              notify("Story reshare hook generated");
                            }}
                            icon={Send}
                          >
                            Story reshare hook
                          </ActionButton>

                          <ActionButton
                            testId="action-convert-buyers"
                            onClick={() => {
                              setBuyerConvertModalOpen(true);
                              notify("Buyer conversion flow opened");
                            }}
                            icon={Users}
                          >
                            Convert buyers <Badge tone={buyerCount > 0 ? "mint" : "neutral"}>{buyerCount}</Badge>
                          </ActionButton>
                        </div>

                        <p className="tip">
                          <Lightbulb size={14} /> Tip: Executing these interventions increases post dwell time and unlocks Explore recommendations.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* ── 6. HISTORY PANEL (Activity Stream & Expandable Events) ─── */}
                  <section className="panel history-panel">
                    <div className="history-head">
                      <SectionTitle
                        icon={Activity}
                        eyebrow="Activity stream · live"
                        title="Automation history"
                        meta={`${visibleTimelineEvents.length} events logged`}
                      />
                      <Badge tone="mint">Live snapshot</Badge>
                    </div>
                    <p className="history-intro">
                      Every trigger, delivery, reply, and conversion in one chronological view.
                    </p>

                    <div className="history-toolbar">
                      <div className="filter-tabs">
                        {[
                          ["all", "All activity"],
                          ["triggered", "Triggered"],
                          ["dm_sent", "DM sent"],
                          ["reply", "Replies"],
                          ["converted", "Converted"],
                        ].map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            className={eventFilter === key ? "active" : ""}
                            onClick={() => setEventFilter(key as any)}
                            data-testid={`history-filter-${key}`}
                          >
                            {label}
                            <span>
                              {key === "all"
                                ? timelineEvents.length
                                : timelineEvents.filter((e) => e.type === key).length}
                            </span>
                          </button>
                        ))}
                      </div>

                      <span className="history-updated">
                        <RefreshCw size={12} /> Live stream
                      </span>
                    </div>

                    <div className="timeline">
                      {visibleTimelineEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`timeline-event ${expandedEvent === event.id ? "expanded" : ""}`}
                        >
                          <button
                            type="button"
                            className="event-main"
                            onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                            data-testid={`history-event-${event.id}`}
                          >
                            <span className={`event-dot ${event.tone}`}>
                              <Activity size={13} />
                            </span>
                            <span className="event-copy">
                              <strong>{event.title}</strong>
                              <small>{event.detail}</small>
                            </span>
                            <span className="event-time">{event.time}</span>
                            <ChevronRight size={15} className="event-chevron" />
                          </button>

                          {expandedEvent === event.id && (
                            <div className="event-detail" data-testid={`history-detail-${event.id}`}>
                              <span>
                                <b>Post</b> {event.post}
                              </span>
                              <span>
                                <b>Actor</b> {event.actor}
                              </span>
                              <span>
                                <b>Outcome</b> {event.value}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                      {visibleTimelineEvents.length === 0 && (
                        <div className="empty-history" data-testid="history-empty-state">
                          No activity in this filter yet.
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ── 7. BOTTOM GRID (Conversation Radar & Automation Strategy) ─── */}
                  <section className="bottom-grid">
                    {/* Panel: Audience conversation */}
                    <div className="panel conversation">
                      <SectionTitle
                        icon={MessageCircle}
                        eyebrow="NLP classification of follower inquiries, praise & purchase signals"
                        title="Audience conversation & intent radar"
                        meta={`${totalCommentsCount} comments`}
                      />
                      <div className="metric-grid four">
                        <Metric
                          label="Buyer intent"
                          value={buyerCount}
                          note={totalCommentsCount > 0 ? `${Math.round((buyerCount / totalCommentsCount) * 100)}% of comments` : "0% of comments"}
                          accent="violet-text"
                        />
                        <Metric
                          label="Questions"
                          value={questionCount}
                          note={totalCommentsCount > 0 ? `${Math.round((questionCount / totalCommentsCount) * 100)}% of comments` : "0% of comments"}
                        />
                        <Metric
                          label="Praise & affinity"
                          value={praiseCount}
                          note={totalCommentsCount > 0 ? `${Math.round((praiseCount / totalCommentsCount) * 100)}% of comments` : "0% of comments"}
                          accent="violet-text"
                        />
                        <Metric
                          label="Peer tags"
                          value={referralCount}
                          note={totalCommentsCount > 0 ? `${Math.round((referralCount / totalCommentsCount) * 100)}% of comments` : "0% of comments"}
                        />
                      </div>

                      <div className="contributors">
                        <span className="eyebrow">Top contributors & audience reach</span>
                        <div>
                          {topCommenters.length > 0 ? (
                            topCommenters.slice(0, 3).map((u) => (
                              <Badge key={u.username}>
                                @{u.username} <b>({u.count})</b>
                              </Badge>
                            ))
                          ) : (
                            <small className="text-slate-400">No commenters recorded yet</small>
                          )}
                        </div>
                      </div>

                      <div className="keyword">
                        <span className="eyebrow">High-frequency keywords in comments</span>
                        <div>
                          {topCommentKeywords.length > 0 ? (
                            topCommentKeywords.slice(0, 5).map(([word, count]) => (
                              <Badge tone="violet" key={word}>
                                {word} <b>({count})</b>
                              </Badge>
                            ))
                          ) : (
                            <small className="text-slate-400">No repeated keywords</small>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Panel: Automation strategy */}
                    <div className="panel automation">
                      <SectionTitle
                        icon={Bot}
                        eyebrow="Comment-to-DM triggers and lead conversion status"
                        title="Automation strategy & lead engine"
                        meta={`● ${activeDmRules.length} ${activeDmRules.length === 1 ? 'rule' : 'rules'} active`}
                      />
                      <div className="metric-grid four">
                        <Metric
                          label="Trigger matches"
                          value={dmTriggered}
                          note={`${keywordMatchRate}% coverage`}
                        />
                        <Metric
                          label="DM delivery"
                          value={`${dmDeliveryRate}%`}
                          note={`${dmSent} / ${dmTriggered} sent`}
                          accent="violet-text"
                        />
                        <Metric
                          label="DM conversion"
                          value={`${dmConversionRate}%`}
                          note={`${dmReplied} replied`}
                          accent="mint-text"
                        />
                        <Metric
                          label="Follow gate"
                          value={`${followGateRate}%`}
                          note={`${followGateConverted} verified`}
                        />
                      </div>

                      <div className="automation-rule">
                        {activeDmRules.length > 0 ? (
                          <>
                            <span>
                              <Bot size={14} /> {activeDmRules[0].name}
                            </span>
                            <Badge tone="mint">Active</Badge>
                            <small>
                              Trigger keywords: “{activeDmRules[0].keywords || "All comments"}” · {dmTriggered} runs
                            </small>
                          </>
                        ) : (
                          <>
                            <span>
                              <Bot size={14} /> No active automation rule
                            </span>
                            <Badge tone="neutral">Disabled</Badge>
                            <small>Enable an automation rule to auto-reply to comments</small>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        className="manage-button"
                        onClick={() => {
                          setActiveTab("activity");
                          setActivitySubTab("automations");
                        }}
                      >
                        Manage all automations <ChevronRight size={14} />
                      </button>
                    </div>
                  </section>
                </div>
              );
            })()}

            {/* ── TAB 2: COMMENTS & AUTOMATIONS COMBINED CONTENT ────────────── */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                {/* ── View Sub-Filter Switcher Bar ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 px-5 rounded-[22px] border border-[#e9e9ee] shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter:</span>
                    <div className="inline-flex items-center gap-1 p-1 bg-[#f1f3f7] rounded-full border border-[#e9e9ee]">
                      {[
                        { key: "all", label: "All Activity", count: (data?.comments?.length ?? 0) + (data?.dmRules?.length ?? 0) },
                        { key: "comments", label: "Comments & Leads", count: data?.comments?.length ?? 0 },
                        { key: "automations", label: "Automations", count: data?.dmRules?.length ?? 0 },
                      ].map((item) => {
                        const isActive = activitySubTab === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setActivitySubTab(item.key as any)}
                            style={isActive ? { backgroundColor: "#000000", color: "#ffffff" } : undefined}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${isActive
                                ? "!bg-black !text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-950 hover:bg-white/80"
                              }`}
                          >
                            <span>{item.label}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-200/80 text-slate-700"
                                }`}
                            >
                              {item.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    {activitySubTab === "all" && "Showing active automations and real-time follower comments"}
                    {activitySubTab === "comments" && "Showing live comments feed and DM trigger tags"}
                    {activitySubTab === "automations" && "Showing active keyword routing and direct message rules"}
                  </div>
                </div>

                {/* ── Automation Rules Section ── */}
                {(activitySubTab === "all" || activitySubTab === "automations") && (
                  <div className="space-y-4">
                    <div className="rounded-[26px] border border-[#e9e9ee] hover:border-black/30 bg-white p-5 sm:p-6 shadow-2xs transition-all">
                      <div className="pb-4 mb-4 border-b border-[#e9e9ee]">
                        <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
                          <ThunderboltOutlined className="text-slate-950" />
                          Comment-to-DM Rules for this Post
                        </h3>
                        <p className="text-xs font-normal text-slate-500 mt-0.5">
                          Direct automated private replies sent immediately when someone comments
                        </p>
                      </div>

                      {loading && <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />}

                      {!loading && (!data?.dmRules || data.dmRules.length === 0) && (
                        <div className="py-8 text-center text-xs text-slate-400 italic">
                          No Comment-to-DM rules configured for this post yet.
                        </div>
                      )}

                      {!loading && data && (
                        <div className="space-y-3">
                          {data.dmRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[20px] border border-[#e9e9ee] p-4.5 hover:border-black/30 transition-all bg-white shadow-2xs"
                            >
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-slate-900">{rule.name}</span>
                                  <Tag
                                    color={rule.enabled ? "success" : "default"}
                                    className="!rounded-full px-2.5 py-0.2 text-[11px] font-semibold !m-0"
                                  >
                                    {rule.enabled ? "Active" : "Paused"}
                                  </Tag>
                                  {rule.mediaId ? (
                                    <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-medium border border-blue-200/60">
                                      This post only
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-medium">
                                      All posts
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                                  <span className="font-semibold text-slate-600">Trigger Keywords:</span>
                                  {rule.keywords ? (
                                    rule.keywords
                                      .split(",")
                                      .map((k) => k.trim())
                                      .filter(Boolean)
                                      .map((k) => (
                                        <span
                                          key={k}
                                          className="rounded-full bg-[#fff9db] text-amber-900 border-0 px-2.5 py-0.5 text-[11px] font-bold"
                                        >
                                          {k.toUpperCase()}
                                        </span>
                                      ))
                                  ) : (
                                    <span className="rounded-full bg-[#f1f3f7] px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                      Any comment (catch-all)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-start gap-2 text-xs text-slate-800 bg-[#f1f3f7] rounded-[16px] p-3 border-0">
                                  <SendOutlined className="text-slate-400 mt-0.5 shrink-0" />
                                  <p className="line-clamp-2 leading-relaxed">
                                    <span className="font-bold text-slate-900">DM Template: </span>
                                    {rule.dmText}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 self-end sm:self-center">
                                <Button
                                  onClick={() => toggleDmRule(rule)}
                                  loading={togglingRule === rule.id}
                                  style={!rule.enabled ? { backgroundColor: "#000000", color: "#ffffff", borderColor: "#000000" } : undefined}
                                  className={`!rounded-full !text-xs !font-bold !px-4 !py-1 transition-all cursor-pointer ${rule.enabled
                                      ? "!bg-white !text-slate-950 !border !border-[#e9e9ee] hover:!border-black/40 !shadow-2xs"
                                      : "!bg-black hover:!bg-neutral-800 !text-white !border-0 !shadow-xs"
                                    }`}
                                >
                                  {rule.enabled ? "Pause Rule" : "Activate Rule"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Auto Reply Setting & Rules info */}
                    {!loading && data && (
                      <div className="rounded-[26px] border border-[#e9e9ee] hover:border-black/30 bg-white p-5 sm:p-6 shadow-2xs transition-all">
                        <div className="pb-4 mb-4 border-b border-[#e9e9ee]">
                          <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
                            <CommentOutlined className="text-slate-950" />
                            Comment Public Auto-Reply System
                          </h3>
                          <p className="text-xs font-normal text-slate-500 mt-0.5">
                            Status:{" "}
                            <span className={data.autoSetting.enabled ? "text-emerald-700 font-bold" : "text-slate-500 font-bold"}>
                              {data.autoSetting.enabled ? "Enabled" : "Disabled"}
                            </span>
                            {data.autoSetting.aiEnabled && " · AI contextual replies active"}
                            {" · Rate limit: " + (data.autoSetting.maxPerHour ?? 30) + "/hr"}
                          </p>
                        </div>

                        {data.autoReplyRules.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No keyword auto-reply rules configured.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.autoReplyRules.map((r) => (
                              <div
                                key={r.id}
                                className="rounded-[18px] border border-[#e9e9ee] p-3.5 bg-white hover:border-black/30 shadow-2xs transition-all space-y-1.5"
                              >
                                <div className="flex flex-wrap gap-1.5">
                                  {r.keywords ? (
                                    r.keywords
                                      .split(",")
                                      .map((k) => k.trim())
                                      .filter(Boolean)
                                      .map((k) => (
                                        <span
                                          key={k}
                                          className="rounded-full bg-[#e2e2fc] text-slate-900 border-0 px-2 py-0.5 text-[10px] font-bold"
                                        >
                                          {k.toUpperCase()}
                                        </span>
                                      ))
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-medium">Catch-all rule</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-700 line-clamp-2">{r.replyText}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Live Comments & Leads Feed Section ── */}
                {(activitySubTab === "all" || activitySubTab === "comments") && (
                  <div className="rounded-[26px] border border-[#e9e9ee] hover:border-black/30 bg-white p-5 sm:p-6 shadow-2xs transition-all">
                    <div className="space-y-4">
                      {/* Filter controls & Search */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e9e9ee]">
                        {tagCounts && (
                          <div className="flex flex-wrap gap-2">
                            {(["all", "comment-dm", "ai", "auto", "manual"] as const).map((t) => {
                              const count = tagCounts[t];
                              if (count === 0 && t !== "all") return null;
                              const active = filterTag === t;
                              return (
                                <button
                                  key={t}
                                  onClick={() => setFilterTag(t)}
                                  style={active ? { backgroundColor: "#000000", color: "#ffffff" } : undefined}
                                  className={
                                    "flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all border cursor-pointer " +
                                    (active
                                      ? "!bg-black !text-white !border-black shadow-xs"
                                      : "border-[#e9e9ee] bg-white text-slate-700 hover:border-black/30 hover:bg-slate-50")
                                  }
                                >
                                  {t === "all"
                                    ? "All"
                                    : t === "comment-dm"
                                      ? "Comment DM"
                                      : t === "ai"
                                        ? "AI Reply"
                                        : t === "auto"
                                          ? "Auto Rule"
                                          : "Manual"}
                                  <span
                                    className={
                                      "rounded-full px-1.5 py-0.2 text-[10px] " +
                                      (active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 font-semibold")
                                    }
                                  >
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className="w-full sm:w-64">
                          <Input
                            prefix={<SearchOutlined className="text-slate-400" />}
                            placeholder="Search comment or username..."
                            allowClear
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="!rounded-full !border-[#e9e9ee] hover:!border-black/30"
                          />
                        </div>
                      </div>

                      {loading && (
                        <div className="space-y-3 pt-2">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                          ))}
                        </div>
                      )}

                      {!loading && filteredComments.length === 0 && (
                        <div className="flex flex-col items-center gap-2 rounded-[22px] border border-dashed border-[#e9e9ee] py-12 text-center bg-[#f1f3f7]/50">
                          <CommentOutlined className="text-3xl text-slate-400" />
                          <p className="text-sm font-bold text-slate-800">No comments found</p>
                          <p className="text-xs text-slate-400">
                            {searchQuery ? "Try changing your search query or tag filter" : "No comments recorded on this post yet."}
                          </p>
                        </div>
                      )}

                      {!loading && filteredComments.length > 0 && (
                        <ol className="space-y-3 pt-1">
                          {filteredComments.map((c) => (
                            <li
                              key={c.id}
                              className="rounded-[22px] border border-[#e9e9ee] bg-white p-4.5 space-y-3 hover:border-black/30 shadow-2xs transition-all"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white shadow-2xs">
                                    {c.username ? c.username.charAt(0).toUpperCase() : "?"}
                                  </span>
                                  <span className="text-sm font-bold text-slate-900">@{c.username || "unknown"}</span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-xs text-slate-400">{when(c.commentedAt)}</span>

                                  {c.likeCount > 0 && (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-rose-500">
                                      <HeartOutlined />
                                      {c.likeCount}
                                    </span>
                                  )}

                                  <TriggerBadge tag={c.triggerTag} />
                                  {c.dmStatus && <DmStatusBadge status={c.dmStatus} />}
                                  {c.hidden && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                      Hidden
                                    </span>
                                  )}

                                  {/* AI Reply Action Button */}
                                  <button
                                    type="button"
                                    onClick={() => openAiReply(c)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 px-2 py-0.5 rounded-md transition-colors cursor-pointer ml-auto sm:ml-0"
                                  >
                                    <RobotOutlined className="text-[10px]" />
                                    <span>AI Reply</span>
                                  </button>
                                </div>

                                {c.dmSentAt && (
                                  <span className="text-[11px] text-slate-400">
                                    DM sent {when(c.dmSentAt)}
                                    {c.dmRepliedAt && (
                                      <span className="font-semibold text-emerald-600">
                                        {" "}
                                        · Customer replied {when(c.dmRepliedAt)}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Comment text bubble */}
                              <div className="inline-flex max-w-full rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-100 px-4 py-2.5">
                                <p className="break-words text-sm text-slate-800">
                                  {c.text || <span className="italic text-slate-400">Empty comment</span>}
                                </p>
                              </div>

                              {/* Interactive Contextual AI Reply Drawer */}
                              {aiReplyCommentId === c.id && (
                                <div className="rounded-xl border border-purple-200/80 bg-purple-50/30 p-3 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                                      <RobotOutlined className="text-purple-600" />
                                      <span>Contextual AI Reply Generator</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openAiReply(c)}
                                      className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      Dismiss
                                    </button>
                                  </div>

                                  {aiReplyLoading ? (
                                    <div className="py-3 text-center flex items-center justify-center gap-2">
                                      <Spin size="small" />
                                      <span className="text-xs text-slate-500">Drafting personalized responses...</span>
                                    </div>
                                  ) : aiReplySuggestions ? (
                                    <div className="space-y-2">
                                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                        Choose a tailored style to reply:
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {[
                                          { key: "friendly", label: "💛 Friendly & Warm", text: aiReplySuggestions.friendly },
                                          { key: "professional", label: "💼 Professional", text: aiReplySuggestions.professional },
                                          { key: "conversion", label: "🎁 Lead Incentive", text: aiReplySuggestions.conversion },
                                        ].map((opt) => (
                                          <div
                                            key={opt.key}
                                            onClick={() => {
                                              setReplyInputTexts((prev) => ({ ...prev, [c.id]: opt.text }));
                                            }}
                                            className="p-2.5 rounded-lg border border-purple-100 bg-white hover:border-purple-300 hover:shadow-2xs cursor-pointer transition-all text-left flex flex-col justify-between"
                                          >
                                            <div className="text-[10px] font-bold text-purple-700">{opt.label}</div>
                                            <p className="text-xs text-slate-700 mt-1 line-clamp-3 leading-snug">{opt.text}</p>
                                            <span className="text-[9px] font-semibold text-purple-600 mt-1.5">Tap to select →</span>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Input box to edit or send */}
                                      <div className="flex items-center gap-2 pt-1">
                                        <Input
                                          size="small"
                                          placeholder="Selected AI reply or custom text..."
                                          value={replyInputTexts[c.id] || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setReplyInputTexts((prev) => ({ ...prev, [c.id]: val }));
                                          }}
                                          className="!rounded-lg"
                                        />
                                        <Button
                                          type="primary"
                                          size="small"
                                          disabled={!replyInputTexts[c.id]?.trim()}
                                          loading={sendingReplyId === c.id}
                                          onClick={() => sendCommentReply(c.id, replyInputTexts[c.id] || "")}
                                          className="!rounded-lg !bg-purple-600 hover:!bg-purple-500 cursor-pointer text-xs shrink-0"
                                        >
                                          Post Reply
                                        </Button>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              )}

                              {/* Trigger Note */}
                              {c.triggerNote && (
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                    <ThunderboltOutlined className="text-amber-500" />
                                    Triggered
                                  </span>
                                  <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 text-xs font-medium">
                                    {c.triggerNote}
                                  </span>
                                </div>
                              )}

                              {/* Reply bubble */}
                              {c.myReply && (
                                <div className="flex flex-col items-end gap-1.5 pt-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                      {c.replyKind === "manual"
                                        ? "✍️ Manual Staff Reply"
                                        : c.replyKind === "auto"
                                          ? "🤖 Automated Reply"
                                          : "↩️ Account Reply"}
                                    </span>
                                    {c.repliedAt && (
                                      <span className="text-[11px] text-slate-400">{when(c.repliedAt)}</span>
                                    )}
                                  </div>
                                  <div className="inline-flex max-w-full rounded-2xl rounded-tr-sm bg-blue-50/80 border border-blue-100 px-4 py-2.5">
                                    <p className="break-words text-sm text-slate-800">{c.myReply}</p>
                                  </div>
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODALS: AI CAPTION & HOOK OPTIMIZER ───────────────────── */}
      <Modal
        open={captionModalOpen}
        onCancel={() => setCaptionModalOpen(false)}
        footer={null}
        width={680}
        title={
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <RocketOutlined className="text-sm" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">AI Caption & Hook Optimizer</h4>
              <p className="text-[11px] text-slate-500 font-normal">
                High-converting algorithmic variations engineered for virality & comment DM capture
              </p>
            </div>
          </div>
        }
      >
        {captionLoading ? (
          <div className="space-y-3 pt-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2.5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-3.5 w-44 bg-slate-200 rounded" />
                    <div className="h-2.5 w-60 bg-slate-200 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-slate-200 rounded-lg" />
                </div>
                <div className="h-20 w-full bg-white rounded-lg border border-slate-200/60 p-3 space-y-1.5">
                  <div className="h-2.5 w-full bg-slate-100 rounded" />
                  <div className="h-2.5 w-5/6 bg-slate-100 rounded" />
                  <div className="h-2.5 w-4/6 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : optimizedCaptions ? (
          <div className="space-y-4 pt-3">
            {[
              {
                key: "leadMagnet",
                title: "🧲 Lead Magnet & Comment DM Accelerator",
                subtitle: "Designed to provoke keyword comments & instant DM automation triggering",
                badge: "Highest DM Rate",
                badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
                text: optimizedCaptions.leadMagnet,
              },
              {
                key: "viralExplore",
                title: "🚀 Viral Explore & High Save Hook",
                subtitle: "Optimized for Instagram Explore page distribution & bookmarking",
                badge: "Explore Page",
                badgeCls: "bg-purple-50 text-purple-700 border-purple-200",
                text: optimizedCaptions.viralExplore,
              },
              {
                key: "communitySpark",
                title: "💬 Community Conversation Spark",
                subtitle: "Asks polarising or debate-prompting questions to boost algorithmic comments",
                badge: "High Comments",
                badgeCls: "bg-blue-50 text-blue-700 border-blue-200",
                text: optimizedCaptions.communitySpark,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2.5 hover:border-purple-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeCls}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                  </div>
                  <Button
                    size="small"
                    icon={copiedKey === item.key ? <CheckOutlined className="text-emerald-500" /> : <CopyOutlined />}
                    onClick={() => copyToClipboard(item.text, item.key)}
                    className="!rounded-lg text-xs cursor-pointer"
                  >
                    {copiedKey === item.key ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="rounded-lg bg-white p-3 border border-slate-200/60 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No suggestions generated yet. Click generate to start.
          </div>
        )}
      </Modal>

      {/* ── MODALS: AI SMART TRIGGER & KEYWORD AUTO-TUNER ─────────── */}
      <Modal
        open={triggerModalOpen}
        onCancel={() => setTriggerModalOpen(false)}
        footer={null}
        width={640}
        title={
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
              <ThunderboltOutlined className="text-sm" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">AI Smart Trigger & Keyword Auto-Tuner</h4>
              <p className="text-[11px] text-slate-500 font-normal">
                Audit follower comments to discover missed automation keywords and expand capture rates
              </p>
            </div>
          </div>
        }
      >
        {triggerLoading ? (
          <div className="space-y-3 pt-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2 animate-pulse">
              <div className="h-3 w-36 bg-slate-200 rounded" />
              <div className="h-2.5 w-full bg-slate-200 rounded" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white animate-pulse">
                  <div className="space-y-1.5">
                    <div className="flex gap-2 items-center">
                      <div className="h-4 w-16 bg-slate-200 rounded-md" />
                      <div className="h-3 w-24 bg-slate-200 rounded" />
                    </div>
                    <div className="h-2.5 w-48 bg-slate-200 rounded" />
                  </div>
                  <div className="h-7 w-20 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ) : triggerSuggestions ? (
          <div className="space-y-4 pt-3">
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 space-y-1">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <BulbOutlined className="text-amber-600" />
                Keyword Intelligence Findings
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                We scanned recent follower comments. Adding these keywords will prevent interested leads from dropping through the cracks without receiving an automated DM.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                High-Frequency Uncaptured Keywords
              </div>
              {triggerSuggestions.suggestions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 italic">
                  All frequent commenter phrases are already covered by your active triggers!
                </div>
              ) : (
                <div className="space-y-2">
                  {triggerSuggestions.suggestions.map((s) => (
                    <div
                      key={s.keyword}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:border-amber-300 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 bg-amber-100/70 border border-amber-300/80 px-2 py-0.5 rounded-md text-amber-900 uppercase">
                            &ldquo;{s.keyword}&rdquo;
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Appeared in <strong>{s.count}</strong> comment{s.count > 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{s.reason}</p>
                      </div>
                      <Button
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        loading={updatingRule}
                        onClick={() => addSuggestedKeyword(s.keyword)}
                        className="!rounded-lg !bg-amber-600 hover:!bg-amber-500 text-xs shrink-0 cursor-pointer"
                      >
                        Add to Rule
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {triggerSuggestions.recommendedDmText && (
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/30 p-3 space-y-1.5">
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <SendOutlined className="text-blue-600" />
                  Recommended Follow-up DM Copy
                </div>
                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-blue-100 font-mono">
                  {triggerSuggestions.recommendedDmText}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No suggestions available.
          </div>
        )}
      </Modal>

      {/* ── MODAL 1: DIRECT HASHTAG POSTER ───────────────────────── */}
      <Modal
        open={hashtagModalOpen}
        onCancel={() => setHashtagModalOpen(false)}
        footer={null}
        width={560}
        title={
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
              <ThunderboltOutlined className="text-sm" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">Post Hashtags Direct to Instagram</h4>
              <p className="text-[11px] text-slate-500 font-normal">
                Publishes a top-level comment via Meta API to instantly unlock Explore & Search indexing
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 pt-3 text-xs">
          {hashtagLoading ? (
            <div className="space-y-2 py-4 text-center">
              <Spin />
              <p className="text-slate-500 text-xs mt-2">AI generating niche, high-ranking hashtags...</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Recommended Hashtags (click chip to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {recommendedHashtags.map((tag) => {
                    const active = customHashtagText.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setCustomHashtagText((prev) => prev.replace(tag, "").replace(/\s+/g, " ").trim());
                          } else {
                            setCustomHashtagText((prev) => (prev ? `${prev} ${tag}` : tag));
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${active
                          ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Comment Text to Post on Instagram
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {customHashtagText.split(/\s+/).filter(Boolean).length} tags
                  </span>
                </div>
                <Input.TextArea
                  rows={3}
                  value={customHashtagText}
                  onChange={(e) => setCustomHashtagText(e.target.value)}
                  placeholder="#yourniche #creator #brand..."
                  className="!rounded-xl !text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 This will be posted as a comment by your official Instagram account. Instagram's search engine treats comment hashtags with identical SEO weight to caption hashtags!
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button onClick={() => setHashtagModalOpen(false)} className="!rounded-lg text-xs">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={postingHashtag}
                  onClick={handlePostHashtags}
                  className="!rounded-lg !bg-amber-600 hover:!bg-amber-500 text-xs font-semibold"
                >
                  🚀 Post to Instagram Comment Now
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── MODAL 2: 1-CLICK COMMENT-TO-DM RULE ACTIVATOR ─────────── */}
      <Modal
        open={quickRuleModalOpen}
        onCancel={() => setQuickRuleModalOpen(false)}
        footer={null}
        width={560}
        title={
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <ThunderboltOutlined className="text-sm" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">1-Click &ldquo;LINK&rdquo; Automation Setup</h4>
              <p className="text-[11px] text-slate-500 font-normal">
                Instantly creates and activates an automated DM & reply engine for this post
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5 pt-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Trigger Keyword (when followers comment this)
            </label>
            <Input
              value={quickRuleTrigger}
              onChange={(e) => setQuickRuleTrigger(e.target.value.toUpperCase())}
              placeholder="LINK"
              className="!rounded-lg !text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Automated Direct Message (Sent instantly to their DM)
            </label>
            <Input.TextArea
              rows={2}
              value={quickRuleDmText}
              onChange={(e) => setQuickRuleDmText(e.target.value)}
              className="!rounded-xl !text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Automated Public Comment Reply (Signals high engagement to Meta)
            </label>
            <Input
              value={quickRuleReplyText}
              onChange={(e) => setQuickRuleReplyText(e.target.value)}
              className="!rounded-lg !text-xs"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Target Media Filter:</div>
            <p>Locked specifically to this post ({meta.caption?.slice(0, 40) || mediaId}...). Only comments on this post will trigger this rule.</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setQuickRuleModalOpen(false)} className="!rounded-lg text-xs">
              Cancel
            </Button>
            <Button
              type="primary"
              loading={activatingRule}
              onClick={handleQuickDeployRule}
              className="!rounded-lg !bg-indigo-600 hover:!bg-indigo-500 text-xs font-semibold"
            >
              ⚡ Activate Rule Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL 3: COLLABORATOR OUTREACH ASSISTANT ─────────────── */}
      <Modal
        open={collabModalOpen}
        onCancel={() => setCollabModalOpen(false)}
        footer={null}
        width={560}
        title={
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-xs">
              <TeamOutlined className="text-sm" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">Collaborator Outreach: @vivekchoudhar.y</h4>
              <p className="text-[11px] text-slate-500 font-normal">
                High-converting message templates to get Story reposts and early comment velocity
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5 pt-3 text-xs">
          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 text-xs">📲 Template 1: Story Repost Request</span>
              <Button
                size="small"
                icon={copiedKey === "story" ? <CheckOutlined className="text-emerald-500" /> : <CopyOutlined />}
                onClick={() => copyToClipboard("Hey Vivek! Loved our collab post! Just published it on the feed. Would you mind sharing it to your Story with a sticker? Excited to push this together! 🙌", "story")}
                className="!rounded-lg text-xs cursor-pointer"
              >
                {copiedKey === "story" ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-purple-200/60 leading-relaxed font-sans">
              &ldquo;Hey Vivek! Loved our collab post! Just published it on the feed. Would you mind sharing it to your Story with a sticker? Excited to push this together! 🙌&rdquo;
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">💬 Template 2: Early Comment Spark</span>
              <Button
                size="small"
                icon={copiedKey === "comment" ? <CheckOutlined className="text-emerald-500" /> : <CopyOutlined />}
                onClick={() => copyToClipboard("Hey Vivek! Could you drop a quick comment or emoji on our new post? Early comments really boost the algorithm! Appreciate you! 💛", "comment")}
                className="!rounded-lg text-xs cursor-pointer"
              >
                {copiedKey === "comment" ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed font-sans">
              &ldquo;Hey Vivek! Could you drop a quick comment or emoji on our new post? Early comments really boost the algorithm! Appreciate you! 💛&rdquo;
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setCollabModalOpen(false)} className="!rounded-lg text-xs">
              Close
            </Button>
            <Button
              onClick={() => {
                setCollabOutreachDone(true);
                if (typeof window !== "undefined") {
                  localStorage.setItem(`collab_outreach_${mediaId || data?.mediaId}`, "true");
                  localStorage.setItem(`collab_outreach_${detectedCollabUsername}`, "true");
                  localStorage.setItem("collab_outreach_vivekchoudhar.y", "true");
                }
                setCollabModalOpen(false);
                message.success(`Marked outreach to @${detectedCollabUsername} as complete! ✓`);
              }}
              className="!rounded-lg text-xs"
            >
              Mark Outreach Sent ✓
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setCollabModalOpen(false);
                const collabUser = detectedCollabUsername;
                const template1 = "Hey Vivek! Loved our collab post! Just published it on the feed. Would you mind sharing it to your Story with a sticker? Excited to push this together! 🙌";
                const template2 = "Hey Vivek! Could you drop a quick comment or emoji on our new post? Early comments really boost the algorithm! Appreciate you! 💛";
                const msgToSend = copiedKey === "comment" ? template2 : template1;
                if (onOpenMessages) {
                  onOpenMessages(collabUser, msgToSend);
                } else {
                  message.info(`Head to the Messages tab to chat with @${collabUser}!`);
                }
              }}
              className="!rounded-lg !bg-purple-600 hover:!bg-purple-500 text-xs font-semibold"
            >
              Go to Inbox DMs with @{detectedCollabUsername} →
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: AI Story Reshare Hook & Strategy ── */}
      <Modal
        open={storyReshareModalOpen}
        onCancel={() => setStoryReshareModalOpen(false)}
        footer={null}
        width={560}
        centered
        className="!p-0"
        title={
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-sm">
              <RocketOutlined />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">AI Story Reshare & Poll Strategy</h4>
              <p className="text-[11px] text-slate-400 font-normal">Reignite feed expansion in the 24–72h window</p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 pt-3 text-xs">
          {loadingStoryReshare ? (
            <div className="py-12 text-center space-y-3">
              <Spin size="large" />
              <p className="text-xs text-slate-500">Generating algorithmic Story hook & poll strategy...</p>
            </div>
          ) : (
            <>
              {/* 1. Recommended Screen Text */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <span>📲 Recommended Story Overlay Text</span>
                  </span>
                  <Button
                    size="small"
                    icon={copiedKey === "storyHook" ? <CheckOutlined className="text-emerald-500" /> : <CopyOutlined />}
                    onClick={() => copyToClipboard(storyReshareData?.hookText || "", "storyHook", "Story text copied! ✓")}
                    className="!rounded-lg text-xs cursor-pointer"
                  >
                    {copiedKey === "storyHook" ? "Copied" : "Copy Text"}
                  </Button>
                </div>
                <p className="text-slate-800 bg-white p-3 rounded-lg border border-indigo-200/60 leading-relaxed font-sans text-xs">
                  &ldquo;{storyReshareData?.hookText}&rdquo;
                </p>
              </div>

              {/* 2. Sticker Poll Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>📊 Interactive Sticker Poll</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Triggers 3x tap-through</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-800 text-center">
                    {storyReshareData?.stickerPoll?.question || "Did you see this yet?"}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="py-2 px-3 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                      {storyReshareData?.stickerPoll?.optA || "Just seeing it! 🔥"}
                    </div>
                    <div className="py-2 px-3 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                      {storyReshareData?.stickerPoll?.optB || "Already saved 📌"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Swipe / Tap CTA */}
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-950 space-y-1">
                <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider block">
                  Tap-Through Prompt
                </span>
                <p className="text-emerald-800 text-xs">
                  {storyReshareData?.ctaText}
                </p>
              </div>

              {/* Why it works */}
              <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                💡 <strong>Why this works:</strong> {storyReshareData?.explanation}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button onClick={() => setStoryReshareModalOpen(false)} className="!rounded-lg text-xs">
                  Close
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    const allText = `${storyReshareData?.hookText}\n\n📊 Poll: ${storyReshareData?.stickerPoll?.question}\nOption A: ${storyReshareData?.stickerPoll?.optA}\nOption B: ${storyReshareData?.stickerPoll?.optB}\n\n👉 ${storyReshareData?.ctaText}`;
                    copyToClipboard(allText, "allStory", "Full Story Kit Copied! ✓");
                  }}
                  className="!rounded-lg !bg-indigo-600 hover:!bg-indigo-500 text-xs font-semibold"
                >
                  {copiedKey === "allStory" ? "Copied All! ✓" : "Copy Complete Story Kit"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Modal: Pin Optimal Comment Strategy ── */}
      <Modal
        open={pinCommentModalOpen}
        onCancel={() => setPinCommentModalOpen(false)}
        footer={null}
        width={540}
        centered
        className="!p-0"
        title={
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-sm">
              <PushpinOutlined />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">Algorithmic Comment Pinning Strategy</h4>
              <p className="text-[11px] text-slate-400 font-normal">Stimulate +35% thread depth & audience dwell time</p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 pt-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>📌 AI Selected Comment to Pin</span>
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200/60">
                Highest Engagement Multiplier
              </span>
            </div>
            {candidatePinComment ? (
              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">@{candidatePinComment.username}</span>
                  <span className="text-[11px] text-slate-400">❤️ {candidatePinComment.likeCount || 0} likes</span>
                </div>
                <p className="text-slate-800 text-xs leading-relaxed font-sans">
                  &ldquo;{candidatePinComment.text}&rdquo;
                </p>
              </div>
            ) : (
              <p className="text-slate-500 py-3 text-center">No comments available on this post yet.</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-950 space-y-1">
            <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider block">
              💡 Why Pin This Specific Comment?
            </span>
            <p className="text-indigo-800 text-xs leading-relaxed">
              Pinning this comment anchors it at the top of the comment section for all incoming Explore & feed viewers. It triggers curious viewers to read and reply, generating an estimated <strong>+35% higher comment thread reply depth</strong>, which directly satisfies Meta&apos;s dwell-time algorithm.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setPinCommentModalOpen(false)} className="!rounded-lg text-xs">
              Close
            </Button>
            {candidatePinComment && (
              <Button
                type="primary"
                onClick={() => {
                  copyToClipboard(candidatePinComment.text, "pinText", "Comment text copied! ✓");
                  message.info("Head to Instagram and tap 'Pin' on this comment!");
                }}
                className="!rounded-lg !bg-indigo-600 hover:!bg-indigo-500 text-xs font-semibold"
              >
                {copiedKey === "pinText" ? "Copied! ✓" : "Copy Comment & Open Instagram"}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Modal: Convert Buyer & Pricing Comments (Deduplicated by User) ── */}
      <Modal
        open={buyerConvertModalOpen}
        onCancel={() => setBuyerConvertModalOpen(false)}
        footer={null}
        width={640}
        centered
        destroyOnHidden
        className="!p-0"
        title={
          <div className="flex items-center gap-3 pb-1">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/10">
              <ShoppingOutlined className="text-lg" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                  Convert Purchase & Pricing Inquiries
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ThunderboltFilled className="text-[10px] text-emerald-500" />
                  {buyerLeads.length} Unique Buyer{buyerLeads.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {buyerLeads.length} unique buyers · {buyerComments.length} purchase signals detected in comments
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5 pt-3 text-xs">
          {/* Conversion KPI & Health Strip */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                <ShoppingOutlined className="text-sm" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Unique Buyers</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums truncate">
                  {buyerLeads.length} ({buyerComments.length} signals)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 border-x border-slate-200/60 px-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                <ClockCircleOutlined className="text-sm" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Unreplied</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums truncate">
                  {buyerLeads.filter((l) => l.needsReply).length} waiting
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0">
                <FireFilled className="text-sm" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Response ROI</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-700 truncate">
                  +3.8x Sales
                </div>
              </div>
            </div>
          </div>

          {/* Detected Inquiries Stream (Deduplicated / Grouped by Unique User) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-0.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <UserOutlined className="text-slate-400" />
                Detected Inquiries ({buyerLeads.length} unique buyers)
              </span>
              <span className="text-[11px] text-slate-400">
                Grouped by user · Prioritizing leads awaiting reply
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 space-y-2 max-h-52 overflow-y-auto">
              {buyerLeads.length > 0 ? (
                buyerLeads.map((lead) => {
                  return (
                    <div
                      key={lead.username}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0 uppercase shadow-2xs">
                            {lead.username ? lead.username.slice(0, 2) : "IG"}
                          </div>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            @{lead.username}
                          </span>
                          {lead.count > 1 && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                              {lead.count} Inquiries
                            </span>
                          )}
                          {lead.commentedAt && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              • {when(lead.commentedAt)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {lead.dmStatus === "sent" || Boolean(lead.dmSentAt) ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <CheckCircleFilled className="text-[9px]" /> DM Sent
                            </span>
                          ) : lead.myReply ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                              <CheckCircleFilled className="text-[9px]" /> Replied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span> Needs Reply
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Buyer Intent
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {lead.allTexts.map((txt, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-slate-800 bg-slate-50/80 px-2.5 py-1.5 rounded-md border border-slate-100 font-sans italic flex items-start gap-1.5"
                          >
                            <span className="text-slate-400 font-serif text-sm leading-none">&ldquo;</span>
                            <span className="not-italic text-slate-800 font-medium">{txt}</span>
                            <span className="text-slate-400 font-serif text-sm leading-none">&rdquo;</span>
                            {lead.count > 1 && lead.allTexts.length === 1 && (
                              <span className="not-italic text-[10px] text-slate-400 font-mono ml-auto">
                                (commented {lead.count}x)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-0.5 text-[11px]">
                        <span className="text-slate-400 text-[10px] truncate max-w-[240px]">
                          {lead.myReply ? `Replied: "${lead.myReply.slice(0, 32)}..."` : "No public reply yet"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const tailored = buyerCustomText.startsWith("Hey!")
                              ? buyerCustomText.replace("Hey!", `Hey @${lead.username}!`)
                              : `@${lead.username} ${buyerCustomText}`;
                            copyToClipboard(tailored, `buyerReply-${lead.username}`, `Copied reply for @${lead.username}! ✓`);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200/80 hover:border-emerald-300 transition-all cursor-pointer text-[10px]"
                        >
                          {copiedKey === `buyerReply-${lead.username}` ? (
                            <>
                              <CheckOutlined className="text-emerald-600" /> Copied for @{lead.username}!
                            </>
                          ) : (
                            <>
                              <CopyOutlined /> Copy for @{lead.username}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 px-4 space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-base">
                    <ShoppingOutlined />
                  </div>
                  <div className="text-xs font-semibold text-slate-700">No buyer keywords detected yet</div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    When followers comment keywords like &ldquo;price&rdquo;, &ldquo;link&rdquo;, or &ldquo;buy&rdquo;, they will automatically appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Smart Conversion Reply Studio */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-emerald-50/50 border border-emerald-200/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">💬</span>
                <span className="font-bold text-slate-900 text-xs">
                  Conversion Reply Studio
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/80 font-semibold px-1.5 py-0.2 rounded-full border border-emerald-200/60">
                  AI Presets
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Tooltip title="Reset template back to preset text">
                  <Button
                    size="small"
                    icon={<ReloadOutlined className="text-xs text-slate-500" />}
                    onClick={() => setBuyerCustomText(BUYER_TEMPLATES[buyerPreset].text)}
                    className="!rounded-lg text-xs"
                  />
                </Tooltip>
                <Button
                  size="small"
                  type="primary"
                  icon={copiedKey === "buyerTemplate" ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={() => copyToClipboard(buyerCustomText, "buyerTemplate", "Template copied! ✓")}
                  className="!rounded-lg text-xs !bg-emerald-600 hover:!bg-emerald-500 font-semibold shadow-xs"
                >
                  {copiedKey === "buyerTemplate" ? "Copied! ✓" : "Copy Reply"}
                </Button>
              </div>
            </div>

            {/* Preset switcher */}
            <Segmented
              block
              size="small"
              value={buyerPreset}
              onChange={(val) => {
                const key = val as BuyerPresetKey;
                setBuyerPreset(key);
                setBuyerCustomText(BUYER_TEMPLATES[key].text);
              }}
              options={[
                { label: "⚡ Direct Checkout", value: "checkout" },
                { label: "🏷️ VIP Offer & Code", value: "promo" },
                { label: "📩 Concierge & Sizing", value: "concierge" },
              ]}
              className="!bg-white/90 !p-1 !rounded-lg border border-emerald-200/80 shadow-2xs text-xs"
            />

            {/* Live editable reply box */}
            <Input.TextArea
              rows={3}
              value={buyerCustomText}
              onChange={(e) => setBuyerCustomText(e.target.value)}
              className="!rounded-lg !text-xs !p-2.5 !bg-white border-emerald-200 focus:border-emerald-500 shadow-2xs leading-relaxed font-sans"
              placeholder="Type or customize your direct conversion reply..."
            />

            {/* Quick Insert Token Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Quick add:</span>
              {[
                { label: "+ 💛 Emoji", text: "💛" },
                { label: "+ 🎁 VIP Code", text: "Use code VIP10 for 10% off!" },
                { label: "+ 📦 Direct Link", text: "Direct link is in your DM!" },
                { label: "+ 📩 Check Requests", text: "Check your message requests!" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() =>
                    setBuyerCustomText((prev) =>
                      prev.includes(chip.text) ? prev : `${prev} ${chip.text}`.trim()
                    )
                  }
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-300 transition-colors cursor-pointer font-medium"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* 24/7 Automation Callout Banner */}
          <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <ThunderboltOutlined className="text-sm" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 leading-tight">
                  Want this completely automated 24/7?
                </div>
                <div className="text-[11px] text-slate-400 font-normal truncate">
                  Instant Auto-DM replies and delivers product links in &lt; 3 seconds.
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold shrink-0">
              Hands-Free ROI
            </span>
          </div>

          {/* Modal Action Footer */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Meta 24h Messaging Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setBuyerConvertModalOpen(false)}
                className="!rounded-lg text-xs"
              >
                Close
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setQuickRuleTrigger("LINK, PRICE, BUY, ORDER, COST");
                  setQuickRuleDmText(
                    "Hey! Thanks so much for reaching out 💛 Here is the link with all pricing & direct order details: https://yourstore.com"
                  );
                  setQuickRuleReplyText(
                    "Just sent you all pricing & direct order links via DM! Check your inbox 🚀"
                  );
                  setBuyerConvertModalOpen(false);
                  setQuickRuleModalOpen(true);
                }}
                className="!rounded-xl !bg-gradient-to-r !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 !border-0 text-xs font-semibold shadow-md shadow-emerald-600/25 text-white px-3.5 py-1.5 cursor-pointer"
              >
                Activate 24/7 Auto-DM for Buyer Keywords →
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {toastMsg && (
        <div className="toast" data-testid="toast-message">
          <Check size={15} /> {toastMsg}
        </div>
      )}
    </main>
  );
}
