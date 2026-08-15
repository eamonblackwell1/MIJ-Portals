import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "mij_portal";
const SESSION_DAYS = 30;

function secret() {
  const s = process.env.PORTAL_SECRET;
  if (!s || s.length < 16) throw new Error("PORTAL_SECRET is not set (needs 16+ characters)");
  return s;
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function sign(payload) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

// Token = base64url(JSON payload) + "." + HMAC signature
export function createSessionToken({ slug, clientId }) {
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const payload = b64url(JSON.stringify({ slug, clientId, exp }));
  return `${payload}.${sign(payload)}`;
}

// Returns { slug, clientId } or null. Constant-time signature check.
export function verifySessionToken(token, expectedSlug) {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!data?.slug || !data?.clientId || typeof data.exp !== "number") return null;
  if (Date.now() > data.exp) return null;
  if (expectedSlug && data.slug !== expectedSlug) return null;
  return { slug: data.slug, clientId: data.clientId };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  };
}

// Constant-time string compare for the password check.
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a ?? ""), "utf8");
  const bb = Buffer.from(String(b ?? ""), "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
