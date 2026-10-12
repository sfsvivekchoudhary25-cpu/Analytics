"use client";

import Link from "next/link";
import { ArrowLeftOutlined, FileTextOutlined, SafetyCertificateFilled } from "@ant-design/icons";

export default function TermsPage() {
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
            <span>Meta Platform Compliant</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-12 shadow-sm space-y-8">
          {/* Header Title */}
          <div className="space-y-3 border-b border-slate-100 pb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200/50">
              <FileTextOutlined className="text-xs" />
              <span>Commercial Terms &amp; Conditions</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Terms of Service
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Last Updated: October 12, 2026 &middot; InstaVeyra (Inrō Studio)
            </p>
          </div>

          {/* Body */}
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <p className="text-base text-slate-700 leading-normal">
              By accessing or using <strong>InstaVeyra</strong>, accessible from{" "}
              <a href="https://fabroniee.store" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">
                https://fabroniee.store
              </a>{" "}
              and{" "}
              <a href="https://analytics-delta-sage.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">
                https://analytics-delta-sage.vercel.app
              </a>
              , connecting your Facebook Page or Instagram Business Account, or creating automated messaging workflows, you agree to comply with and be bound by these Terms of Service.
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                1. Service Overview &amp; Permitted Use
              </h2>
              <p>
                InstaVeyra provides creator automation tools, specifically Comment-to-DM funnels, audience analytics, and direct messaging workflows via official Meta Graph APIs. You agree to use the service only for legitimate, non-spam business communication.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                2. Meta Platform Terms Compliance
              </h2>
              <p>
                As a user of our software, you agree to strictly follow:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Meta Community Standards and Platform Terms.</li>
                <li>Instagram Terms of Use and Messaging Policies.</li>
                <li>Applicable regional privacy and consumer protection laws.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                3. Prohibited Activities
              </h2>
              <p>
                You may not use InstaVeyra to dispatch unsolicited spam messages, harassment, fraudulent claims, deceptive phishing links, or copyrighted material you do not own rights to. We reserve the right to immediately terminate accounts engaging in abusive behavior.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                4. Account Termination &amp; Data Deletion
              </h2>
              <p>
                You may terminate your account and remove all stored access tokens at any time using the in-app &ldquo;Delete Account &amp; Wipe Data&rdquo; button or by contacting us. Upon termination, all tokens and automation rules are permanently deleted from our active database.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                5. Contact
              </h2>
              <p>
                For questions regarding these Terms, contact our legal and support team at{" "}
                <a href="mailto:support@fabroniee.store" className="text-blue-600 font-semibold underline">
                  support@fabroniee.store
                </a>
                .
              </p>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-slate-100 pt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            <Link href="/privacy" className="hover:text-slate-800">
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link href="/data-deletion" className="hover:text-slate-800">
              Data Deletion Instructions
            </Link>
            <span>&middot;</span>
            <Link href="/terms" className="text-blue-600">
              Terms of Service
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
