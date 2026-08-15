import { NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/notion/portal";
import { createSessionToken, sessionCookieOptions, safeEqual, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const slug = String(body?.slug ?? "").trim();
  const password = String(body?.password ?? "");
  if (!slug || !password) {
    return NextResponse.json({ error: "Missing slug or password" }, { status: 400 });
  }

  try {
    const client = await findClientBySlug(slug);
    // Same response for unknown slug, disabled portal, and wrong password.
    if (!client || !client.enabled || !client.password || !safeEqual(password, client.password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    const token = createSessionToken({ slug, clientId: client.id });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Sign out
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
