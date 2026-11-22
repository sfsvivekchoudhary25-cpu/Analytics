"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";

export type LegalPageId = "privacy" | "terms" | "data-deletion";
export type LegalSection = { id: string; title: string; body: ReactNode };

const PAGES: { id: LegalPageId; label: string; href: string }[] = [
  { id: "privacy", label: "Privacy Policy", href: "/privacy" },
  { id: "terms", label: "Terms of Service", href: "/terms" },
  { id: "data-deletion", label: "Data deletion", href: "/data-deletion" },
];

export const LEGAL_UPDATED = "November 18, 2026";
export const LEGAL_EMAIL = "support@fabroniee.store";

// ── small building blocks for the page text ─────────────────────────────────────────────────────────────────────
export function LegalP({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-slate-600">{children}</p>;
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-7 text-slate-600">
          <span aria-hidden className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalSteps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3.5 text-[15px] leading-7 text-slate-600">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">{i + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function LegalNote({ title, children, tone = "periwinkle" }: { title?: string; children: ReactNode; tone?: "periwinkle" | "butter" | "rose" }) {
  const bg = tone === "butter" ? "#FFF9DB" : tone === "rose" ? "#FCEEF4" : "#E2E2FC";
  return (
    <div style={{ backgroundColor: bg }} className="rounded-[22px] p-5 shadow-2xs">
      {title && <p className="text-sm font-semibold text-slate-950">{title}</p>}
      <div className={`${title ? "mt-1.5" : ""} text-[14px] leading-7 text-slate-700`}>{children}</div>
    </div>
  );
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:|^mailto:/.test(href);
  return external ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950">
      {children}
    </a>
  ) : (
    <Link href={href} className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-950">
      {children}
    </Link>
  );
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────
export function LegalLayout({
  page,
  eyebrow,
  title,
  intro,
  highlights,
  sections,
}: {
  page: LegalPageId;
  eyebrow: string;
  title: string;
  intro: ReactNode;
  highlights: { title: string; text: string }[];
  sections: LegalSection[];
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  // Highlight the section being read.
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  const idx = PAGES.findIndex((p) => p.id === page);
  const others = PAGES.filter((p) => p.id !== page);

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-800 antialiased">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[#e9e9ee] bg-[#fbfbfa]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-xs font-semibold text-white">F</span>
            <span className="text-sm font-semibold tracking-tight text-slate-950">Fabroniee</span>
          </Link>
          <nav aria-label="Legal pages" className="flex items-center gap-1 overflow-x-auto rounded-full border border-[#e9e9ee] bg-white p-1 shadow-2xs">
            {PAGES.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                aria-current={p.id === page ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  p.id === page ? "bg-black text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="hidden items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 sm:inline-flex">
            <ArrowLeftOutlined className="text-[10px]" />
            Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        {/* Title */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-black/80 bg-white px-3 py-1 text-xs font-medium text-slate-950 shadow-2xs">{eyebrow}</span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{intro}</p>
          <p className="mt-4 text-xs font-medium text-slate-500">Last updated {LEGAL_UPDATED}</p>
        </div>

        {/* In short */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => (
            <div
              key={h.title}
              style={{ backgroundColor: ["#E2E2FC", "#FFF9DB", "#FCEEF4", "#FEECE4"][i % 4] }}
              className="rounded-[24px] p-5 shadow-xs"
            >
              <p className="text-sm font-semibold text-slate-950">{h.title}</p>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-700">{h.text}</p>
            </div>
          ))}
        </div>

        {/* Body: contents on the left, text on the right */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="hidden text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block">On this page</p>
            <ol className="-mx-1 flex gap-1 overflow-x-auto pb-2 lg:mx-0 lg:mt-3 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
              {sections.map((s, i) => (
                <li key={s.id} className="shrink-0">
                  <a
                    href={`#${s.id}`}
                    className={`block whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition-colors lg:whitespace-normal lg:rounded-none lg:border-l-2 lg:px-3 lg:py-1.5 ${
                      active === s.id
                        ? "bg-black font-medium text-white lg:border-black lg:bg-transparent lg:text-slate-950"
                        : "bg-white text-slate-500 hover:text-slate-950 lg:border-[#e9e9ee] lg:bg-transparent"
                    }`}
                  >
                    <span className="mr-1.5 tabular-nums opacity-60">{i + 1}.</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="min-w-0 max-w-3xl">
            <div className="space-y-12">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                    <span className="text-sm font-medium tabular-nums text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </h2>
                  <div className="mt-4 space-y-4">{s.body}</div>
                </section>
              ))}
            </div>

            {/* Contact + other pages */}
            <div className="mt-16 rounded-[26px] border border-[#e9e9ee] bg-white p-6 shadow-2xs sm:p-8">
              <p className="text-base font-semibold text-slate-950">Questions?</p>
              <p className="mt-1.5 text-[15px] leading-7 text-slate-600">
                Write to us at <LegalLink href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</LegalLink> and a person will answer.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {others.map((p) => (
                  <Link
                    key={p.id}
                    href={p.href}
                    className="inline-flex items-center rounded-full border border-[#e9e9ee] bg-white px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:border-black/40"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
              <p className="mt-5 text-[11px] text-slate-400">
                Fabroniee · page {idx + 1} of {PAGES.length}
              </p>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
