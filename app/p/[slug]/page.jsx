import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { findClientBySlug, loadPortalData } from "@/lib/notion/portal";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import Dashboard from "@/components/Dashboard";
import PasswordGate from "@/components/PasswordGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function PortalPage({ params }) {
  const { slug } = await params;
  const jar = await cookies();
  const session = verifySessionToken(jar.get(SESSION_COOKIE)?.value, slug);

  // Not signed in for this slug: show the gate, but only for a real, enabled portal.
  if (!session) {
    const client = await findClientBySlug(slug);
    if (!client || !client.enabled) notFound();
    return <PasswordGate slug={slug} />;
  }

  // Signed in: confirm the portal is still enabled, then fetch everything.
  const client = await findClientBySlug(slug);
  if (!client || !client.enabled || client.id !== session.clientId) notFound();

  const data = await loadPortalData(client.id);
  return <Dashboard data={data} />;
}
