"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { App, Button, Card, Modal, Progress, Segmented, Skeleton, Space, Tag, Tooltip } from "antd";
import {
  CameraOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  CloseOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  FireOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  InstagramOutlined,
  MobileOutlined,
  MutedOutlined,
  PauseCircleOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  UploadOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { api, API_BASE } from "@/lib/api";
import { MobilePreview, SupportedDevice } from "./MobilePreview";

export type Story = {
  id: string;
  kind: "image" | "video";
  file: string;
  status: "publishing" | "published" | "failed";
  error: string | null;
  mediaId?: string | null;
  createdAt: string;
};

type Props = {
  username?: string;
  ownAvatar?: string | null;
};

export function Stories({ username = "fabroniee", ownAvatar }: Props) {
  const { message, modal } = App.useApp();

  const [items, setItems] = useState<Story[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [isDragging, setIsDragging] = useState(false);

  // Phone preview states
  const [previewDevice, setPreviewDevice] = useState<SupportedDevice>("iPhone 17");
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen viewer modal
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [guidelinesModalOpen, setGuidelinesModalOpen] = useState(false);

  const cleanUser = username.replace(/^@/, "");

  // Load stories
  const loadStories = async () => {
    try {
      const data = await api<Story[]>("/stories");
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load stories");
    }
  };

  useEffect(() => {
    loadStories();
  }, [tick]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Handle file selection
  const handleFileChosen = (chosenFile: File | null) => {
    if (!chosenFile) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"];
    if (!validTypes.includes(chosenFile.type) && !chosenFile.type.startsWith("image/") && !chosenFile.type.startsWith("video/")) {
      message.error("Please upload an image (JPG, PNG, WebP) or video (MP4, MOV).");
      return;
    }

    if (chosenFile.size > 100 * 1024 * 1024) {
      message.error("File size must be under 100MB.");
      return;
    }

    setFile(chosenFile);
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(URL.createObjectURL(chosenFile));
    setIsVideoPlaying(true);
    message.success(`Loaded "${chosenFile.name}" into Story Studio`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleFileChosen(f);
  };

  // Drag and Drop
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
    const droppedFile = e.dataTransfer.files?.[0] ?? null;
    handleFileChosen(droppedFile);
  };

  // Quick Demo Asset for instant testing
  const handleLoadSampleMedia = async () => {
    try {
      // Create a stylish gradient canvas demo story asset
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, "#833ab4");
        grad.addColorStop(0.5, "#fd1d1d");
        grad.addColorStop(1, "#fcb045");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        // Card container
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.roundRect(140, 600, 800, 720, 48);
        ctx.fill();

        // Text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 64px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚡ FLASH SALE", 540, 780);

        ctx.font = "bold 110px Arial, sans-serif";
        ctx.fillText("25% OFF", 540, 930);

        ctx.font = "38px Arial, sans-serif";
        ctx.fillText("Comment 'DEAL' on our latest post", 540, 1060);
        ctx.fillText("to get an instant DM discount code!", 540, 1130);

        // Brand tag
        ctx.font = "bold 34px Arial, sans-serif";
        ctx.fillText(`@${cleanUser}`, 540, 1240);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], `sample-story-${cleanUser}.jpg`, { type: "image/jpeg" });
          handleFileChosen(sampleFile);
        }
      }, "image/jpeg", 0.95);
    } catch {
      message.error("Failed to generate sample asset");
    }
  };

  const handleClearSelected = () => {
    setFile(null);
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Post to Story
  const handlePostStory = () => {
    if (!file) return;

    modal.confirm({
      title: "Publish Story to Instagram?",
      content: (
        <div className="space-y-2 text-xs text-slate-500 pt-2">
          <p>
            This story will be published directly to <strong>@{cleanUser}</strong> on Instagram and will remain visible to your followers for 24 hours.
          </p>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700">
            File: {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        </div>
      ),
      okText: "Publish Now",
      cancelText: "Cancel",
      okButtonProps: {
        className: "!bg-gradient-to-r !from-purple-600 !via-pink-600 !to-rose-500 font-semibold !rounded-xl !border-0",
      },
      cancelButtonProps: {
        className: "!rounded-xl",
      },
      onOk: async () => {
        setBusy(true);
        setError(null);
        try {
          const fd = new FormData();
          fd.append("media", file);
          const s = await api<Story>("/stories", { method: "POST", body: fd });
          if (s.status === "failed") {
            setError(s.error ?? "Instagram rejected the story.");
            message.error(s.error ?? "Story publish failed");
          } else {
            message.success("Story successfully published to Instagram feed!");
            handleClearSelected();
          }
          setTick((n) => n + 1);
        } catch (err: any) {
          const errMsg = err?.message || "Failed to publish story";
          setError(errMsg);
          message.error(errMsg);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  // Video play/pause toggle
  const togglePlayVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleMuteVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsVideoMuted(videoRef.current.muted);
  };

  // Filtered stories
  const filteredStories = useMemo(() => {
    if (!items) return [];
    if (filter === "published") return items.filter((s) => s.status === "published");
    if (filter === "publishing") return items.filter((s) => s.status === "publishing");
    if (filter === "failed") return items.filter((s) => s.status === "failed");
    return items;
  }, [items, filter]);

  const stats = useMemo(() => {
    const total = items?.length ?? 0;
    const published = items?.filter((s) => s.status === "published").length ?? 0;
    const publishing = items?.filter((s) => s.status === "publishing").length ?? 0;
    const failed = items?.filter((s) => s.status === "failed").length ?? 0;
    return { total, published, publishing, failed };
  }, [items]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* ── TOP BANNER & COCKPIT ───────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white text-xl shadow-md shadow-pink-500/20">
              <InstagramOutlined />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  Instagram Stories Studio
                </h1>
                <Tag color="purple" className="!rounded-full font-semibold !text-[11px] !border-0 bg-purple-50 text-purple-700">
                  Meta Graph API v26.0
                </Tag>
                <Tag color="green" className="!rounded-full font-semibold !text-[11px] !border-0 bg-emerald-50 text-emerald-700">
                  24h Ephemeral Feed
                </Tag>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Create and publish full-screen vertical stories to your followers in real-time. Photos are automatically adapted to 9:16 portrait ratio with high-resolution background blur.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              icon={<InfoCircleOutlined />}
              onClick={() => setGuidelinesModalOpen(true)}
              className="!rounded-xl font-semibold text-xs !border-slate-200"
            >
              Story Guidelines
            </Button>
            <Button
              icon={<ReloadOutlined className={busy ? "animate-spin" : ""} />}
              onClick={() => {
                setTick((n) => n + 1);
                message.info("Refreshing stories feed...");
              }}
              className="!rounded-xl font-semibold text-xs !border-slate-200 hover:!border-slate-300"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* ── METRICS STRIP (4 Symmetrical Cards) ────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Published Stories</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{stats.published}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Live to followers</div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">
              <CheckCircleFilled />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">In Progress / Queue</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">{stats.publishing}</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Meta processing</div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base">
              <ClockCircleOutlined />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Aspect Ratio</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">9:16 Portrait</div>
              <div className="text-[10px] text-purple-600 font-semibold mt-0.5">AI Background Blur</div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base">
              <MobileOutlined />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Video Capability</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">Up to 60s</div>
              <div className="text-[10px] text-rose-600 font-semibold mt-0.5">H.264 &bull; AAC Audio</div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base">
              <VideoCameraOutlined />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN STUDIO: COMPOSER (LEFT) + LIVE PHONE MOCKUP (RIGHT) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Creator & Upload Controls (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600 text-sm">
                  <CameraOutlined />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-none">
                    Upload & Compose Story
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Drag and drop your creative asset or pick from your computer.
                  </p>
                </div>
              </div>
              <Button
                type="text"
                size="small"
                icon={<FireOutlined className="text-amber-500" />}
                onClick={handleLoadSampleMedia}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold bg-slate-50 hover:bg-slate-100 !rounded-lg"
              >
                Load Sample Story
              </Button>
            </div>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/quicktime"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Drag & Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-purple-500 bg-purple-50/50 scale-[0.99]"
                  : file
                  ? "border-emerald-300 bg-emerald-50/20"
                  : "border-slate-200 hover:border-purple-300 hover:bg-slate-50/60"
              }`}
            >
              {file ? (
                <div className="flex items-center justify-between gap-4 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl shrink-0">
                      {file.type.startsWith("video/") ? <VideoCameraOutlined /> : <PictureOutlined />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatFileSize(file.size)}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{file.type.split("/")[0]}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-600 font-semibold">Ready to Publish</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="!rounded-lg text-xs font-semibold !border-slate-200"
                    >
                      Change
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearSelected();
                      }}
                      className="!rounded-lg text-xs font-semibold"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-100 to-pink-100 text-purple-600 text-2xl shadow-xs">
                    <CloudUploadOutlined />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Drop your photo or video here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      or click to browse from device (JPG, PNG, WebP, MP4, MOV)
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Max 100MB
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Ideal 9:16 (1080×1920)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Video &lt;60s
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Publishing Engine Checklist */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2 text-xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                Instagram Stories Optimization Engine
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleFilled className="text-emerald-500 mt-0.5 text-xs shrink-0" />
                <span className="text-slate-600 leading-snug">
                  <strong>Automatic 9:16 Canvas Adaptation:</strong> Landscape & square images are intelligently centered over a high-resolution blurred background copy.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleFilled className="text-emerald-500 mt-0.5 text-xs shrink-0" />
                <span className="text-slate-600 leading-snug">
                  <strong>Direct Meta Graph API Ingest:</strong> Instant publication without third-party scheduling delay.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleFilled className="text-emerald-500 mt-0.5 text-xs shrink-0" />
                <span className="text-slate-600 leading-snug">
                  <strong>Zero Follower Interruption:</strong> Live stories appear in the top ring of all active followers.
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs text-rose-700 flex items-start gap-2">
                <CloseCircleFilled className="mt-0.5 text-rose-500 shrink-0" />
                <div>
                  <strong>Publishing Failed:</strong> {error}
                </div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <Button
              type="primary"
              size="large"
              icon={<InstagramOutlined className="text-base" />}
              onClick={handlePostStory}
              disabled={!file || busy}
              loading={busy}
              className={`flex-1 !h-12 !rounded-2xl font-bold text-sm shadow-md transition-all duration-200 ${
                !file || busy
                  ? "!bg-slate-100 !text-slate-400 !border-slate-200 !cursor-not-allowed"
                  : "!bg-gradient-to-r !from-purple-600 !via-pink-600 !to-rose-500 hover:!opacity-95 text-white shadow-pink-500/25 !border-0"
              }`}
            >
              {busy
                ? file?.type.startsWith("video/")
                  ? "Uploading video to Instagram (can take up to a minute)..."
                  : "Publishing to Instagram Story..."
                : "Publish to Story Now"}
            </Button>
            {file && (
              <Button
                size="large"
                onClick={handleClearSelected}
                className="!h-12 !rounded-2xl font-semibold text-xs !border-slate-200"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Live Instagram Phone Mockup (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MobileOutlined className="text-purple-600" />
              <span>Live Instagram Follower Preview</span>
            </div>

            {/* Hardware Device Switcher matching app standard */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 text-[10px] font-medium">
                {(["iPhone 17", "Galaxy S25", "Pixel 10"] as SupportedDevice[]).map((dev) => (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => setPreviewDevice(dev)}
                    className={`rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                      previewDevice === dev
                        ? "bg-white font-semibold text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {dev.replace(" 17", "").replace(" S25", "").replace(" 10", "")}
                  </button>
                ))}
              </div>
              <Tag color="purple" className="!rounded-full font-semibold !text-[10px] !m-0">
                {previewDevice}
              </Tag>
            </div>
          </div>

          {/* Proper Hardware Device Frame using react-mockframe via MobilePreview */}
          <MobilePreview
            width={300}
            device={previewDevice}
            showToolbar={false}
            theme="dark"
            fullBleed={true}
            className="drop-shadow-2xl"
          >
            {/* Inner Story Canvas */}
            <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col justify-between select-none">
              {/* Media Display Area */}
              {preview && file ? (
                file.type.startsWith("video/") ? (
                  <div className="absolute inset-0 z-0 bg-black flex items-center justify-center" onClick={togglePlayVideo}>
                    <video
                      ref={videoRef}
                      src={preview}
                      autoPlay
                      loop
                      muted={isVideoMuted}
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {!isVideoPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <PlayCircleOutlined className="text-white text-5xl opacity-80" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 z-0 bg-black">
                    {/* Blurred backdrop simulation */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Story Backdrop"
                      className="absolute inset-0 w-full h-full object-cover blur-xl opacity-60 scale-110"
                    />
                    {/* Centered foreground image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Story Preview"
                      className="relative z-10 w-full h-full object-contain"
                    />
                  </div>
                )
              ) : (
                /* Ambient Empty Story Placeholder */
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-6 text-center text-white/80">
                  <div className="relative mb-4">
                    <div className="h-20 w-20 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 animate-spin-slow">
                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl">
                        <CameraOutlined />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Live Follower Preview
                  </h4>
                  <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed">
                    Select a photo or video to preview your 9:16 full-screen Instagram story before publishing.
                  </p>
                  <Button
                    size="small"
                    type="primary"
                    onClick={handleLoadSampleMedia}
                    className="mt-4 !rounded-xl !bg-white/15 hover:!bg-white/25 !border-0 text-white font-semibold text-xs"
                  >
                    Try Sample Asset
                  </Button>
                </div>
              )}

              {/* Instagram Story Top Overlay Bar */}
              <div className="relative z-20 p-3 pt-12 space-y-2 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
                {/* Segmented Story Progress Bar */}
                <div className="flex items-center gap-1 w-full">
                  <div className="h-0.5 flex-1 rounded-full bg-white/90 overflow-hidden">
                    <div className="h-full w-full bg-white animate-pulse"></div>
                  </div>
                  <div className="h-0.5 flex-1 rounded-full bg-white/30"></div>
                  <div className="h-0.5 flex-1 rounded-full bg-white/30"></div>
                </div>

                {/* Profile header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                      <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden relative">
                        <span>{cleanUser.charAt(0).toUpperCase()}</span>
                        <img
                          src={
                            ownAvatar?.startsWith("/media/")
                              ? `${API_BASE}${ownAvatar}`
                              : ownAvatar || "/brand-avatar.jpg"
                          }
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.src.includes("brand-avatar.jpg")) {
                              img.src = "/brand-avatar.jpg";
                            } else {
                              img.style.display = "none";
                            }
                          }}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="text-white text-xs font-bold drop-shadow">
                      {cleanUser}
                    </div>
                    <span className="text-white/60 text-[10px]">Just now</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {file?.type.startsWith("video/") && (
                      <button
                        type="button"
                        onClick={toggleMuteVideo}
                        className="text-white/90 hover:text-white p-1 cursor-pointer transition-colors"
                      >
                        {isVideoMuted ? <MutedOutlined className="text-xs" /> : <SoundOutlined className="text-xs" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClearSelected}
                      className="text-white/90 hover:text-white p-1 cursor-pointer transition-colors"
                    >
                      <CloseOutlined className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Instagram Story Bottom Overlay Bar */}
              <div className="relative z-20 p-3 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center gap-2.5">
                <div className="flex-1 h-9 rounded-full border border-white/30 bg-black/30 backdrop-blur-md px-3 flex items-center text-white/60 text-[11px]">
                  Send message...
                </div>
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white/90 hover:text-white text-base cursor-pointer">
                  <HeartOutlined />
                </div>
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white/90 hover:text-white text-base cursor-pointer">
                  <SendOutlined />
                </div>
              </div>
            </div>
          </MobilePreview>
        </div>
      </div>

      {/* ── RECENT STORIES GALLERY & ARCHIVE ───────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
        {/* Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 leading-none">
                Story Publishing History
              </h3>
              <Tag color="blue" className="!rounded-full font-semibold !text-[10px]">
                {items?.length ?? 0} Stories
              </Tag>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active and past stories published to @{cleanUser} through InstaVeyra.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Segmented
              value={filter}
              onChange={(val) => setFilter(val as string)}
              options={[
                { label: `All (${items?.length ?? 0})`, value: "all" },
                { label: `Published (${stats.published})`, value: "published" },
                { label: `Processing (${stats.publishing})`, value: "publishing" },
                { label: `Failed (${stats.failed})`, value: "failed" },
              ]}
              className="!rounded-xl p-1 bg-slate-100 text-xs font-semibold"
            />
          </div>
        </div>

        {/* Loading skeleton */}
        {!items && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-[9/16] rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {items && filteredStories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-purple-500/10 text-rose-500 text-3xl">
              <InstagramOutlined />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-bold text-slate-900">
                {filter === "all" ? "No stories published yet" : `No ${filter} stories found`}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload your first vertical 9:16 photo or video using the Story Studio above to feature customer UGC or announce flash sales.
              </p>
            </div>
            <Button
              type="primary"
              icon={<FireOutlined />}
              onClick={handleLoadSampleMedia}
              className="!rounded-xl !bg-gradient-to-r !from-purple-600 !to-rose-500 font-semibold text-xs"
            >
              Compose First Story
            </Button>
          </div>
        )}

        {/* Stories Grid (9:16 Cards) */}
        {items && filteredStories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredStories.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedStory(s);
                  setViewerModalOpen(true);
                }}
                className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                {/* Media */}
                {s.kind === "video" ? (
                  <video
                    src={`${API_BASE}/media/${s.file}`}
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_BASE}/media/${s.file}`}
                    alt="Story"
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Top Badges */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-none">
                  <Tag
                    color={s.status === "published" ? "green" : s.status === "publishing" ? "blue" : "red"}
                    className="!rounded-md !m-0 font-bold !text-[9px] uppercase shadow-xs"
                  >
                    {s.status === "publishing" ? "Publishing..." : s.status}
                  </Tag>
                  <Tag className="!rounded-md !m-0 !bg-black/60 !border-0 text-white font-bold !text-[9px] uppercase">
                    {s.kind}
                  </Tag>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center z-10">
                  <div className="h-10 w-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center text-lg shadow-lg mb-2 scale-90 group-hover:scale-100 transition-transform">
                    <EyeOutlined />
                  </div>
                  <span className="text-white text-xs font-bold drop-shadow">
                    View Story
                  </span>
                </div>

                {/* Bottom Timestamp Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
                  <div className="text-[10px] text-white/90 font-medium truncate">
                    {new Date(s.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {s.error && (
                    <div className="text-[9px] text-rose-300 truncate" title={s.error}>
                      {s.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: FULLSCREEN STORY VIEWER ─────────────────────────────── */}
      <Modal
        open={viewerModalOpen}
        onCancel={() => setViewerModalOpen(false)}
        footer={null}
        width={380}
        className="!p-0 !rounded-3xl overflow-hidden"
        centered
      >
        {selectedStory && (
          <div className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-black flex flex-col justify-between">
            {/* Media */}
            {selectedStory.kind === "video" ? (
              <video
                src={`${API_BASE}/media/${selectedStory.file}`}
                autoPlay
                controls
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${API_BASE}/media/${selectedStory.file}`}
                alt="Story Fullscreen"
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}

            {/* Top Bar */}
            <div className="relative z-20 p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center font-bold text-xs">
                  {cleanUser.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold">@{cleanUser}</div>
                  <div className="text-[10px] text-white/70">
                    {new Date(selectedStory.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <Tag
                color={selectedStory.status === "published" ? "green" : "red"}
                className="!rounded-md uppercase font-bold text-[10px]"
              >
                {selectedStory.status}
              </Tag>
            </div>

            {/* Bottom Bar Info */}
            <div className="relative z-20 p-4 bg-gradient-to-t from-black/90 to-transparent text-white space-y-1">
              <div className="text-[11px] text-white/60">Story ID: {selectedStory.id}</div>
              {selectedStory.mediaId && (
                <div className="text-[11px] text-emerald-400">Meta Container ID: {selectedStory.mediaId}</div>
              )}
              {selectedStory.error && (
                <div className="text-xs text-rose-400">{selectedStory.error}</div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: STORY GUIDELINES ────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <InstagramOutlined className="text-purple-600 text-base" />
            <span className="font-bold text-slate-900">Instagram Story Specifications</span>
          </div>
        }
        open={guidelinesModalOpen}
        onCancel={() => setGuidelinesModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setGuidelinesModalOpen(false)} className="!rounded-xl !bg-purple-600 font-semibold">
            Understood
          </Button>,
        ]}
        width={500}
        className="!rounded-2xl"
      >
        <div className="space-y-4 pt-3 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-800 border border-purple-100">
            <strong>Meta Content Publishing Policy:</strong> Stories published via Meta Graph API remain active on your profile for 24 hours.
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-800">Image Specifications:</h5>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Recommended resolution: <strong>1080 × 1920 pixels (9:16)</strong></li>
              <li>Supported formats: <strong>JPEG, PNG, WebP</strong></li>
              <li>Auto-Canvas: Images not matching 9:16 are automatically centered over a blurred background copy.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-800">Video Specifications:</h5>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Duration: <strong>Up to 60 seconds</strong> (longer videos are rejected by Meta)</li>
              <li>Codecs: <strong>H.264 video</strong> and <strong>AAC audio</strong> (MP4 or MOV container)</li>
              <li>Frame rate: 23–60 fps</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-800">Meta API Limitations:</h5>
            <p className="text-slate-500">
              Instagram&apos;s Graph API does not support interactive native stickers, polls, music, or link stickers on stories published via third-party software.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
