import { NextRequest, NextResponse } from "next/server";
import { getDbPool, verifyJwt } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ ok: false, message: "Invalid or expired token" }, { status: 401 });
    }

    if (payload.sub) {
      const db = getDbPool();
      const res = await db.query(
        "SELECT id, email, name, instagram_handle, role, created_at FROM app_users WHERE id = $1",
        [payload.sub]
      );
      if (res.rows.length > 0) {
        return NextResponse.json({ ok: true, user: res.rows[0] });
      }
    }

    return NextResponse.json({
      ok: true,
      user: {
        email: payload.email || "admin@inro.social",
        name: payload.name || "Admin",
        role: payload.role || "admin",
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Failed to retrieve user" }, { status: 500 });
  }
}
