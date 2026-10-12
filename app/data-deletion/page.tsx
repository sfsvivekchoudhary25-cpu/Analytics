"use client";

import Link from "next/link";
import { ArrowLeftOutlined, DeleteOutlined, SafetyCertificateFilled, CheckCircleFilled } from "@ant-design/icons";

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeftOutlined className="text-xs transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Login</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              V
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">InstaVeyra</span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
            <SafetyCertificateFilled className="text-emerald-500 text-xs" />
            <span>Meta GDPR &amp; Platform Compliant</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-12 shadow-sm space-y-8">
          {/* Header Title */}
          <div className="space-y-3 border-b border-slate-100 pb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-200/50">
              <DeleteOutlined className="text-xs" />
              <span>User Rights &amp; Data Deletion Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              User Data Deletion Instructions
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Last Updated: October 12, 2026 &middot; InstaVeyra (Inrō Studio)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <p className="text-base text-slate-700 leading-normal">
              In accordance with Meta Platform Terms, GDPR, and global data privacy standards, <strong>InstaVeyra</strong>, accessible from{" "}
              <a href="https://fabroniee.store" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">
                https://fabroniee.store
              </a>{" "}
              and{" "}
              <a href="https://analytics-delta-sage.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">
                https://analytics-delta-sage.vercel.app
              </a>
              , provides multiple transparent and automated channels for users to permanently delete their account records, Meta OAuth tokens, and automation settings from our databases.
            </p>

            {/* Methods */}
            <div className="space-y-6">
              {/* Method 1 */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    1
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Method 1: Instant In-App Deletion (Recommended)
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  You can immediately wipe all your data directly inside your user dashboard:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    Log in to your InstaVeyra account at{" "}
                    <a href="https://analytics-delta-sage.vercel.app" className="text-blue-600 font-semibold underline">
                      https://analytics-delta-sage.vercel.app
                    </a>
                    .
                  </li>
                  <li>
                    Navigate directly to{" "}
                    <Link href="/account" className="text-blue-600 font-semibold underline">
                      Account Settings (/account)
                    </Link>{" "}
                    or click your profile avatar in the navigation bar.
                  </li>
                  <li>Scroll down to the <strong>Data &amp; Security / Danger Zone</strong> section.</li>
                  <li>Click the button labeled <strong>&ldquo;Delete Account &amp; Wipe Data&rdquo;</strong>.</li>
                  <li>Confirm the modal dialog. All stored Meta access tokens, linked Page tokens, and comment automation data will be deleted instantly and permanently.</li>
                </ol>
              </div>

              {/* Method 2 */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    2
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Method 2: Email Data Deletion Request
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  If you prefer to request manual deletion by our engineering team:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    Send an email to{" "}
                    <a href="mailto:support@fabroniee.store" className="text-blue-600 font-semibold underline">
                      support@fabroniee.store
                    </a>{" "}
                    with the subject line: <strong>&ldquo;Delete my data&rdquo;</strong>.
                  </li>
                  <li>Provide your connected Instagram username or Facebook Page Name in the email body.</li>
                  <li>Our data team will wipe your records and provide an email confirmation within 48 hours.</li>
                </ol>
              </div>

              {/* Method 3 */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    3
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Method 3: Revoke via Facebook App Settings (Automated Meta Callback)
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  You can also revoke our app&rsquo;s access directly through Meta:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>Log in to your Facebook profile and navigate to <strong>Settings &amp; Privacy &gt; Settings</strong>.</li>
                  <li>Go to <strong>Apps and Websites</strong> and find <strong>InstaVeyra</strong> (or Inrō Studio).</li>
                  <li>Click <strong>Remove</strong>. Meta will dispatch a secure, signed data deletion webhook to our server to automatically revoke access tokens and de-link your account.</li>
                </ol>
              </div>
            </div>

            {/* Scope of Deletion */}
            <section className="space-y-3 pt-4">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                What Data Is Permanently Deleted
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  "All Meta OAuth User & Page access tokens",
                  "Linked Facebook Page IDs & names",
                  "Instagram Business Account associations",
                  "All configured Comment-to-DM triggers & messages",
                  "All cached comment logging records & delivery history",
                  "Account credentials and profile cache",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/60 text-xs font-medium text-slate-700">
                    <CheckCircleFilled className="text-emerald-500 text-sm shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-slate-100 pt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            <Link href="/privacy" className="hover:text-slate-800">
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link href="/data-deletion" className="text-blue-600">
              Data Deletion Instructions
            </Link>
            <span>&middot;</span>
            <Link href="/terms" className="hover:text-slate-800">
              Terms of Service
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
