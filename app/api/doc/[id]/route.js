import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDocumentFileUrl } from "@/lib/notion/portal";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Redirects a signed-in couple to a fresh, short-lived URL for one of their
// Client Documents. Notion file URLs expire, so nothing is cached here.
export async function GET(_request, { params }) {
  const { id } = await params;
  const jar = await cookies();
  const session = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) return new NextResponse("Not signed in", { status: 401 });
  if (!/^[0-9a-f-]{32,36}$/i.test(id ?? "")) return new NextResponse("Not found", { status: 404 });

  try {
    const url = await getDocumentFileUrl(id, session.clientId);
    if (!url) return new NextResponse("Not found", { status: 404 });
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Doc route error:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}
