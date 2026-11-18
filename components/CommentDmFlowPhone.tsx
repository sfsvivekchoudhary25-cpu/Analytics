"use client";

import { useEffect, useRef } from "react";
import {
  ShoppingBagIcon,
  MediaCardIcon,
  CameraIcon,
  MicrophoneIcon,
  PhoneIcon,
  VideoCameraIcon,
  UserIcon,
  CheckCircleIcon,
  HeartIcon,
  PhotoIcon,
} from "./icons";
import { MobilePreview, SupportedDevice } from "./MobilePreview";

export type FlowStep = "trigger" | "target" | "message" | "follow" | "reminder";
type Button = { type: "web_url" | "postback"; title: string; url?: string; payload?: string };

export const FLOW_STEP_LABEL: Record<FlowStep, string> = {
  trigger: "Step 1 · Comment trigger",
  target: "Step 2 · Target post",
  message: "Step 3 · Your message",
  follow: "Step 4 · Follow check",
  reminder: "Step 5 · Check-in reminder",
};

// ONE phone for the whole automation. It shows the whole conversation a commenter would get (their comment, the follow
// check if it is on, your message, the reminder if it is on) and scrolls to the part that matches the step being edited.
export function CommentDmFlowPhone({
  activeStep,
  device,
  onDeviceChange,
  height,
  ruleName,
  keywords,
  templateType,
  dmText,
  previewText,
  gatePreviewText,
  cardImageUrl,
  cardTitle,
  cardSubtitle,
  cardButtons,
  requireFollow,
  recoveryEnabled,
}: {
  activeStep: FlowStep;
  device: SupportedDevice;
  onDeviceChange: (d: SupportedDevice) => void;
  height: number;
  ruleName: string;
  keywords: string[];
  templateType: "text" | "button" | "product" | "file" | "card";
  dmText: string;
  previewText: string;
  gatePreviewText: string;
  cardImageUrl: string;
  cardTitle: string;
  cardSubtitle: string;
  cardButtons: Button[];
  requireFollow: boolean;
  recoveryEnabled: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const seg = activeStep === "trigger" || activeStep === "target" ? "comment" : activeStep;

  // Scroll the chat (not the page) to the part that belongs to the step being edited.
  useEffect(() => {
    const box = scrollRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-seg="${seg}"]`);
    if (!box || !el) return;
    box.scrollTo({ top: Math.max(0, el.offsetTop - 14), behavior: "smooth" });
  }, [seg, requireFollow, recoveryEnabled, templateType]);

  const hi = (name: string) =>
    `rounded-2xl transition-all duration-300 ${seg === name ? "bg-emerald-500/[0.08] ring-2 ring-emerald-500/40 p-1.5 -m-1.5" : ""}`;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-2.5 flex w-full max-w-[320px] items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--viz-ink)] tracking-tight">Instagram Direct</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-black/[0.05] p-0.5 dark:bg-white/10 text-[10px] font-medium">
          {(["iPhone 17", "Galaxy S25", "Pixel 10"] as SupportedDevice[]).map((dev) => (
            <button
              key={dev}
              type="button"
              onClick={() => onDeviceChange(dev)}
              className={`rounded-md px-2 py-0.5 transition-all cursor-pointer ${device === dev ? "bg-white font-semibold text-black shadow-xs dark:bg-[#202020] dark:text-white" : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"}`}
            >
              {dev.replace(" 17", "").replace(" S25", "").replace(" 10", "")}
            </button>
          ))}
        </div>
      </div>

      <MobilePreview width={Math.round(height * (320 / 650))} height={height} device={device} showToolbar={false}>
        <div className="flex h-full flex-col justify-between bg-[#f8f9fa] dark:bg-[#121212]">
          {/* Instagram Direct Header */}
                  <div className="flex items-center justify-between border-b border-black/10 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-[#181818] shrink-0 sticky top-0 z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl text-black dark:text-white font-normal leading-none select-none cursor-pointer">‹</span>
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#f9ed32] via-[#ee2a7b] to-[#002aff] p-[1.5px] shadow-xs">
                          <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center font-bold text-xs text-black dark:text-white">
                            {ruleName ? ruleName.charAt(0).toUpperCase() : "F"}
                          </div>
                        </div>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white dark:border-black bg-emerald-500" />
                      </div>
                      <div className="truncate min-w-0">
                        <p className="text-xs font-bold text-black dark:text-white truncate flex items-center gap-1 leading-tight">
                          <span>fabroniee</span>
                          <span className="text-[10px] text-[#0095f6]">✓</span>
                        </p>
                        <p className="text-[10px] text-black/50 dark:text-white/50 leading-tight">Active now</p>
                      </div>
                    </div>
  
                    {/* Header icons: Phone, Video */}
                    <div className="flex items-center gap-2 text-black/70 dark:text-white/70">
                      <span className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Audio Call">
                        <PhoneIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Video Call">
                        <VideoCameraIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

          {/* Whole conversation: scrolls to the part for the step being edited */}
          <div ref={scrollRef} className="relative flex-1 space-y-4 overflow-y-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Authentic Instagram Profile Info Banner */}
                    <div className="flex flex-col items-center justify-center pt-3 pb-2 text-center select-none border-b border-black/5 dark:border-white/5 mb-2">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#f9ed32] via-[#ee2a7b] to-[#002aff] p-[2px] shadow-sm mb-1.5">
                        <div className="h-full w-full rounded-full bg-white dark:bg-[#1a1a1a] flex items-center justify-center font-black text-lg text-black dark:text-white">
                          {ruleName ? ruleName.charAt(0).toUpperCase() : "F"}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-black dark:text-white flex items-center gap-1">
                        <span>fabroniee</span>
                        <span className="text-[10px] text-[#0095f6]">✓</span>
                      </p>
                      <p className="text-[9px] text-black/50 dark:text-white/50 mt-0.5">
                        Instagram · 14.8K followers · 82 posts
                      </p>
                      <p className="text-[9px] text-black/40 dark:text-white/40 mt-0.5">
                        You follow each other on Instagram
                      </p>
                      <div className="mt-2 inline-block rounded-md bg-black/5 dark:bg-white/10 px-3 py-1 text-[10px] font-semibold text-black dark:text-white">
                        View Profile
                      </div>
                    </div>

            <div className="flex justify-center my-1.5">
              <span className="text-[9px] font-medium text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full">Today 9:41 AM</span>
            </div>

            {/* 1 · The comment that starts it (steps 1 and 2) */}
            <div data-seg="comment" className={hi("comment")}>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-xs bg-black/[0.06] dark:bg-white/[0.08] px-3 py-2 shadow-2xs border border-black/5 dark:border-white/5">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--viz-muted)]">User commented on post</p>
                  <p className="mt-0.5 text-xs font-semibold text-black dark:text-white">&quot;{keywords.length > 0 ? keywords[0] : "Nice"}&quot;</p>
                </div>
              </div>
            </div>

            {/* 2 · Follow check (step 4), only when it is switched on */}
            {requireFollow && (
              <div data-seg="follow" className={hi("follow")}>
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[88%] space-y-2.5 rounded-2xl rounded-tr-xs bg-[#0095f6] p-3 text-white shadow-sm">
                      <p className="whitespace-pre-line text-xs font-normal leading-relaxed">{gatePreviewText}</p>
                      <div className="space-y-1.5 border-t border-white/20 pt-1">
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-white/40 bg-white/15 px-3 py-1.5 text-center text-xs font-semibold text-white">
                          <UserIcon className="h-3.5 w-3.5" />
                          <span>Visit Profile</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-white/40 bg-white/15 px-3 py-1.5 text-center text-xs font-semibold text-white">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          <span>I&apos;m following</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-2xl rounded-tl-xs border border-black/5 bg-black/[0.07] px-3.5 py-2.5 shadow-2xs dark:border-white/5 dark:bg-white/[0.09]">
                      <p className="text-xs leading-relaxed text-black dark:text-white">Done, I&apos;m following you now :)</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span>✓</span> Follow verified
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3 · Your message (step 3) */}
            <div data-seg="message" className={hi("message")}>
              {/* Outgoing automated response strictly adhering to templateType */}
                    <div className="flex justify-end">
                      {templateType === "product" ? (
                        /* Product Card */
                        <div className="max-w-[94%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                          {cardImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cardImageUrl} alt="Product preview" className="aspect-[1.91/1] w-full object-cover" />
                          ) : (
                            <div className="flex aspect-[1.91/1] w-full flex-col items-center justify-center bg-black/5 dark:bg-white/5 p-2 text-center">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-[var(--viz-ink)] shadow-2xs">
                                <ShoppingBagIcon className="h-5 w-5" />
                              </span>
                              <span className="text-xs font-bold text-black dark:text-white mt-1.5">Product Showcase</span>
                              <span className="text-[9px] text-[var(--viz-muted)]">Image URL preview</span>
                            </div>
                          )}
                          <div className="p-3 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-black dark:text-white truncate">
                                {cardTitle || "Featured Product"}
                              </p>
                              {cardSubtitle && (
                                <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                                  {cardSubtitle}
                                </span>
                              )}
                            </div>
                            {dmText && (
                              <p className="text-xs text-black/75 dark:text-white/75 leading-tight whitespace-pre-line pt-1 border-t border-black/5 dark:border-white/5">
                                {previewText}
                              </p>
                            )}
                          </div>
                          {cardButtons.length > 0 && (
                            <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
                              {cardButtons.map((btn, idx) => (
                                <div
                                  key={idx}
                                  className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                  {btn.title || "Shop Now"}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : templateType === "file" ? (
                        /* Downloadable File / Lead Magnet Card */
                        <div className="max-w-[94%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                          {cardImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cardImageUrl} alt="Resource cover" className="aspect-[1.91/1] w-full object-cover" />
                          ) : (
                            <div className="flex aspect-[1.91/1] w-full items-center gap-3 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-orange-500/10 p-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white font-black text-xs shadow-sm">
                                PDF
                              </div>
                              <div className="min-w-0">
                                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                                  Instant Resource
                                </span>
                                <p className="text-xs font-bold text-black dark:text-white truncate mt-0.5">
                                  {cardTitle || "Free Resource Guide"}
                                </p>
                                <p className="text-[10px] text-[var(--viz-muted)] truncate">
                                  {cardSubtitle || "Direct PDF Download"}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="p-3 space-y-1">
                            <p className="text-xs font-bold text-black dark:text-white">
                              {cardTitle || "Free Resource Guide"}
                            </p>
                            <p className="text-[10px] text-black/60 dark:text-white/60">
                              {cardSubtitle || "Instant PDF Download"}
                            </p>
                            {dmText && (
                              <p className="text-xs text-black/75 dark:text-white/75 leading-tight whitespace-pre-line pt-1 border-t border-black/5 dark:border-white/5">
                                {previewText}
                              </p>
                            )}
                          </div>
                          {cardButtons.length > 0 && (
                            <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
                              {cardButtons.map((btn, idx) => (
                                <div
                                  key={idx}
                                  className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                  {btn.title || "Download PDF"}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : templateType === "card" ? (
                        /* Custom Media Card */
                        <div className="max-w-[94%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                          {cardImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cardImageUrl} alt="Card preview" className="aspect-[1.91/1] w-full object-cover" />
                          ) : (
                            <div className="flex aspect-[1.91/1] w-full flex-col items-center justify-center bg-black/5 dark:bg-white/5 p-2 text-center">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-[var(--viz-ink)] shadow-2xs">
                                <MediaCardIcon className="h-5 w-5" />
                              </span>
                              <span className="text-xs font-bold text-black dark:text-white mt-1.5">Header Image</span>
                              <span className="text-[9px] text-[var(--viz-muted)]">Image URL preview</span>
                            </div>
                          )}
                          <div className="p-3 space-y-1">
                            {cardTitle && (
                              <p className="text-xs font-bold text-black dark:text-white leading-tight">
                                {cardTitle.replaceAll("{username}", "there")}
                              </p>
                            )}
                            {cardSubtitle && (
                              <p className="text-[10px] text-black/60 dark:text-white/60 leading-tight">
                                {cardSubtitle.replaceAll("{username}", "there")}
                              </p>
                            )}
                            {dmText && (
                              <p className="text-xs text-black/80 dark:text-white/80 pt-1 leading-tight whitespace-pre-line border-t border-black/5 dark:border-white/5">
                                {previewText}
                              </p>
                            )}
                          </div>
                          {cardButtons.length > 0 && (
                            <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
                              {cardButtons.map((btn, idx) => (
                                <div
                                  key={idx}
                                  className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                  {btn.title || "Button"}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : templateType === "button" ? (
                        /* Text + Buttons: Official Instagram Direct button template */
                        <div className="max-w-[90%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                          <div className="p-3">
                            <p className="text-xs leading-relaxed text-black dark:text-white whitespace-pre-line">
                              {previewText}
                            </p>
                          </div>
                          {cardButtons.length > 0 ? (
                            <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
                              {cardButtons.map((btn, idx) => (
                                <div
                                  key={idx}
                                  className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                  {btn.title || `Button #${idx + 1}`}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border-t border-black/10 dark:border-white/10 p-2 text-center text-[10px] text-[var(--viz-muted)] italic">
                              No buttons added
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Simple Text Bubble: Clean Instagram Direct message */
                        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#0095f6] px-3.5 py-2.5 text-white shadow-sm">
                          <p className="text-xs leading-relaxed whitespace-pre-line">{previewText}</p>
                        </div>
                      )}
                    </div>
  
                    <div className="flex justify-end pr-1">
                      <span className="text-[9px] text-black/40 dark:text-white/40">Sent • Just now</span>
                    </div>
            </div>

            {/* 4 · Check-in reminder (step 5), only when it is switched on */}
            {recoveryEnabled && (
              <div data-seg="reminder" className={hi("reminder")}>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[9px] font-medium text-black/40 dark:bg-white/[0.06] dark:text-white/40">About 20 hours later</span>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[90%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                      <div className="p-3">
                        <p className="text-xs leading-relaxed text-black dark:text-white">Hey there! 👋 Just wanted to check in quickly before our chat window closes — did you get a chance to check out what I sent earlier?</p>
                      </div>
                      <div className="divide-y divide-black/10 border-t border-black/10 dark:divide-white/10 dark:border-white/10">
                        <div className="py-2.5 text-center text-xs font-bold text-[#0095f6]">Need help 💬</div>
                        <div className="py-2.5 text-center text-xs font-bold text-[#0095f6]">Still interested 👍</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="h-24" />
          </div>

          {/* Instagram Direct bottom chat bar */}
                  <div className="border-t border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#181818] flex items-center gap-2 shrink-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0095f6] text-white cursor-pointer shadow-xs">
                      <CameraIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 rounded-full bg-black/5 dark:bg-white/10 px-3.5 py-1.5 flex items-center justify-between">
                      <span className="text-xs text-black/40 dark:text-white/40">Message...</span>
                      <div className="flex items-center gap-2 text-black/60 dark:text-white/60">
                        <span className="cursor-pointer hover:text-black dark:hover:text-white transition-colors" title="Voice memo">
                          <MicrophoneIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="cursor-pointer hover:text-black dark:hover:text-white transition-colors" title="Gallery image">
                          <PhotoIcon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                    <span className="text-red-500 cursor-pointer hover:scale-110 transition-transform p-0.5" title="Like">
                      <HeartIcon className="h-4 w-4 fill-red-500 text-red-500" />
                    </span>
                  </div>
        </div>
      </MobilePreview>
      <p className="mt-2 text-center text-[10px] text-[var(--viz-muted)]">
        Showing <span className="font-medium text-[var(--viz-ink-2)]">{FLOW_STEP_LABEL[activeStep]}</span>
      </p>
    </div>
  );
}
