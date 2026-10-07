"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleFilled,
  CommentOutlined,
  HeartFilled,
  HeartOutlined,
  InstagramOutlined,
  LoadingOutlined,
  MessageOutlined,
  PictureOutlined,
  RobotOutlined,
  SendOutlined,
  ShareAltOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import { auth, getApiBase } from "@/lib/api";

// ── Inrō Multi-Color Brand Logo SVG (Exact Match to inro.social) ───────────────
function InroLogo({ className = "h-10" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className} select-none`}>
      <svg
        viewBox="0 0 160 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-auto"
      >
        {/* Block 1: 'i' and 'n' - Cyan (#00D2D3) and Yellow (#FFC312) */}
        <rect x="2" y="2" width="46" height="48" rx="8" fill="#00D2D3" />
        <rect x="2" y="25" width="46" height="25" rx="6" fill="#FFC312" />
        <circle cx="16" cy="14" r="5" fill="#FFFFFF" />
        <rect x="11" y="22" width="10" height="20" rx="3" fill="#FFFFFF" />
        <path
          d="M26 42V31C26 27.5 28.5 25.5 32 25.5C35.5 25.5 38 27.5 38 31V42"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Block 2: 'r' - Coral-Red (#FF4757) */}
        <rect x="54" y="2" width="46" height="48" rx="8" fill="#FF4757" />
        <rect x="65" y="16" width="10" height="26" rx="3" fill="#FFFFFF" />
        <path
          d="M75 25C77.5 20.5 82 18.5 88 19"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Block 3: 'ō' - Pink-Violet (#ED4C67) */}
        <rect x="106" y="2" width="46" height="48" rx="8" fill="#ED4C67" />
        <line
          x1="120"
          y1="10"
          x2="138"
          y2="10"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle
          cx="129"
          cy="28"
          r="11"
          stroke="#FFFFFF"
          strokeWidth="6"
        />
      </svg>
      <span className="text-2xl font-black tracking-tight text-slate-900 hidden sm:inline">
        inrō
      </span>
    </div>
  );
}

// ── Carousel Showcase Slides ──────────────────────────────────────────────────
const CAROUSEL_SLIDES = [
  {
    id: "comments",
    title: "Comment Automation",
    subtitle: "Reply to every comment and capture leads from your posts.",
  },
  {
    id: "ai_agent",
    title: "AI Agent",
    subtitle: "Leverage AI to engage with your audience in a human-like way and drive conversions.",
  },
  {
    id: "story_replies",
    title: "Story Automation",
    subtitle: "Convert 24h story views and emoji reactions into automated personalized chats.",
  },
  {
    id: "ugc",
    title: "Customer UGC Engine",
    subtitle: "Curate, approve, and auto-publish customer tagged photos to your feed.",
  },
  {
    id: "funnels",
    title: "Smart Conversion Funnels",
    subtitle: "Send unique discount links and trigger checkout flows without leaving Instagram.",
  },
];

export default function AuthPage() {
  const router = useRouter();

  // Status
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Carousel
  const [activeSlide, setActiveSlide] = useState(0);

  // Cookie banner
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Check for OAuth redirect return parameters (?auth_token, ?connected, ?error)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const authToken = q.get("auth_token");
    const connectedUser = q.get("connected");
    const fbPage = q.get("fbPageConnected");
    const errorParam = q.get("error");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    if (authToken) {
      auth.set(authToken);
      const name = connectedUser ? `@${connectedUser}` : fbPage ? `Page "${fbPage}"` : "your account";
      setSuccessMsg(`Successfully authenticated ${name}! Redirecting to dashboard...`);
      setTimeout(() => {
        router.replace("/");
      }, 500);
    }
  }, [router]);

  async function handleConnectInstagram() {
    setBusy(true);
    setError(null);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/instagram/oauth/url`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || "Failed to generate Instagram OAuth login URL. Check server configuration.");
      }
      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.message || "Could not reach the Instagram OAuth service. Please ensure the backend server is running.");
      setBusy(false);
    }
  }

  const currentSlide = CAROUSEL_SLIDES[activeSlide];

  return (
    <main className="min-h-screen w-full flex bg-white font-sans antialiased text-slate-900 overflow-x-hidden">
      {/* ── LEFT HALF: BRAND SHOWCASE CAROUSEL (50% on desktop, hidden on mobile/half-screen) ──────── */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-[#090b14] relative overflow-hidden flex-col justify-between p-8 sm:p-12 xl:p-16 text-white select-none shrink-0">
        {/* Atmospheric Dark Neon Glows */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d1b] via-[#100d28] to-[#060812] z-0" />
        <div className="absolute top-1/4 left-1/4 w-[420px] h-[420px] bg-purple-600/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-[360px] h-[360px] bg-blue-500/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] z-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top Branding Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Instagram Co-Pilot for DM Marketing</span>
          </div>
          <span className="text-xs text-white/50 font-medium hidden sm:inline">
            Meta Verified Partner API
          </span>
        </div>

        {/* ── CENTER FLOATING MOCKUP CARDS ───────────────────────────── */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-8">
          {/* SLIDE 1: COMMENT AUTOMATION (Exact Replica of Inrō) */}
          {activeSlide === 0 && (
            <div className="relative w-full max-w-[360px] animate-page-entrance">
              {/* Instagram Post Card */}
              <div className="rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-3.5 shadow-2xl space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold">
                        MP
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-white leading-tight">muted_poetry</div>
                      <div className="text-[10px] text-white/50">Sponsored</div>
                    </div>
                  </div>
                  <span className="text-white/40">&bull;&bull;&bull;</span>
                </div>

                {/* Creator Photo with Floating Comments */}
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                    alt="Creator campaign"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />

                  {/* Customer Comment Bubble */}
                  <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5">
                    <span>I want to register for your next drop!</span>
                    <span>🔥</span>
                  </div>

                  {/* Trigger Pill */}
                  <div className="absolute top-12 right-3 z-20 px-2.5 py-1 rounded-full bg-black/80 border border-white/20 text-white text-[10px] font-medium backdrop-blur-md flex items-center gap-1">
                    <ThunderboltFilled className="text-amber-400 text-xs" />
                    <span>Commented on your ad</span>
                  </div>

                  {/* Automated Blue DM Card */}
                  <div className="absolute bottom-2 inset-x-2 z-20 p-3 rounded-xl bg-blue-600 text-white shadow-xl space-y-2 text-xs">
                    <p className="leading-snug text-[11px] font-medium">
                      Fantastic! Here is the link to our upcoming drop! 🚀 You can register as VIP and get notified first!
                    </p>
                    <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[10px]">Shop the next drop</div>
                        <div className="text-[9px] text-white/80">Get exclusive access to VIP drop</div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-white text-blue-600 font-bold text-[10px]">
                        Register as VIP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Engagement Bar */}
                <div className="flex items-center justify-between pt-1 text-xs text-white/70">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><HeartFilled className="text-rose-500" /> 8,092</span>
                    <span className="flex items-center gap-1"><MessageOutlined /> 114</span>
                    <span className="flex items-center gap-1"><SendOutlined /> 340</span>
                  </div>
                  <span className="text-[10px] text-blue-400 font-bold cursor-pointer">Register now &gt;</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: AI AGENT (Instagram DM Thread) */}
          {activeSlide === 1 && (
            <div className="relative w-full max-w-[360px] animate-page-entrance">
              <div className="rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-4 shadow-2xl space-y-3">
                {/* DM Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">&larr;</span>
                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                      JD
                    </div>
                    <span className="font-bold text-white">@jane.doe</span>
                  </div>
                  <span className="text-white/40">📞 📹</span>
                </div>

                {/* Customer Question Bubble */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-white/10 text-white text-xs leading-relaxed">
                    I need help with my ecommerce shop, can we book a meeting?
                  </div>
                </div>

                {/* AI Automated Answer Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-3.5 py-2.5 bg-blue-600 text-white text-xs leading-relaxed shadow-lg">
                    No problem! You can book a consultation here! 🚀
                  </div>
                </div>

                {/* Meeting Card */}
                <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold">
                    <span className="flex items-center gap-1.5"><RobotOutlined /> Inrō AI Assistant</span>
                    <span className="text-white/50 text-[10px]">calendly.com</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">Get your free consultation</div>
                      <div className="text-[10px] text-white/50">Join a 30 min strategy session</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-blue-500 text-white font-bold text-[10px]">
                      Book meeting
                    </span>
                  </div>
                </div>

                {/* Bottom Input Pill */}
                <div className="pt-2 flex items-center gap-2 text-xs text-white/40 border-t border-white/10">
                  <div className="flex-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px]">
                    Message...
                  </div>
                  <span>🎙 📷 😃</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: STORY AUTOMATION */}
          {activeSlide === 2 && (
            <div className="relative w-full max-w-[360px] animate-page-entrance">
              <div className="rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-pink-500" />
                    <span>24h Story Automation</span>
                  </span>
                  <span className="text-[10px] font-bold text-pink-400">100% Native</span>
                </div>

                <div className="aspect-16/9 rounded-xl bg-gradient-to-tr from-purple-800 via-pink-700 to-rose-600 p-4 flex flex-col justify-between text-white shadow-inner">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">Flash Drop Alert 🔥</div>
                  <div className="text-base font-black leading-tight">
                    React with 🔥 to get instant 25% OFF coupon in your DMs!
                  </div>
                  <div className="text-[10px] text-white/70">512 followers reacted in last 2 hours</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircleFilled className="text-emerald-400 text-base shrink-0" />
                  <span className="leading-snug">
                    Automated private reply dispatched with custom discount code to every reactor.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: CUSTOMER UGC ENGINE */}
          {activeSlide === 3 && (
            <div className="relative w-full max-w-[360px] animate-page-entrance">
              <div className="rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                  <span className="font-bold text-white">Customer Tagged Photo</span>
                  <span className="text-emerald-400 font-bold text-[10px]">Verified UGC</span>
                </div>

                <div className="aspect-16/9 rounded-xl bg-slate-800 relative overflow-hidden flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"
                    alt="Customer photo"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2.5 inset-x-3 text-white text-xs font-bold">
                    @sarah_design tagged your brand
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/10">
                  <span className="text-white/70">Automatic UGC Workflow:</span>
                  <span className="font-bold text-emerald-400">Approved &bull; DM Sent</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 5: SMART CONVERSION FUNNELS */}
          {activeSlide === 4 && (
            <div className="relative w-full max-w-[360px] animate-page-entrance">
              <div className="rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                  <span className="font-bold text-white">Direct DM Checkout</span>
                  <span className="text-blue-400 font-bold text-[10px]">Zero Dropoff</span>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-600/20 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Order #INRO-4891</span>
                    <span className="text-emerald-400 font-extrabold">$128.00 Paid</span>
                  </div>
                  <div className="text-[11px] text-white/80 leading-relaxed">
                    Lead converted from Instagram reel comment into Stripe checkout in 42 seconds.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/70">Conversion Rate</span>
                  <span className="font-bold text-emerald-400">+34.8% vs Bio Link</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM HEADLINE & SLIDER INDICATORS ────────────────────── */}
        <div className="relative z-10 space-y-5">
          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {currentSlide.title}
            </h3>
            <p className="text-sm xl:text-base text-white/70 leading-relaxed">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* 5 Horizontal Progress Bars (Clickable) */}
          <div className="flex items-center gap-2 pt-1">
            {CAROUSEL_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === idx
                    ? "w-12 bg-white"
                    : "w-5 bg-white/25 hover:bg-white/50"
                }`}
                aria-label={`Jump to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT HALF: AUTHENTICATION FORM (50% on desktop) ─────────── */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-20 bg-white relative">
        <div className="w-full max-w-[420px] space-y-6">
          {/* Inrō Brand Logo */}
          <div>
            <InroLogo />
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Sign in with Instagram
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Connect your Instagram Professional or Creator account to access real-time analytics, automated DM flows, and audience insights.
            </p>
          </div>

          {/* Primary Action Card */}
          <div className="space-y-4 pt-1">
            <button
              type="button"
              onClick={handleConnectInstagram}
              disabled={busy}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] hover:opacity-95 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
            >
              {busy ? (
                <>
                  <LoadingOutlined className="text-xl" />
                  <span>Connecting to Instagram...</span>
                </>
              ) : (
                <>
                  <InstagramOutlined className="text-2xl" />
                  <div className="text-left">
                    <span className="block leading-tight font-extrabold text-sm sm:text-base">
                      Continue with Instagram
                    </span>
                    <span className="text-[11px] text-white/80 font-normal leading-none">
                      Professional or Creator Account
                    </span>
                  </div>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 leading-snug">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 leading-snug flex items-center gap-2">
                <CheckCircleFilled className="text-emerald-500 text-base flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Trust & Features card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Official Meta &amp; Instagram Integration
              </div>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircleFilled className="text-emerald-500 text-xs mt-0.5 flex-shrink-0" />
                  <span>Direct OAuth authentication via Meta Graph API</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleFilled className="text-emerald-500 text-xs mt-0.5 flex-shrink-0" />
                  <span>Instant access to posts, reels, comments &amp; audience data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleFilled className="text-emerald-500 text-xs mt-0.5 flex-shrink-0" />
                  <span>No password sharing needed — 100% secure token exchange</span>
                </li>
              </ul>
            </div>

            {/* Terms notice */}
            <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2">
              By connecting your account, you agree to our{" "}
              <a href="/legal/terms" className="underline hover:text-slate-600">
                terms of service
              </a>{" "}
              and{" "}
              <a href="/legal/privacy" className="underline hover:text-slate-600">
                privacy policy
              </a>
              .
            </p>
          </div>
        </div>

        {/* ── Cookie / Privacy Floating Pill (Identical to inro.social) ─── */}
        {showCookieBanner && (
          <div className="hidden sm:block absolute bottom-4 right-4 max-w-sm rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xl text-xs space-y-2.5 z-50 animate-page-entrance">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">We value your privacy</span>
              <button
                type="button"
                onClick={() => setShowCookieBanner(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              We use cookies to improve your experience and measure our marketing. You can manage your preferences below.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCookieBanner(false)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={() => setShowCookieBanner(false)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={() => setShowCookieBanner(false)}
                className="px-3 py-1 rounded-lg bg-blue-600 text-[11px] font-semibold text-white hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                Accept all
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
