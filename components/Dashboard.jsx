"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OverviewTab from "@/components/tabs/OverviewTab";
import DaysTab from "@/components/tabs/DaysTab";
import DecisionsTab from "@/components/tabs/DecisionsTab";
import ProgressTab from "@/components/tabs/ProgressTab";
import ChecklistTab from "@/components/tabs/ChecklistTab";
import BudgetTab from "@/components/tabs/BudgetTab";
import DocumentsTab from "@/components/tabs/DocumentsTab";

const ALL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "days", label: "Day by Day" },
  { key: "decisions", label: "Decisions" },
  { key: "progress", label: "Tasks" },
  { key: "checklist", label: "Master Plan" },
  { key: "budget", label: "Budget" },
  { key: "documents", label: "Documents" },
];

export default function Dashboard({ data }) {
  const router = useRouter();
  const hidden = new Set(data.hiddenTabs || []);
  // A hidden tab can be revealed by visiting the portal with its key as the URL
  // hash (e.g. /p/<slug>#budget). Convenience for planners, not a security boundary.
  const [revealed, setRevealed] = useState(null);
  const tabs = ALL_TABS.filter(t => !hidden.has(t.key) || t.key === revealed);
  const [tab, setTab] = useState(tabs[0]?.key ?? "overview");
  useEffect(() => {
    const read = () => {
      const h = (window.location.hash || "").slice(1).toLowerCase();
      if (ALL_TABS.some(t => t.key === h) && (data.hiddenTabs || []).includes(h)) {
        setRevealed(h);
        setTab(h);
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const waitingCount = (data.decisions || []).filter(d => d.status === "active").length;

  const signOut = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.refresh();
  };

  const headerMeta = [data.couple.location, data.couple.date, data.couple.guests].filter(Boolean);

  return (
    <div style={{ fontFamily: "'Sen',sans-serif", background: "#FAF8F5", minHeight: "100vh", color: "#1a1a1a" }}>
      {/* HEADER */}
      <div style={{ background: "#1a1a1a", color: "#FAF8F5", padding: "48px 0 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#B8977E", marginBottom: 20 }}>
            {data.dashboardTitle || "Married in Japan"}
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(34px,5vw,52px)", fontWeight: 300, lineHeight: 1.1, margin: "0 0 12px", color: "#FAF8F5" }}>
            {data.couple.names}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 14, color: "rgba(250,248,245,0.55)", marginBottom: 32 }}>
            {headerMeta.map((m, i) => (
              <span key={i} style={{ display: "inline-flex", gap: 16 }}>
                {i > 0 && <span style={{ color: "rgba(250,248,245,0.2)" }}>·</span>}
                <span>{m}</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(250,248,245,0.1)", overflowX: "auto" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontFamily: "'Sen',sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
                color: tab === t.key ? "#FAF8F5" : "rgba(250,248,245,0.35)", background: "none", border: "none",
                borderBottom: tab === t.key ? "2px solid #B8977E" : "2px solid transparent",
                padding: "12px 20px", cursor: "pointer", transition: "all 0.2s", position: "relative", whiteSpace: "nowrap",
              }}>
                {t.label}
                {t.key === "decisions" && waitingCount > 0 && (
                  <span style={{ position: "absolute", top: 4, right: 4, background: "#722F37", color: "#fff", fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {waitingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 40px 80px" }}>
        {tab === "overview"  && <OverviewTab  data={data} setTab={setTab} />}
        {tab === "days"      && <DaysTab      data={data} />}
        {tab === "decisions" && <DecisionsTab data={data} />}
        {tab === "progress"  && <ProgressTab  data={data} />}
        {tab === "checklist" && <ChecklistTab data={data} />}
        {tab === "budget"    && <BudgetTab    data={data} />}
        {tab === "documents" && <DocumentsTab data={data} />}
      </div>

      {/* FOOTER */}
      <div style={{ background: "#1a1a1a", padding: "36px 0", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#B8977E", marginBottom: 6 }}>
          {data.dashboardTitle || "Married in Japan"}
        </div>
        <div style={{ fontSize: 13, color: "rgba(250,248,245,0.35)", marginBottom: 12 }}>
          {data.couple.updated ? `Last updated: ${data.couple.updated} · ` : ""}Juri & Eamon
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 28, alignItems: "center" }}>
          <a
            href="https://cal.com/japanweddingexperiences/consultation"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#B8977E", textDecoration: "none", borderBottom: "1px solid rgba(184,151,126,0.35)", paddingBottom: 2, transition: "color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#FAF8F5"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#B8977E"; }}
          >
            Book a Consultation
          </a>
          <button
            onClick={signOut}
            style={{ fontFamily: "'Sen',sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "rgba(250,248,245,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = "#FAF8F5"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(250,248,245,0.3)"; }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
