import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, message: "No valid image file uploaded" },
        { status: 400 }
      );
    }

    // 1. Try uploading via backend service
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    try {
      const backendForm = new FormData();
      backendForm.append("file", file);

      const backendRes = await fetch(`${apiUrl}/integrations/cloudinary/upload`, {
        method: "POST",
        body: backendForm,
        cache: "no-store",
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json({
          ok: true,
          url: data.url,
          publicId: data.publicId,
          width: data.width,
          height: data.height,
        });
      }
    } catch (backendErr) {
      console.warn("Backend Cloudinary upload route unreachable, using direct Cloudinary upload fallback:", backendErr);
    }

    // 2. Direct Cloudinary signed upload fallback
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "hrnqhbaa";
    const apiKey = process.env.CLOUDINARY_API_KEY || "641864532532992";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "TPuBbWT8rjKREWAkEGuvx64mXP4";

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "inro_automation";
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    const cldForm = new FormData();
    cldForm.append("file", file);
    cldForm.append("api_key", apiKey);
    cldForm.append("timestamp", String(timestamp));
    cldForm.append("folder", folder);
    cldForm.append("signature", signature);

    const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
      method: "POST",
      body: cldForm,
    });

    if (!cldRes.ok) {
      const errorData = await cldRes.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Cloudinary upload failed with status ${cldRes.status}`;
      return NextResponse.json({ ok: false, message: errorMsg }, { status: cldRes.status });
    }

    const cldData = await cldRes.json();
    return NextResponse.json({
      ok: true,
      url: cldData.secure_url || cldData.url,
      publicId: cldData.public_id,
      width: cldData.width,
      height: cldData.height,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Failed to process image upload" },
      { status: 500 }
    );
  }
}
