import { NextResponse } from "next/server";

export async function GET() {
  const t0 = Date.now();
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  const model =
    process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";

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
        label: body.data?.label ?? "Primary Production Key",
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
