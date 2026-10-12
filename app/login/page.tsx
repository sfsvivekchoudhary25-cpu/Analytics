"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
import { auth, devBypassLogin, getApiBase, isLocalDev } from "@/lib/api";

// ── Inrō Brand Logo (Minimalist & Modern) ──────────────────────────────────────
function InroLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className} select-none`}>
      {/* Sleek Minimalist Brand Mark */}
      <div className="relative w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-xs border border-slate-800">
        <svg
          className="w-5 h-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Minimalist Inrō Japanese tiered lacquer seal & social threads */}
          <rect x="3.5" y="4" width="17" height="3.2" rx="1.6" fill="currentColor" fillOpacity="0.95" />
          <rect x="3.5" y="10.4" width="17" height="3.2" rx="1.6" fill="currentColor" fillOpacity="0.75" />
          <rect x="3.5" y="16.8" width="17" height="3.2" rx="1.6" fill="currentColor" fillOpacity="0.5" />
          <circle cx="16.5" cy="5.6" r="1.1" fill="#FF4757" />
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[22px] font-bold tracking-tight text-slate-900 font-sans">
          inrō
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full">
          Studio
        </span>
      </div>
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
  const [isLocal, setIsLocal] = useState(false);
  const [showReviewerDemo, setShowReviewerDemo] = useState(false);

  useEffect(() => {
    setIsLocal(isLocalDev());
  }, []);

  function handleDevBypass() {
    devBypassLogin();
    setSuccessMsg("Dev bypass token activated (@sfs.vivekchoudhary25). Redirecting to dashboard...");
    setTimeout(() => {
      router.replace("/");
    }, 300);
  }

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

    const demoParam = (q.get("demo") || q.get("reviewer") || q.get("test") || "").toLowerCase();
    if (demoParam === "1" || demoParam === "true" || demoParam === "yes") {
      setShowReviewerDemo(true);
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
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${apiBase}/instagram/oauth/url?origin=${encodeURIComponent(origin)}`);
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

  async function handleConnectFacebook() {
    setBusy(true);
    setError(null);
    try {
      const apiBase = getApiBase();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${apiBase}/facebook-page/oauth/url?origin=${encodeURIComponent(origin)}`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || "Failed to generate Facebook OAuth login URL. Check server configuration.");
      }
      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.message || "Could not reach the Facebook OAuth service. Please ensure the backend server is running.");
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
                        FB
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-white leading-tight">fabroniee</div>
                      <div className="text-[10px] text-white/50">Verified Creator</div>
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
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${activeSlide === idx
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
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50/50 relative overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-6 my-auto py-8 animate-page-entrance">
          {/* Header Row: Official InstaVeyra Logo & Meta Partner Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Fabroniee"
                className="w-9 h-9 object-contain rounded-xl shadow-xs"
              />
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                  Fabroniee
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Automation &amp; CRM
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-semibold text-blue-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/meta-logo.png"
                alt="Meta"
                className="h-3 w-auto object-contain shrink-0"
              />
              <span>Official Meta Partner</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
              Sign in to Fabroniee
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Connect your Facebook Page &amp; Instagram Business Account to unlock automated Comment-to-DM funnels and audience analytics.
            </p>
            <div className="pt-0.5">
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>✨ Explore Platform Features &amp; Live Simulator</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-3.5 pt-1">
            {/* 1. Official Meta: Log in with Facebook */}
            <button
              type="button"
              onClick={handleConnectFacebook}
              disabled={busy}
              className="group relative w-full h-[52px] px-4 sm:px-5 rounded-2xl text-white font-medium shadow-[0_4px_16px_-2px_rgba(24,119,242,0.35)] hover:shadow-[0_8px_24px_-2px_rgba(24,119,242,0.45)] hover:brightness-[1.03] active:scale-[0.99] transition-all duration-200 flex items-center justify-between cursor-pointer disabled:opacity-60 overflow-hidden bg-[#1877F2]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/12 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3 min-w-0">
                <div className="w-8.5 h-8.5 rounded-xl bg-white text-[#1877F2] flex items-center justify-center flex-shrink-0 shadow-2xs font-bold text-lg">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <span className="block font-semibold text-[15px] leading-tight text-white tracking-tight truncate">
                    Log in with Facebook
                  </span>
                  <span className="block text-[11px] text-white/85 font-normal leading-tight mt-0.5 truncate">
                    Connect Facebook Page &amp; Instagram Business
                  </span>
                </div>
              </div>

              <div className="relative z-10 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:translate-x-0.5 group-hover:bg-white/25 transition-all">
                {busy ? (
                  <LoadingOutlined className="text-sm text-white animate-spin" />
                ) : (
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>

            {/* Clear, Non-Overlapping Divider */}
            <div className="relative flex items-center justify-center py-2.5">
              <div className="w-full border-t border-slate-200" />
              <span className="bg-slate-50 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                or authenticate with instagram
              </span>
            </div>

            {/* 2. Secondary: Continue with Instagram */}
            <button
              type="button"
              onClick={handleConnectInstagram}
              disabled={busy}
              className="group relative w-full h-[48px] px-4 sm:px-5 rounded-2xl text-white font-medium shadow-[0_3px_12px_-2px_rgba(225,48,108,0.25)] hover:shadow-[0_6px_20px_-2px_rgba(225,48,108,0.35)] hover:brightness-[1.03] active:scale-[0.99] transition-all duration-200 flex items-center justify-between cursor-pointer disabled:opacity-60 overflow-hidden"
              style={{
                background:
                  "linear-gradient(115deg, #7928ca 0%, #d6249f 30%, #e1306c 60%, #fd1d1d 85%, #f77737 100%)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/12 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3 min-w-0">
                <div className="w-7.5 h-7.5 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 border border-white/25 shadow-xs">
                  <svg
                    className="w-4.5 h-4.5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" />
                    <circle cx="12" cy="12" r="4.2" />
                    <circle cx="17.6" cy="6.4" r="0.9" fill="currentColor" />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <span className="block font-semibold text-[14px] leading-tight text-white tracking-tight truncate">
                    Continue with Instagram
                  </span>
                </div>
              </div>

              <div className="relative z-10 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:translate-x-0.5 group-hover:bg-white/25 transition-all">
                {busy ? (
                  <LoadingOutlined className="text-xs text-white animate-spin" />
                ) : (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                )}
              </div>
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

            {/* 3. Reviewer Demo Access Mode (Only shown if URL has ?demo=1 or ?reviewer=1) */}
            {showReviewerDemo && (
              <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-blue-50/50 to-purple-50/70 p-3.5 space-y-2.5 shadow-2xs animate-page-entrance">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <ThunderboltFilled className="text-indigo-600 text-xs" />
                    <span>Meta App Reviewer Demo Mode</span>
                  </span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200/70">
                    Instant Access
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Evaluating without linked production assets? Launch pre-configured demo account to test the Comment-to-DM triggers, simulator, and analytics dashboard.
                </p>
                <button
                  type="button"
                  onClick={handleDevBypass}
                  className="flex w-full h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.99] text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <span>⚡ Launch Reviewer Demo Dashboard</span>
                </button>
              </div>
            )}

            {/* 4. Streamlined Official Meta Integration & Security Trust Badge */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/meta-logo.png"
                    alt="Meta"
                    className="h-4.5 w-auto object-contain shrink-0"
                  />
                  <span className="text-xs font-bold text-slate-800 tracking-tight">
                    Official Meta Graph API Integration
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[10px] font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  v21.0
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="truncate">Direct OAuth</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="truncate">Real-time DMs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="truncate">AES Encrypted</span>
                </div>
              </div>
            </div>

            {/* Explore Platform Link */}
            <div className="text-center pt-1">
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                <span>✨ Explore Platform &bull; Live Interactive Simulator</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Terms notice */}
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              By connecting your account, you agree to our{" "}
              <Link href="/terms" className="text-slate-600 hover:text-slate-900 underline underline-offset-2">
                Terms of Service
              </Link>
              ,{" "}
              <Link href="/privacy" className="text-slate-600 hover:text-slate-900 underline underline-offset-2">
                Privacy Policy
              </Link>
              , and{" "}
              <Link href="/data-deletion" className="text-slate-600 hover:text-slate-900 underline underline-offset-2">
                Data Deletion Instructions
              </Link>
              .
            </p>
          </div>
        </div>

        {/* ── Minimalist Privacy Notice ─── */}
        {showCookieBanner && (
          <div className="hidden sm:block absolute bottom-4 right-4 max-w-xs rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 p-3.5 shadow-lg text-xs space-y-2 z-50 animate-page-entrance">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-[11px]">Privacy &amp; Cookies</span>
              <button
                type="button"
                onClick={() => setShowCookieBanner(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              We use essential cookies to maintain secure authentication and analyze performance.
            </p>
            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setShowCookieBanner(false)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={() => setShowCookieBanner(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-medium text-white hover:bg-black cursor-pointer shadow-2xs"
              >
                Accept
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
