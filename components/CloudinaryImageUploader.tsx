"use client";

import React, { useState, useRef } from "react";
import { message } from "antd";

interface CloudinaryImageUploaderProps {
  label?: string;
  helperText?: string;
  value?: string | null;
  onChange: (url: string) => void;
  accentColor?: "emerald" | "amber" | "rose" | "indigo";
}

export function CloudinaryImageUploader({
  label = "Product Image",
  helperText,
  value,
  onChange,
  accentColor = "emerald",
}: CloudinaryImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("Uploading...");
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic theme styling based on accent color
  const theme = {
    emerald: {
      borderActive: "border-emerald-500 bg-emerald-500/5",
      btnPrimary: "bg-emerald-600 hover:bg-emerald-500 text-white",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      focusRing: "focus:border-emerald-500 focus:ring-emerald-500/15",
      iconText: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      borderActive: "border-amber-500 bg-amber-500/5",
      btnPrimary: "bg-amber-600 hover:bg-amber-500 text-white",
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      focusRing: "focus:border-amber-500 focus:ring-amber-500/15",
      iconText: "text-amber-600 dark:text-amber-400",
    },
    rose: {
      borderActive: "border-rose-500 bg-rose-500/5",
      btnPrimary: "bg-rose-600 hover:bg-rose-500 text-white",
      badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      focusRing: "focus:border-rose-500 focus:ring-rose-500/15",
      iconText: "text-rose-600 dark:text-rose-400",
    },
    indigo: {
      borderActive: "border-indigo-500 bg-indigo-500/5",
      btnPrimary: "bg-indigo-600 hover:bg-indigo-500 text-white",
      badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      focusRing: "focus:border-indigo-500 focus:ring-indigo-500/15",
      iconText: "text-indigo-600 dark:text-indigo-400",
    },
  }[accentColor];

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Please select a valid image file (JPG, PNG, WebP, GIF).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      message.error("Image file exceeds 15MB limit. Please upload a smaller image.");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Uploading to Cloudinary CDN...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. First attempt Next.js API route
      let res = await fetch("/api/integrations/cloudinary/upload", {
        method: "POST",
        body: formData,
      }).catch(() => null);

      // 2. If Next.js route fails, try backend directly
      if (!res || !res.ok) {
        setUploadProgress("Contacting media server...");
        res = await fetch("/backend-proxy/integrations/cloudinary/upload", {
          method: "POST",
          body: formData,
        }).catch(() => null);
      }

      if (!res || !res.ok) {
        const errorData = res ? await res.json().catch(() => ({})) : {};
        throw new Error(errorData?.message || "Failed to upload image to Cloudinary");
      }

      const data = await res.json();
      const uploadedUrl = data.url || data.secure_url;

      if (!uploadedUrl) {
        throw new Error("No URL returned from Cloudinary upload.");
      }

      onChange(uploadedUrl);
      message.success("Image uploaded to Cloudinary successfully!");
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      message.error(err?.message || "Cloudinary upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const isCloudinary = value && (value.includes("cloudinary.com") || value.includes("res.cloudinary"));

  return (
    <div className="space-y-2">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-[var(--viz-ink-2)]">{label}</label>
          <span className="inline-flex items-center gap-0.5 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
            Cloudinary
          </span>
        </div>

        {value ? (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${theme.badge}`}>
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {isCloudinary ? "Cloudinary Active" : "Image Set"}
            </span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[10px] text-[var(--viz-muted)] hover:text-[var(--viz-ink)] underline transition-colors"
            >
              {showUrlInput ? "Hide Link" : "View Link"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[10px] text-[var(--viz-muted)] hover:text-[var(--viz-ink)] underline transition-colors"
          >
            {showUrlInput ? "Upload image file instead" : "Or paste image link"}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload / Preview Area */}
      {value ? (
        /* Image Preview State */
        <div className="relative overflow-hidden rounded-2xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] p-2.5 transition-all">
          <div className="flex items-center gap-3">
            {/* Thumbnail Preview */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--viz-border)] bg-black/5 dark:bg-white/5 shadow-2xs group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Uploaded preview"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-medium"
                title="Open in new tab"
              >
                ↗ View
              </a>
            </div>

            {/* Info and Actions */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--viz-ink)] truncate">
                {isCloudinary ? "Hosted on Cloudinary CDN" : "Linked Image Asset"}
              </p>
              <p className="text-[11px] font-mono text-[var(--viz-muted)] truncate mt-0.5">
                {value}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium shadow-xs transition-all ${theme.btnPrimary} disabled:opacity-50`}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {isUploading ? "Uploading..." : "Replace Image"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setManualUrl("");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--viz-border)] bg-transparent px-2.5 py-1 text-[11px] font-medium text-[var(--viz-muted)] hover:text-red-600 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                  title="Remove image"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : isUploading ? (
        /* Uploading State */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-400/50 bg-sky-500/5 py-6 px-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 animate-spin mb-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeDasharray="30 60" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[var(--viz-ink)]">{uploadProgress}</p>
          <p className="text-[11px] text-[var(--viz-muted)] mt-0.5">Optimizing for Instagram Direct Messages...</p>
        </div>
      ) : (
        /* Dropzone / Upload Trigger */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
            isDragging
              ? theme.borderActive
              : "border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.015] hover:border-[var(--viz-ink-2)] hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform mb-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-[var(--viz-ink)]">
              <span className={theme.iconText}>Click to upload image</span> or drag & drop
            </p>
            <p className="text-[11px] text-[var(--viz-muted)]">
              PNG, JPG, WebP up to 15MB • Uploads straight to Cloudinary CDN
            </p>
          </div>
        </div>
      )}

      {/* Manual URL Input drawer (if user toggles or if they prefer pasting a URL) */}
      {showUrlInput && (
        <div className="rounded-xl border border-[var(--viz-border)] bg-black/[0.02] dark:bg-white/[0.02] p-2.5 space-y-1.5 animate-fadeIn">
          <label className="text-[10px] font-medium text-[var(--viz-muted)]">
            Direct Image URL (or paste external image link)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              value={manualUrl || value || ""}
              onChange={(e) => {
                setManualUrl(e.target.value);
                onChange(e.target.value);
              }}
              placeholder="https://assets.myntassets.com/... or https://res.cloudinary.com/..."
              className={`flex-1 rounded-lg border border-[var(--viz-border)] bg-white dark:bg-black/40 px-2.5 py-1.5 text-xs outline-none font-mono text-[11px] transition-all ${theme.focusRing}`}
            />
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setManualUrl("");
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--viz-border)] text-xs text-[var(--viz-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Clear URL"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-[10px] text-[var(--viz-muted)]">{helperText}</p>
      )}
    </div>
  );
}
