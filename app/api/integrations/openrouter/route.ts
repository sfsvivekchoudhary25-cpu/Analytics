import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  const authHeader = request.headers.get("authorization") || "";

  // 1. Try querying the NestJS backend
  try {
    const backendRes = await fetch("http://localhost:4000/ai/ping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json({
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    // Backend offline fallback
  }

  // 2. Direct fallback using environment variables
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  const model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - t0;
    if (res.ok) {
      const body = await res.json();
      const dailyReqs = body.data?.free_model_daily_requests;
      return NextResponse.json({
        status: "operational",
        healthy: true,
        latencyMs,
        model,
        provider: "OpenRouter Multi-LLM Gateway",
        remainingRequests: dailyReqs?.remaining ?? 49,
        totalLimit: dailyReqs?.limit ?? 50,
        isFreeTier: body.data?.is_free_tier ?? true,
        label: body.data?.label ?? "System Key",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: "degraded",
      healthy: false,
      latencyMs,
      model,
      provider: "OpenRouter",
      message: `HTTP ${res.status}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const latencyMs = Date.now() - t0;
    return NextResponse.json({
      status: "error",
      healthy: false,
      latencyMs,
      model,
      provider: "OpenRouter",
      message: (err as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model } = body;
    const authHeader = request.headers.get("authorization") || "";

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: "OpenRouter API Key is required" },
        { status: 400 }
      );
    }

    // Proxy to backend to encrypt with AES-256-GCM and store in PostgreSQL
    const backendRes = await fetch("http://localhost:4000/ai/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ apiKey, model }),
    });

    const data = await backendRes.json();
    if (!backendRes.ok) {
      return NextResponse.json(
        { ok: false, message: data.message || "Failed to save key in backend" },
        { status: backendRes.status }
      );
    }

    // Ping OpenRouter with the key to measure latency and verify health
    const pingRes = await fetch("http://localhost:4000/ai/ping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ apiKey, model }),
    });
    const pingData = await pingRes.json().catch(() => ({}));

    return NextResponse.json({
      ok: true,
      message: "OpenRouter API Key encrypted and saved securely.",
      config: data,
      health: pingData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Request failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const backendRes = await fetch("http://localhost:4000/ai/config", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });
    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to remove key" },
      { status: 500 }
    );
  }
}
