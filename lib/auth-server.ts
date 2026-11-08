import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Pool } from "pg";

const scryptAsync = promisify(scrypt);

// Supabase connection string (set in .env.local). No local fallback on purpose.
const DATABASE_URL = process.env.DATABASE_URL;

const JWT_SECRET = process.env.JWT_SECRET;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function requireJwtSecret(): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set (expected in .env.local)");
  return JWT_SECRET;
}

// Global connection pool (cached across hot reloads in development)
declare global {
  var __ighub_db_pool: Pool | undefined;
}

export function getDbPool(): Pool {
  if (!global.__ighub_db_pool) {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not set (expected the Supabase connection string in .env.local)");
    }
    const newPool = new Pool({
      connectionString: DATABASE_URL,
      // Verified TLS for remote hosts; off for local dev.
      // Set DATABASE_CA_CERT to the Supabase CA PEM if the cert isn't trusted.
      ssl: /localhost|127\.0\.0\.1/.test(DATABASE_URL)
        ? false
        : process.env.DATABASE_CA_CERT
          ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, "\n") }
          : true,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    // The app DB role does not bypass Row-Level Security. This pool serves
    // server-side login/session lookups (no tenant yet), so run it in the same
    // server-task bypass mode the backend uses for unauthenticated queries.
    newPool.on("connect", (client) => {
      client.query("SET app.bypass_rls = 'on'").catch((err) => {
        console.warn("Failed to set app.bypass_rls on pooled client:", err.message || err);
      });
    });

    // Handle unexpected errors on idle clients so they do not crash the Node.js process
    newPool.on("error", (err) => {
      console.warn("PostgreSQL idle client disconnected or encountered error:", err.message || err);
    });

    global.__ighub_db_pool = newPool;
  }
  return global.__ighub_db_pool;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    if (keyBuffer.length !== derivedKey.length) return false;
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export function createJwt(payload: Record<string, any>, expiresInSec = 30 * 86400): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + expiresInSec,
    })
  );
  const signature = createHmac("sha256", requireJwtSecret())
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = createHmac("sha256", requireJwtSecret())
      .update(`${header}.${body}`)
      .digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function seedInitialAdmin(): Promise<void> {
  try {
    if (!ADMIN_PASSWORD) return; // never seed an admin without an explicit password
    const db = getDbPool();
    const existing = await db.query("SELECT COUNT(*) FROM app_users");
    if (parseInt(existing.rows[0].count, 10) === 0) {
      const defaultHash = await hashPassword(ADMIN_PASSWORD);
      await db.query(
        `INSERT INTO app_users (email, name, password_hash, instagram_handle, role)
         VALUES ($1, $2, $3, $4, $5)`,
        ["admin@inro.social", "Admin", defaultHash, "fabroniee", "admin"]
      );
    }
  } catch (err) {
    console.error("Failed to seed initial admin:", err);
  }
}
