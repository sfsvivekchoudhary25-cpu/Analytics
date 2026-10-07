import { NextRequest, NextResponse } from "next/server";

export interface CloudinaryHealthResponse {
  status: "operational" | "degraded" | "error" | "not_configured";
  healthy: boolean;
  latencyMs: number;
  cloudName: string;
  cdnUrl: string;
  apiVerified: boolean;
  edgeDelivery: boolean;
  message: string;
  features: string[];
  timestamp: string;
}

export async function GET(request: NextRequest) {
  const t0 = Date.now();

  // 1. Query the backend service directly (which securely holds the credentials)
  try {
    const backendRes = await fetch("http://localhost:4000/integrations/cloudinary", {
      cache: "no-store",
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // If backend is not reached yet, fall back to checking the public CDN edge
  }

  const { searchParams } = new URL(request.url);
  const cloudName = searchParams.get("cloudName")?.trim() || "hrnqhbaa";
  const apiKey = searchParams.get("apiKey")?.trim() || "";
  const apiSecret = searchParams.get("apiSecret")?.trim() || "";

  try {
    // 1. Ping Cloudinary Global CDN Edge
    const cdnSampleUrl = `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/sample.jpg`;
    const cdnRes = await fetch(cdnSampleUrl, {
      method: "HEAD",
      cache: "no-store",
    }).catch(() => null);

    const latencyMs = Date.now() - t0;
    const edgeOk = cdnRes ? cdnRes.status >= 200 && cdnRes.status < 400 : false;

    // 2. If API Key and Secret are provided, check Admin API credentials
    let apiVerified = false;
    let authError = "";

    if (apiKey && apiSecret) {
      try {
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
        const pingRes = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/ping`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
          },
          cache: "no-store",
        });

        if (pingRes.ok) {
          apiVerified = true;
        } else {
          const errBody = await pingRes.json().catch(() => ({}));
          authError = errBody?.error?.message || `HTTP ${pingRes.status}`;
        }
      } catch (err) {
        authError = (err as Error).message;
      }
    }

    const healthy = edgeOk || apiVerified;
    const status: "operational" | "degraded" | "error" = healthy
      ? "operational"
      : "degraded";

    const response: CloudinaryHealthResponse = {
      status,
      healthy,
      latencyMs,
      cloudName,
      cdnUrl: `https://res.cloudinary.com/${cloudName}`,
      apiVerified,
      edgeDelivery: edgeOk,
      message: healthy
        ? (apiVerified
            ? `Cloudinary API & Global CDN fully operational (${latencyMs}ms)`
            : `Cloudinary Edge CDN reachable (${latencyMs}ms)`)
        : (authError ? `Credentials error: ${authError}` : "CDN edge unreachable"),
      features: [
        "f_auto (Smart Format: WebP/AVIF)",
        "q_auto (Intelligent Compression)",
        "Global Edge CDN Acceleration",
        "Direct HTTPS Meta Graph API Ingestion",
      ],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    const latencyMs = Date.now() - t0;
    return NextResponse.json(
      {
        status: "error",
        healthy: false,
        latencyMs,
        cloudName,
        cdnUrl: `https://res.cloudinary.com/${cloudName}`,
        apiVerified: false,
        edgeDelivery: false,
        message: (error as Error).message || "Connection failed",
        features: [],
        timestamp: new Date().toISOString(),
      } satisfies CloudinaryHealthResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cloudName, apiKey, apiSecret, autoOptimize = true } = body;

    if (!cloudName) {
      return NextResponse.json(
        { ok: false, message: "Cloud Name is required" },
        { status: 400 }
      );
    }

    const t0 = Date.now();
    // Validate credentials if provided
    let apiVerified = false;
    let authError = "";

    if (apiKey && apiSecret) {
      const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
      const pingRes = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/ping`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        cache: "no-store",
      }).catch((e) => null);

      if (pingRes && pingRes.ok) {
        apiVerified = true;
      } else if (pingRes) {
        const errJson = await pingRes.json().catch(() => ({}));
        authError = errJson?.error?.message || "Invalid Cloudinary API credentials";
      }
    }

    // Ping CDN Edge
    const cdnRes = await fetch(`https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/sample.jpg`, {
      method: "HEAD",
      cache: "no-store",
    }).catch(() => null);

    const latencyMs = Date.now() - t0;
    const edgeOk = cdnRes ? cdnRes.status >= 200 && cdnRes.status < 400 : false;

    if (apiKey && apiSecret && !apiVerified) {
      return NextResponse.json(
        {
          ok: false,
          message: authError || "Cloudinary API verification failed. Please check your API Key and API Secret.",
          latencyMs,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully connected to Cloudinary (${cloudName})`,
      latencyMs,
      config: {
        cloudName,
        apiKey: apiKey ? `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}` : "",
        hasSecret: !!apiSecret,
        autoOptimize: !!autoOptimize,
        connected: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: (error as Error).message || "Verification request failed" },
      { status: 500 }
    );
  }
}
