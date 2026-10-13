"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircleFilled,
  CloseOutlined,
  ExclamationCircleFilled,
  QuestionCircleOutlined,
  LogoutOutlined,
  LoadingOutlined,
  LinkOutlined,
  ArrowRightOutlined,
  ShopOutlined,
  UserOutlined,
  SafetyCertificateFilled,
} from "@ant-design/icons";
import { auth, getApiBase, isLocalDev } from "@/lib/api";

interface SocialStatus {
  facebookConnected: boolean;
  facebookPageName?: string;
  instagramConnected: boolean;
  instagramHandle?: string;
}

export default function OnboardingPage() {
  const router = useRouter();

  // Stepper State (Step 1 = Connect Socials, Step 2 = Profile Details)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Social Connection State
  const [status, setStatus] = useState<SocialStatus>({
    facebookConnected: false,
    instagramConnected: false,
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [busy, setBusy] = useState(false);

  // Modal States
  const [fbModalOpen, setFbModalOpen] = useState(false);
  const [igModalOpen, setIgModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [errorCode, setErrorCode] = useState<string>("AUTH_CODE_MISSING");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Step 2 profile fields
  const [creatorNiche, setCreatorNiche] = useState("E-Commerce & Retail");
  const [monthlyVolume, setMonthlyVolume] = useState("1,000 - 10,000 comments/mo");

  // Check auth and URL params on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = auth.get();
    if (!token && !isLocalDev()) {
      router.replace("/login");
      return;
    }

    const q = new URLSearchParams(window.location.search);
    const err = q.get("error");
    const connectedUser = q.get("connected");
    const fbPage = q.get("fbPageConnected");
    const authToken = q.get("auth_token");

    if (authToken) {
      auth.set(authToken);
    }

    if (err) {
      setErrorCode(q.get("error_code") || "AUTH_CODE_MISSING");
      setErrorMessage(decodeURIComponent(err));
      setErrorModalOpen(true);
      // Clean query params from URL
      window.history.replaceState(null, "", "/onboarding");
    }

    if (connectedUser || fbPage) {
      setStatus((prev) => ({
        ...prev,
        ...(connectedUser ? { instagramConnected: true, instagramHandle: connectedUser } : {}),
        ...(fbPage ? { facebookConnected: true, facebookPageName: fbPage } : {}),
      }));
      window.history.replaceState(null, "", "/onboarding");
    }

    fetchConnectionStatuses();
  }, [router]);

  // Fetch live connection statuses from backend
  async function fetchConnectionStatuses() {
    setLoadingStatus(true);
    try {
      const apiBase = getApiBase();
      const token = auth.get();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch Instagram Connection
      const igRes = await fetch(`${apiBase}/instagram/connection`, { headers });
      const igData = igRes.ok ? await igRes.json() : null;

      // 2. Fetch Facebook Page Connection
      const fbRes = await fetch(`${apiBase}/facebook-page`, { headers });
      const fbData = fbRes.ok ? await fbRes.json() : null;

      setStatus((prev) => ({
        ...prev,
        instagramConnected: Boolean(igData?.connected),
        instagramHandle: igData?.username || prev.instagramHandle,
        facebookConnected: Boolean(fbData?.connected),
        facebookPageName: fbData?.pageName || prev.facebookPageName,
      }));
    } catch (err) {
      console.warn("Could not load social connection statuses:", err);
    } finally {
      setLoadingStatus(false);
    }
  }

  // Handle Facebook Login redirect
  async function handleProceedFacebookOAuth() {
    setBusy(true);
    setFbModalOpen(false);
    try {
      const apiBase = getApiBase();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${apiBase}/facebook-page/oauth/url?origin=${encodeURIComponent(origin)}`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || "Failed to generate Facebook OAuth login URL.");
      }
      window.location.href = data.url;
    } catch (err: any) {
      setBusy(false);
      setErrorCode("OAUTH_REQUEST_FAILED");
      setErrorMessage(err?.message || "Could not reach the Facebook OAuth service.");
      setErrorModalOpen(true);
    }
  }

  // Handle Instagram Login redirect
  async function handleProceedInstagramOAuth() {
    setBusy(true);
    setIgModalOpen(false);
    try {
      const apiBase = getApiBase();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${apiBase}/instagram/oauth/url?origin=${encodeURIComponent(origin)}`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        // Fallback to Facebook page OAuth which connects Instagram business account automatically
        return handleProceedFacebookOAuth();
      }
      window.location.href = data.url;
    } catch (err: any) {
      setBusy(false);
      setErrorCode("INSTAGRAM_OAUTH_FAILED");
      setErrorMessage(err?.message || "Could not reach the Instagram OAuth service.");
      setErrorModalOpen(true);
    }
  }

  function handleSignOut() {
    auth.clear();
    router.replace("/login");
  }

  async function handleFinishOnboarding() {
    setBusy(true);
    try {
      const apiBase = getApiBase();
      const token = auth.get();
      if (token) {
        await fetch(`${apiBase}/auth/onboarding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            creatorNiche,
            monthlyVolume,
            facebookPageName: status.facebookPageName || null,
            instagramHandle: status.instagramHandle || null,
          }),
        });
      }
    } catch (err) {
      console.warn("Could not persist onboarding to db:", err);
    } finally {
      setBusy(false);
      router.push("/dashboard");
    }
  }

  const anyConnected = status.facebookConnected || status.instagramConnected;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans antialiased flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* ── TOP HEADER (Fabroniee Logo + Help + Sign Out) ────────────────── */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Fabroniee"
              className="w-8 h-8 object-contain rounded-lg shadow-2xs group-hover:opacity-90 transition-opacity"
            />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Fabroniee
            </span>
          </Link>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setHelpModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <QuestionCircleOutlined className="text-xs text-blue-600" />
              <span>How Fabroniee Works</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              title="Sign out of account"
            >
              <LogoutOutlined className="text-xs" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ONBOARDING WORKSPACE ──────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-xl mx-auto space-y-8 animate-page-entrance">
          {/* Title & Subtitle */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              Setup your creator profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Connect your social media accounts so brands can view your content, audience, and campaign suitability.
            </p>
          </div>

          {/* ── STEPPER: ( 1 ) ──────── ( 2 ) ───────────────────────────── */}
          <div className="flex items-center justify-center max-w-xs mx-auto">
            <div className="flex items-center w-full">
              {/* Step 1 Pill */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                  currentStep === 1
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {status.facebookConnected || status.instagramConnected ? "✓" : "1"}
              </div>

              {/* Connecting Bar */}
              <div
                className={`flex-1 h-0.5 mx-3 transition-colors ${
                  currentStep === 2 || anyConnected ? "bg-blue-600" : "bg-slate-200"
                }`}
              />

              {/* Step 2 Pill */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                  currentStep === 2
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* ── STEP 1: CONNECT SOCIAL MEDIA ACCOUNTS (Exact Replica of Image 3) ── */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-9 space-y-7">
              {/* Card Header */}
              <div className="text-center space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Connect Your Social Media Accounts
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Link your creator profiles to complete your Fabroniee setup.
                </p>
              </div>

              {/* List of 4 Social Platforms */}
              <div className="space-y-3 pt-1">
                {/* 1. Facebook */}
                <div
                  className={`w-full rounded-2xl border transition-all p-3.5 sm:p-4 flex items-center justify-between ${
                    status.facebookConnected
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-2xs bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Facebook Icon */}
                    <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>

                    <div className="text-left min-w-0">
                      <span className="block font-semibold text-xs sm:text-sm text-slate-800 leading-tight">
                        {status.facebookConnected ? "Facebook Page Connected" : "Connect Facebook"}
                      </span>
                      {status.facebookPageName && (
                        <span className="block text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                          Page: {status.facebookPageName}
                        </span>
                      )}
                    </div>
                  </div>

                  {status.facebookConnected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      <CheckCircleFilled className="text-emerald-600 text-xs" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFbModalOpen(true)}
                      disabled={busy}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* 2. Instagram */}
                <div
                  className={`w-full rounded-2xl border transition-all p-3.5 sm:p-4 flex items-center justify-between ${
                    status.instagramConnected
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-2xs bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Instagram Icon */}
                    <div
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                      style={{
                        background:
                          "linear-gradient(115deg, #7928ca 0%, #d6249f 30%, #e1306c 60%, #fd1d1d 85%, #f77737 100%)",
                      }}
                    >
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
                      <span className="block font-semibold text-xs sm:text-sm text-slate-800 leading-tight">
                        {status.instagramConnected ? "Instagram Connected" : "Connect Instagram"}
                      </span>
                      {status.instagramHandle && (
                        <span className="block text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                          @{status.instagramHandle}
                        </span>
                      )}
                    </div>
                  </div>

                  {status.instagramConnected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      <CheckCircleFilled className="text-emerald-600 text-xs" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIgModalOpen(true)}
                      disabled={busy}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full h-12 rounded-2xl text-white font-semibold text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer bg-[#5046e5] hover:bg-[#4338ca]"
                >
                  Continue setup
                </button>

                <div>
                  <button
                    type="button"
                    onClick={handleFinishOnboarding}
                    disabled={busy}
                    className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    Skip connection for now &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: CREATOR DETAILS & FINALIZE ────────────────────────── */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-9 space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Creator Profile &amp; Preferences
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select your primary content niche to optimize comment-to-DM funnels.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Primary Creator Category
                  </label>
                  <select
                    value={creatorNiche}
                    onChange={(e) => setCreatorNiche(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                    <option value="Fashion & Lifestyle">Fashion &amp; Lifestyle</option>
                    <option value="Creator / Influencer">Creator / Influencer</option>
                    <option value="Digital Products & Courses">Digital Products &amp; Courses</option>
                    <option value="Agency / Brand Management">Agency / Brand Management</option>
                    <option value="Entertainment & Media">Entertainment &amp; Media</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Estimated Monthly Comments &amp; DMs
                  </label>
                  <select
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="Under 1,000 / month">Under 1,000 / month</option>
                    <option value="1,000 - 10,000 comments/mo">1,000 - 10,000 comments/mo</option>
                    <option value="10,000 - 50,000 comments/mo">10,000 - 50,000 comments/mo</option>
                    <option value="50,000+ comments/mo (Enterprise)">50,000+ comments/mo (Enterprise)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  &larr; Back to Accounts
                </button>
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {busy ? <LoadingOutlined className="animate-spin" /> : null}
                  <span>Finish &amp; Launch Dashboard &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL 1: FACEBOOK CONFIRMATION MODAL (Exact Replica of Image 2) ── */}
      {fbModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-page-entrance"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9 shadow-2xl space-y-6 text-center">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setFbModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <CloseOutlined className="text-base" />
            </button>

            {/* Circular Facebook Logo Icon */}
            <div className="mx-auto w-14 h-14 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>

            {/* Card Content with Border */}
            <div className="rounded-2xl border border-slate-200/90 p-5 sm:p-6 text-center space-y-3 bg-white">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                You&apos;ll be redirected to Facebook to authorize the connection.
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This authorization allows us to access high-level analytics that help showcase the success of your campaigns when working with brands. We do not access, manage, or control your content.
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed px-2">
              Having trouble connecting your Facebook? Just open Facebook in a new tab in the same browser and give it another shot!
            </p>

            {/* Action Buttons: Cancel and Log In with Facebook */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFbModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedFacebookOAuth}
                disabled={busy}
                className="px-6 py-2.5 rounded-xl bg-[#4353ff] hover:bg-[#3442ea] text-xs font-semibold text-white shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center gap-2"
              >
                {busy && <LoadingOutlined className="text-xs" />}
                <span>Log In with Facebook</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: INSTAGRAM CONFIRMATION MODAL (Exact Replica of Image 4) ── */}
      {igModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-page-entrance"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9 shadow-2xl space-y-6 text-center">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIgModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <CloseOutlined className="text-base" />
            </button>

            {/* Combined Instagram & Facebook Linked Icons */}
            <div className="flex items-center justify-center gap-1.5">
              <div
                className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-md shrink-0"
                style={{
                  background:
                    "linear-gradient(115deg, #7928ca 0%, #d6249f 30%, #e1306c 60%, #fd1d1d 85%, #f77737 100%)",
                }}
              >
                <svg
                  className="w-6 h-6 text-white"
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

              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs shadow-2xs">
                <LinkOutlined />
              </div>

              <div className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md shrink-0">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
            </div>

            {/* Card Content with Border */}
            <div className="rounded-2xl border border-slate-200/90 p-5 sm:p-6 text-center space-y-3 bg-white">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                You&apos;ll be redirected to Facebook to authorize the connection.
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                To connect your Instagram, you&apos;ll need a <strong className="text-slate-800">Business or Creator account</strong> linked to a <strong className="text-slate-800">Facebook Page</strong> you manage.
                This authorization allows us to access high-level analytics that help showcase the success of your campaigns when working with brands. We do not access, manage, or control your content.
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed px-2">
              Having trouble connecting your Facebook? Just open Facebook in a new tab in the same browser and give it another shot!
            </p>

            {/* Action Buttons: Cancel and Log In with Facebook */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIgModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedInstagramOAuth}
                disabled={busy}
                className="px-6 py-2.5 rounded-xl bg-[#4353ff] hover:bg-[#3442ea] text-xs font-semibold text-white shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center gap-2"
              >
                {busy && <LoadingOutlined className="text-xs" />}
                <span>Log In with Facebook</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: AUTHORIZATION FAILED ERROR MODAL (Exact Replica of Image 5) ── */}
      {errorModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-page-entrance"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9 shadow-2xl space-y-6 text-center">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setErrorModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <CloseOutlined className="text-base" />
            </button>

            {/* Title & Subtitle */}
            <div className="space-y-1.5 pt-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Authorization Failed
              </h3>
              <p className="text-xs text-slate-500">
                We couldn&apos;t complete the authorization process. Please try again.
              </p>
            </div>

            {/* Visual Icon Chain: Fabroniee --- [x] --- Instagram */}
            <div className="flex items-center justify-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Fabroniee"
                className="w-10 h-10 object-contain rounded-xl shadow-xs"
              />
              <span className="text-slate-300 tracking-widest">&bull;&bull;&bull;</span>
              <div className="w-8 h-8 rounded-full border border-dashed border-rose-300 bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-xs">
                ✕
              </div>
              <span className="text-slate-300 tracking-widest">&bull;&bull;&bull;</span>
              <div
                className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-xs"
                style={{
                  background:
                    "linear-gradient(115deg, #7928ca 0%, #d6249f 30%, #e1306c 60%, #fd1d1d 85%, #f77737 100%)",
                }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.6" cy="6.4" r="0.9" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Gray Callout Box with Reasons */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 text-left space-y-2.5">
              <span className="font-bold text-xs text-slate-900 block">
                Possible reasons:
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>You may have closed the authorization popup before completing the process.</li>
                <li>There may have been a temporary issue with the authorization service. Please try again.</li>
                <li>Your browser may have blocked the authorization popup. Please check your browser settings and try again.</li>
              </ul>
            </div>

            {/* Error Code */}
            <div className="text-[11px] font-mono text-slate-400">
              Error Code: {errorCode}
            </div>

            {/* Try Again Button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setErrorModalOpen(false);
                  setFbModalOpen(true);
                }}
                className="px-8 py-2.5 rounded-xl bg-[#5046e5] hover:bg-[#4338ca] text-xs font-semibold text-white shadow-md active:scale-[0.99] transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ── MODAL 6: HOW FABRONIEE WORKS EXPLAINER ── */}
      {helpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-page-entrance"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9 shadow-2xl space-y-5 text-left">
            <button
              type="button"
              onClick={() => setHelpModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer transition-colors"
            >
              <CloseOutlined className="text-base" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold">
                <SafetyCertificateFilled className="text-blue-600" />
                <span>Meta Graph API v21.0 Certified</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 pt-1">
                How Fabroniee Connects Your Social Accounts
              </h3>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Fabroniee is built natively on official Meta Graph API endpoints. When you connect your Facebook Page or Instagram Business account:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-700 font-medium">
                <li>We receive temporary, scoped OAuth tokens that allow real-time comment reading and automated private DM dispatch.</li>
                <li>All access tokens are encrypted with AES-256 at rest and never shared.</li>
                <li>We do not control, modify, or publish posts to your account without explicit approval.</li>
                <li>You can disconnect any social media account at any time with a single click.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
