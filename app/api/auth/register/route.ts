import { NextRequest, NextResponse } from "next/server";
import { createJwt, getDbPool, hashPassword, seedInitialAdmin } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    await seedInitialAdmin();

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const instagramHandle = String(body.instagramHandle || "")
      .trim()
      .replace(/^@/, "");

    // Validations
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Please provide your name." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const db = getDbPool();

    // Check if email already exists
    const existing = await db.query(
      "SELECT id FROM app_users WHERE LOWER(email) = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { ok: false, message: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    // Cryptographic scrypt hashing with random salt
    const passwordHash = await hashPassword(password);

    // Insert user into PostgreSQL
    const insertRes = await db.query(
      `INSERT INTO app_users (email, name, password_hash, instagram_handle, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, email, name, instagram_handle, role, created_at`,
      [email, name, passwordHash, instagramHandle || null]
    );

    const user = insertRes.rows[0];

    // Sign JWT token valid across backend & frontend
    const token = createJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        instagramHandle: user.instagram_handle,
        role: user.role,
      },
      message: "Account created successfully!",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { ok: false, message: (error as Error).message || "Registration failed." },
      { status: 500 }
    );
  }
}
