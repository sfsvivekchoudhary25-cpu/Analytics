import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Set GROQ_API_KEY in the environment (frontend/.env.local locally, the host's env vars in production).
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_WHISPER_MODEL =
  process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const languageCode = formData.get("languageCode") as string | null;

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { text: "", error: "No audio blob provided" },
        { status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { text: "", error: "Groq API key not configured" },
        { status: 500 }
      );
    }

    // Determine extension from mimeType
    const mimeType = audioFile.type || "audio/webm";
    const ext = mimeType.includes("mp4")
      ? "mp4"
      : mimeType.includes("ogg")
      ? "ogg"
      : mimeType.includes("wav")
      ? "wav"
      : mimeType.includes("m4a")
      ? "m4a"
      : mimeType.includes("mp3")
      ? "mp3"
      : "webm";

    const groqFormData = new FormData();
    groqFormData.append("file", audioFile, `audio.${ext}`);
    groqFormData.append("model", GROQ_WHISPER_MODEL);
    groqFormData.append("response_format", "json");

    if (languageCode) {
      const shortLang = languageCode.split("-")[0].toLowerCase();
      groqFormData.append("language", shortLang);
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.warn(`[Groq Whisper API error ${groqRes.status}]:`, errText);
      return NextResponse.json(
        { text: "", error: `Groq error: ${groqRes.status}` },
        { status: groqRes.status }
      );
    }

    const data = (await groqRes.json()) as { text?: string };
    const text = (data.text || "").trim();

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[Groq Whisper route exception]:", err);
    return NextResponse.json(
      { text: "", error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

