"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SafetyCertificateFilled,
  CheckCircleFilled,
  CloseOutlined,
  SettingOutlined,
  LockFilled,
} from "@ant-design/icons";

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  status: "accepted_all" | "customized" | "rejected_non_essential";
}

const STORAGE_KEY = "fabroniee_cookie_consent_v1";

export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
  }
}

export function getCookieConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCookieConsent(prefs: CookiePreferences) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    // Also store a standard cookie for 1 year
    const encoded = encodeURIComponent(JSON.stringify(prefs));
    document.cookie = `${STORAGE_KEY}=${encoded}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (err) {
    console.warn("Could not save cookie preferences:", err);
  }
}

export default function CookieConsent() {
  const [hasCheckedConsent, setHasCheckedConsent] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Toggle states inside preferences modal
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Initialize from storage on mount
  useEffect(() => {
    const stored = getCookieConsent();
    if (!stored) {
      // First visit: show banner
      setShowBanner(true);
    } else {
      setAnalyticsEnabled(stored.analytics);
      setMarketingEnabled(stored.marketing);
    }
    setHasCheckedConsent(true);

    // Listen for custom trigger to open preferences
    const handleOpen = () => {
      const current = getCookieConsent();
      if (current) {
        setAnalyticsEnabled(current.analytics);
        setMarketingEnabled(current.marketing);
      }
      setIsPreferencesOpen(true);
    };

    window.addEventListener("open-cookie-preferences", handleOpen);
    return () => {
      window.removeEventListener("open-cookie-preferences", handleOpen);
    };
  }, []);

  const handleAcceptAll = () => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      status: "accepted_all",
    };
    saveCookieConsent(prefs);
    setAnalyticsEnabled(true);
    setMarketingEnabled(true);
    setShowBanner(false);
    setIsPreferencesOpen(false);
    showNotice();
  };

  const handleRejectNonEssential = () => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      status: "rejected_non_essential",
    };
    saveCookieConsent(prefs);
    setAnalyticsEnabled(false);
    setMarketingEnabled(false);
    setShowBanner(false);
    setIsPreferencesOpen(false);
    showNotice();
  };

  const handleSaveCustom = () => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      timestamp: Date.now(),
      status: "customized",
    };
    saveCookieConsent(prefs);
    setShowBanner(false);
    setIsPreferencesOpen(false);
    showNotice();
  };

  const handleDismissBanner = () => {
    // If dismissed with X without explicit decision, persist essential-only so user is not repeatedly prompted
    const prefs: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      status: "rejected_non_essential",
    };
    saveCookieConsent(prefs);
    setShowBanner(false);
  };

  const showNotice = () => {
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
    }, 2500);
  };

  if (!hasCheckedConsent) return null;

  return (
    <>
      {/* ── 1. BOTTOM-RIGHT COMPACT PRIVACY & COOKIES BANNER ─────────────── */}
      {showBanner && !isPreferencesOpen && (
        <aside
          role="region"
          aria-label="Privacy and cookies banner"
          className="fixed bottom-4 right-4 max-w-[340px] w-[calc(100vw-32px)] rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 p-4 shadow-xl text-xs space-y-2.5 z-50 animate-page-entrance select-none"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800 text-[12px] tracking-tight">
                Privacy &amp; Cookies
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-1 rounded-md hover:bg-slate-100 transition-colors"
              aria-label="Dismiss banner"
            >
              <CloseOutlined className="text-[11px]" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
            We use essential cookies to maintain secure authentication and analyze performance.
          </p>

          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setIsPreferencesOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-[11px] font-semibold text-white shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
            >
              Accept
            </button>
          </div>
        </aside>
      )}

      {/* ── 2. REAL INTERACTIVE PREFERENCES MODAL ───────────────────────── */}
      {isPreferencesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-page-entrance"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1 pr-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                  <SettingOutlined className="text-xs" />
                  <span>Cookie Governance</span>
                </div>
                <h3 id="cookie-preferences-title" className="text-xl font-bold text-slate-900 tracking-tight pt-1">
                  Privacy &amp; Cookie Preferences
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose which cookies Fabroniee may store on your device. Essential cookies are strictly necessary for security and OAuth sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Close preferences"
              >
                <CloseOutlined className="text-sm" />
              </button>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-4">
              {/* Category 1: Essential Cookies (Locked) */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">
                      Strictly Necessary Cookies
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                      <LockFilled className="text-[9px]" /> Always Active
                    </span>
                  </div>
                  {/* Visual locked toggle */}
                  <div className="w-10 h-6 bg-slate-900 rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-90">
                    <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Required for core platform features including encrypted session storage, CSRF protection, and connecting Facebook Pages &amp; Instagram Business accounts via the official Meta Graph API v21.0.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Cookies: fabroniee_auth, csrf_token, fb_session
                </div>
              </div>

              {/* Category 2: Performance & Analytics (Toggleable) */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">
                      Performance &amp; Analytics
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Optional
                    </span>
                  </div>
                  {/* Interactive toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsEnabled}
                    onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                    className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
                      analyticsEnabled ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-xs transform transition-transform ${
                        analyticsEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Collects anonymous telemetry on page speeds, API roundtrip response times, and feature error rates so we can continuously optimize system reliability.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Cookies: _analytics_id, perf_latency
                </div>
              </div>

              {/* Category 3: Marketing & Conversion Funnels (Toggleable) */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">
                      Marketing &amp; Campaign Attribution
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Optional
                    </span>
                  </div>
                  {/* Interactive toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={marketingEnabled}
                    onClick={() => setMarketingEnabled(!marketingEnabled)}
                    className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
                      marketingEnabled ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-xs transform transition-transform ${
                        marketingEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Helps us evaluate marketing campaigns, referral partner attribution, and show relevant feature announcements.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Cookies: ref_source, campaign_tag
                </div>
              </div>
            </div>

            {/* Legal Notice Footer */}
            <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
              For complete transparency, please review our{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline font-semibold" onClick={() => setIsPreferencesOpen(false)}>
                Privacy Policy
              </Link>
              ,{" "}
              <Link href="/terms" className="text-blue-600 hover:underline font-semibold" onClick={() => setIsPreferencesOpen(false)}>
                Terms of Service
              </Link>
              , and{" "}
              <Link href="/data-deletion" className="text-blue-600 hover:underline font-semibold" onClick={() => setIsPreferencesOpen(false)}>
                Data Deletion Instructions
              </Link>
              .
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Reject Non-Essential
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-black bg-white border border-slate-300 hover:border-slate-400 transition-colors cursor-pointer shadow-2xs"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-black transition-colors cursor-pointer shadow-xs"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. TEMPORARY SAVED TOAST CONFIRMATION ───────────────────────── */}
      {savedNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-medium shadow-2xl animate-page-entrance"
        >
          <CheckCircleFilled className="text-emerald-400 text-sm" />
          <span>Cookie preferences saved</span>
        </div>
      )}
    </>
  );
}
