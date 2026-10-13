"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  EyeInvisibleOutlined,
  EyeOutlined,
  HeartFilled,
  LoadingOutlined,
  LockOutlined,
  MailOutlined,
  MessageOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltFilled,
  UserOutlined,
} from "@ant-design/icons";
import { auth, devBypassLogin, getApiBase, isLocalDev } from "@/lib/api";

// ── Carousel Showcase Slides ──────────────────────────────────────────────────
const CAROUSEL_SLIDES = [
  {
    id: "comments",
    title: "Comment Automation",
    subtitle: "Reply to every comment and capture leads from your posts in real-time.",
  },
  {
    id: "ai_agent",
    title: "AI Co-Pilot",
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

  // Mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Extra Fields
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot Password Fields
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);

  // Status
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLocal, setIsLocal] = useState(false);

  // Carousel
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setIsLocal(isLocalDev());
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Check for URL redirect parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const authToken = q.get("auth_token");
    const errorParam = q.get("error");
    const modeParam = q.get("mode");

    if (modeParam === "signup" || modeParam === "register") {
      setMode("signup");
    } else if (modeParam === "forgot") {
      setMode("forgot");
    }

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    if (authToken) {
      auth.set(authToken);
      router.replace("/onboarding");
      return;
    }

    // If user is already authenticated, allow navigation
    if (auth.get() && !q.get("logout") && !errorParam) {
      router.replace("/dashboard");
    }
  }, [router]);

  // ── 1. Sign In Handler ──────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setBusy(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }
      if (data.token) {
        auth.set(data.token);
      }
      setSuccessMsg("Signed in successfully! Loading your creator setup...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please verify your credentials.");
      setBusy(false);
    }
  }

  // ── 2. Sign Up Handler ──────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service & Privacy Policy.");
      return;
    }

    setBusy(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed.");
      }
      if (data.token) {
        auth.set(data.token);
      }
      setSuccessMsg("Account created! Redirecting to setup your social media accounts...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 600);
    } catch (err: any) {
      setError(err?.message || "Registration failed. An account with this email may already exist.");
      setBusy(false);
    }
  }

  // ── 3. Forgot Password - Request Code ───────────────────────────────────────
  async function handleSendResetCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to process password reset request.");
      }
      setSuccessMsg(data.message || "A reset code has been sent.");
      if (data.code) {
        setDevCodeHint(data.code);
        setResetCode(data.code);
      }
      setForgotStep(2);
    } catch (err: any) {
      setError(err?.message || "Could not send reset code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── 4. Forgot Password - Set New Password ───────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!resetCode.trim()) {
      setError("Please enter the reset code.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: resetCode.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update password.");
      }
      setSuccessMsg("Password updated successfully! You can now sign in.");
      setPassword(newPassword);
      setMode("signin");
      setForgotStep(1);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. Please check your code.");
    } finally {
      setBusy(false);
    }
  }

  const currentSlide = CAROUSEL_SLIDES[activeSlide];

  return (
    <main className="min-h-screen w-full flex bg-white font-sans antialiased text-slate-900 overflow-x-hidden">
      {/* ── LEFT HALF: BRAND SHOWCASE CAROUSEL (50% on desktop) ─────────────── */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-[#090b14] relative overflow-hidden flex-col justify-between p-8 sm:p-12 xl:p-16 text-white select-none shrink-0">
        {/* Dark Neon Atmospheric Glows */}
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

        {/* Top spacer */}
        <div className="relative z-10" />

        {/* ── CENTER FLOATING MOCKUP CARDS ───────────────────────────── */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-8">
          {/* SLIDE 1: COMMENT AUTOMATION */}
          {activeSlide === 0 && (
            <div className="relative w-full max-w-[360px] animate-page-entrance">
              <div className="rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-3.5 shadow-2xl space-y-3">
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

                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                    alt="Creator campaign"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />

                  <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5">
                    <span>I want to register for your next drop!</span>
                  </div>

                  <div className="absolute top-12 right-3 z-20 px-2.5 py-1 rounded-full bg-black/80 border border-white/20 text-white text-[10px] font-medium backdrop-blur-md flex items-center gap-1">
                    <ThunderboltFilled className="text-amber-400 text-xs" />
                    <span>Commented on your ad</span>
                  </div>

                  <div className="absolute bottom-2 inset-x-2 z-20 p-3 rounded-xl bg-blue-600 text-white shadow-xl space-y-2 text-xs">
                    <p className="leading-snug text-[11px] font-medium">
                      Fantastic! Here is the link to our upcoming drop! You can register as VIP and get notified first!
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

          {/* SLIDE 2: AI AGENT */}
          {activeSlide === 1 && (
            <div className="relative w-full max-w-[360px] animate-page-entrance">
              <div className="rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">&larr;</span>
                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                      JD
                    </div>
                    <span className="font-bold text-white">@jane.doe</span>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-white/10 text-white text-xs leading-relaxed">
                    I need help with my ecommerce shop, can we book a meeting?
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-3.5 py-2.5 bg-blue-600 text-white text-xs leading-relaxed shadow-lg">
                    No problem! You can book a consultation here!
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold">
                    <span className="flex items-center gap-1.5"><RobotOutlined /> Fabroniee AI Assistant</span>
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">Flash Drop Alert</div>
                  <div className="text-base font-bold leading-tight">
                    Reply DROP to get instant 25% OFF coupon in your DMs!
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
                    <span>Order #FAB-8821</span>
                    <span className="text-emerald-400 font-bold">$128.00 Paid</span>
                  </div>
                  <div className="text-[11px] text-white/80 leading-relaxed font-normal">
                    Lead converted from Instagram reel comment into checkout in 42 seconds.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/70 font-normal">Conversion Rate</span>
                  <span className="font-semibold text-emerald-400">+34.8% vs Bio Link</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM HEADLINE & SLIDER INDICATORS ────────────────────── */}
        <div className="relative z-10 space-y-5">
          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-2xl xl:text-3xl font-bold text-white tracking-tight leading-tight">
              {currentSlide.title}
            </h3>
            <p className="text-sm xl:text-base text-white/70 leading-relaxed">
              {currentSlide.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {CAROUSEL_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === idx ? "w-12 bg-white" : "w-5 bg-white/25 hover:bg-white/50"
                }`}
                aria-label={`Jump to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT HALF: REAL AUTHENTICATION WORKSPACE (50% on desktop) ────── */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50/50 relative overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-6 my-auto py-8 animate-page-entrance">
          {/* Back to Home Button & URL */}
          <div className="flex items-center justify-between pb-1">
            <Link
              href="/"
              id="back-to-home-btn"
              className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]"
            >
              <ArrowLeftOutlined className="text-[11px] transition-transform group-hover:-translate-x-1 text-slate-500 group-hover:text-slate-900" />
              <span>Back to Home</span>
            </Link>
            <span className="text-[11px] font-medium text-slate-400">
              fabroniee.store
            </span>
          </div>

          {/* Header Row: Official Fabroniee Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group" title="Return to Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Fabroniee"
                className="w-9 h-9 object-contain rounded-xl shadow-xs group-hover:opacity-90 transition-opacity"
              />
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight group-hover:text-black">
                  Fabroniee
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Automation &amp; CRM
                </span>
              </div>
            </Link>
          </div>

          {/* ── MODE TABS (Sign In / Sign Up) ─────────────────────────── */}
          {mode !== "forgot" && (
            <div className="grid grid-cols-2 p-1 bg-slate-200/60 rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-xl transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 leading-snug animate-page-entrance">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 leading-snug flex items-center gap-2 animate-page-entrance">
              <CheckCircleFilled className="text-emerald-600 text-sm shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              FORM 1: SIGN IN
             ══════════════════════════════════════════════════════════════ */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4 pt-1 animate-page-entrance">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  Sign in to Fabroniee
                </h1>
                <p className="text-xs text-slate-500">
                  Enter your email and password to access your creator dashboard.
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MailOutlined className="text-sm" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="creator@fabroniee.store"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setSuccessMsg(null);
                      setForgotStep(1);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LockOutlined className="text-sm" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember this browser</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full h-12 rounded-xl text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer bg-slate-900 hover:bg-black flex items-center justify-center gap-2"
              >
                {busy && <LoadingOutlined className="text-xs text-white animate-spin" />}
                <span>Sign In</span>
              </button>

              {/* Bottom Switch to Sign Up */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Don&apos;t have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Create account &rarr;
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════════
              FORM 2: SIGN UP
             ══════════════════════════════════════════════════════════════ */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4 pt-1 animate-page-entrance">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  Create your creator account
                </h1>
                <p className="text-xs text-slate-500">
                  Setup your profile to connect your Instagram &amp; Facebook pages.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Full Name / Creator Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserOutlined className="text-sm" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MailOutlined className="text-sm" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="alex@creator.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Create Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LockOutlined className="text-sm" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LockOutlined className="text-sm" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>

              {/* Terms agreement checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 leading-snug">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-slate-800 underline">
                    Terms of Service
                  </Link>
                  ,{" "}
                  <Link href="/privacy" target="_blank" className="text-slate-800 underline">
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link href="/data-deletion" target="_blank" className="text-slate-800 underline">
                    Data Deletion Instructions
                  </Link>
                  .
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full h-12 rounded-xl text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer bg-[#5046e5] hover:bg-[#4338ca] flex items-center justify-center gap-2"
              >
                {busy && <LoadingOutlined className="text-xs text-white animate-spin" />}
                <span>Create Account &amp; Continue &rarr;</span>
              </button>

              {/* Bottom Switch to Sign In */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Sign in &rarr;
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════════
              FORM 3: FORGOT PASSWORD
             ══════════════════════════════════════════════════════════════ */}
          {mode === "forgot" && (
            <div className="space-y-4 pt-1 animate-page-entrance">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  Reset your password
                </h1>
                <p className="text-xs text-slate-500">
                  {forgotStep === 1
                    ? "Enter your account email to receive a password reset verification code."
                    : "Enter the reset code sent to your email and choose a new password."}
                </p>
              </div>

              {devCodeHint && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
                  <span>Demo / Dev Reset Code: <strong>{devCodeHint}</strong></span>
                  <button
                    type="button"
                    onClick={() => setResetCode(devCodeHint)}
                    className="text-[11px] underline font-bold"
                  >
                    Autofill
                  </button>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleSendResetCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MailOutlined className="text-sm" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="you@creator.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-11 rounded-xl text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer bg-slate-900 hover:bg-black flex items-center justify-center gap-2"
                  >
                    {busy && <LoadingOutlined className="text-xs text-white animate-spin" />}
                    <span>Send Reset Code</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123456"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono tracking-widest text-center focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <LockOutlined className="text-sm" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-11 rounded-xl text-white font-semibold text-xs tracking-wide uppercase transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer bg-slate-900 hover:bg-black flex items-center justify-center gap-2"
                  >
                    {busy && <LoadingOutlined className="text-xs text-white animate-spin" />}
                    <span>Update Password &amp; Sign In</span>
                  </button>
                </form>
              )}

              {/* Back to sign in */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <ArrowLeftOutlined className="text-[10px]" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
