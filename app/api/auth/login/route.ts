import { NextRequest, NextResponse } from "next/server";
import { createJwt, getDbPool, hashPassword, seedInitialAdmin, verifyPassword } from "@/lib/auth-server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "fdjNiJdowLNR";

export async function POST(request: NextRequest) {
  try {
    await seedInitialAdmin();

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!password) {
      return NextResponse.json(
        { ok: false, message: "Please enter your password." },
        { status: 400 }
      );
    }

    const db = getDbPool();

    // 1. Try login with email if provided
    if (email) {
      const userRes = await db.query(
        "SELECT id, email, name, password_hash, instagram_handle, role FROM app_users WHERE LOWER(email) = $1",
        [email]
      );

      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        const isValid = await verifyPassword(password, user.password_hash);

        // Fallback: check if matches master ADMIN_PASSWORD
        const isMaster = password === ADMIN_PASSWORD;

        if (isValid || isMaster) {
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
            message: "Login successful",
          });
        }

        return NextResponse.json(
          { ok: false, message: "Invalid email or password. Please try again." },
          { status: 401 }
        );
      }

      // If user email doesn't exist in DB, but password matches ADMIN_PASSWORD, create and log them in!
      if (password === ADMIN_PASSWORD) {
        const newHash = await hashPassword(password);
        const name = email.split("@")[0] || "Admin";
        const created = await db.query(
          `INSERT INTO app_users (email, name, password_hash, role)
           VALUES ($1, $2, $3, 'admin')
           RETURNING id, email, name, instagram_handle, role`,
          [email, name, newHash]
        );
        const user = created.rows[0];
        const token = createJwt({
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        });

        return NextResponse.json({
          ok: true,
          token,
          user,
          message: "Login successful",
        });
      }

      return NextResponse.json(
        { ok: false, message: "No account found with this email. Please sign up." },
        { status: 404 }
      );
    }

    // 2. Fallback: single password login (master admin password)
    if (password === ADMIN_PASSWORD) {
      const token = createJwt({
        role: "admin",
        email: "admin@inro.social",
        name: "Admin",
      });

      return NextResponse.json({
        ok: true,
        token,
        user: {
          email: "admin@inro.social",
          name: "Admin",
          role: "admin",
        },
        message: "Login successful",
      });
    }

    return NextResponse.json(
      { ok: false, message: "Invalid credentials." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { ok: false, message: (error as Error).message || "Login failed." },
      { status: 500 }
    );
  }
}
