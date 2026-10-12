"use client";

import Link from "next/link";
import { ArrowLeftOutlined, SafetyCertificateFilled, SafetyCertificateOutlined } from "@ant-design/icons";

export default function PrivacyPolicyPage() {
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
            <span>Meta API v21.0 Compliant</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-12 shadow-sm space-y-8">
          {/* Header Title */}
          <div className="space-y-3 border-b border-slate-100 pb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200/50">
              <SafetyCertificateOutlined className="text-xs" />
              <span>Official Regulatory &amp; App Review Compliance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Last Updated: October 12, 2026 &middot; InstaVeyra (Inrō Studio)
            </p>
          </div>

          {/* Policy Body */}
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <p className="text-base text-slate-700 leading-normal">
              At <strong>InstaVeyra</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), accessible from{" "}
              <a href="https://fabroniee.store" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">
                https://fabroniee.store
              </a>{" "}
              and{" "}
              <a href="https://analytics-delta-sage.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">
                https://analytics-delta-sage.vercel.app
              </a>
              , we take your privacy and the security of your Meta accounts seriously. This Privacy Policy document outlines the categories of data we collect and process when you integrate your Facebook Page and Instagram Professional Account with our platform, and how that information is utilized solely to deliver our Comment-to-DM automation software.
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                1. Information We Collect via Meta APIs
              </h2>
              <p>
                When you connect your Facebook Page and Instagram Professional Account to our service using Meta Login, we request and collect only the exact permissions needed to execute our automation workflows:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Basic Profile Information:</strong> Name, email address, profile picture URL, and Instagram username to establish your account dashboard.
                </li>
                <li>
                  <strong>Meta Page &amp; Instagram Identifiers:</strong> App-Scoped User IDs (ASIDs), Facebook Page IDs, and Instagram Business Account IDs required to link your assets.
                </li>
                <li>
                  <strong>Interaction &amp; Comment Data:</strong> Incoming Instagram comment text strings and unique comment IDs intercepted in real-time via Meta webhooks, solely to evaluate whether the comment matches a user-defined keyword trigger.
                </li>
                <li>
                  <strong>Encrypted Access Tokens:</strong> Meta OAuth Page and User access tokens, which are encrypted at rest using AES-256-GCM encryption.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                2. How We Use Your Information
              </h2>
              <p>
                We use the collected information exclusively to power your automated creator workflows:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  To monitor incoming comments on your linked Instagram posts for specific keywords you configure (e.g., &ldquo;LINK&rdquo; or &ldquo;INFO&rdquo;).
                </li>
                <li>
                  To automatically dispatch a single direct message (DM) response containing the exact URL, resource, or downloadable file you specified directly to the commenter.
                </li>
                <li>
                  To display performance statistics in your dashboard (e.g., total comments matched, DMs sent, and link conversion rates).
                </li>
                <li>
                  <strong>Zero Snooping:</strong> We do not read, store, or monitor your personal private messaging history.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                3. Data Storage, Retention &amp; De-duplication
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>No Selling or Sharing:</strong> We do not sell, rent, or trade your personal data or messaging histories to third parties or advertisers under any circumstances.
                </li>
                <li>
                  <strong>Ephemeral Processing:</strong> Comment payloads received via webhooks are processed instantly. We cache <code>comment_id</code> identifiers in our database solely to prevent sending duplicate automated messages to the same user or comment.
                </li>
                <li>
                  <strong>Security:</strong> All network traffic is encrypted via TLS 1.3 / HTTPS. Access tokens are stored encrypted and can be revoked at any time.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                4. Data Deletion and Revocation
              </h2>
              <p>
                Users can disconnect their Meta accounts or completely delete their profile data from our platform at any time:
              </p>
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 space-y-2">
                <span className="font-semibold text-slate-900">Instant In-App Deletion:</span>
                <p className="text-xs text-slate-600">
                  Navigate to your{" "}
                  <Link href="/account" className="text-blue-600 font-semibold underline">
                    Account Settings (/account)
                  </Link>{" "}
                  panel and click <strong>&ldquo;Delete Account &amp; Wipe Data&rdquo;</strong>. Upon execution, all stored Meta access tokens, linked Page records, and cached comment logs are immediately and permanently wiped from our active databases.
                </p>
              </div>
              <p>
                For complete step-by-step guidance, please review our dedicated{" "}
                <Link href="/data-deletion" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                  Data Deletion Instructions
                </Link>
                .
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                5. Contact Information
              </h2>
              <p>
                If you have any questions or concerns regarding our privacy policies or data handling, please contact our Data Protection Team at{" "}
                <a href="mailto:support@fabroniee.store" className="text-blue-600 hover:text-blue-700 font-semibold">
                  support@fabroniee.store
                </a>
                .
              </p>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-slate-100 pt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            <Link href="/privacy" className="text-blue-600">
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link href="/data-deletion" className="hover:text-slate-800">
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
