"use client";
import { useState, useEffect } from "react";
import { useDebouncedSave } from "@/hooks/useDebouncedSave";
import SaveIndicator from "@/components/SaveIndicator";
import OverviewTab from "@/components/tabs/OverviewTab";
import DaysTab from "@/components/tabs/DaysTab";
import DecisionsTab from "@/components/tabs/DecisionsTab";
import ProgressTab from "@/components/tabs/ProgressTab";
import ChecklistTab from "@/components/tabs/ChecklistTab";
import BudgetTab from "@/components/tabs/BudgetTab";
import Editable from "@/components/Editable";
import defaultData from "@/lib/defaultData";

export default function Dashboard({ initialData, dashboardId }) {
  const MASTER_PLAN_SEED_VERSION = "workbook-v2";
  const DAY_PLAN_VERSION = "day-plan-v2";
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState("overview");
  const [saveStatus, setSaveStatus] = useState("idle");

  // Deep-clone updater — all mutations go through here
  const u = (fn) => setData(prev => {
    const next = JSON.parse(JSON.stringify(prev));
    fn(next);
    return next;
  });

  // Update footer "last updated" date after each successful save
  const onSaveSuccess = () => {
    u(d => {
      d.couple.updated = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    });
  };

  // Debounced Supabase save
  useDebouncedSave(data, dashboardId, setSaveStatus, onSaveSuccess);

  // Legacy default migration: previous dashboards were seeded at AU$9,200.
  useEffect(() => {
    setData(prev => {
      if (prev.planningFee !== 9200) return prev;
      return { ...prev, planningFee: 8600 };
    });
  }, []);

  // One-time itinerary update to latest 4-day client structure.
  useEffect(() => {
    setData(prev => {
      if (prev?.dayPlanVersion === DAY_PLAN_VERSION) return prev;
      return {
        ...prev,
        days: defaultData.days,
        dayPlanVersion: DAY_PLAN_VERSION,
      };
    });
  }, []);

  // One-time workbook sync plus backfill for timeline/day-by-day defaults.
  useEffect(() => {
    const shouldSeed = data?.seedVersion !== MASTER_PLAN_SEED_VERSION;
    if (!shouldSeed) return;

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/master-plan");
        if (!res.ok) return;
        const payload = await res.json();
        const checklist = Array.isArray(payload?.checklist) ? payload.checklist : [];
        if (checklist.length === 0 || cancelled) return;

        setData(prev => {
          if (prev?.seedVersion === MASTER_PLAN_SEED_VERSION) return prev;
          const needsMilestones = !Array.isArray(prev?.milestones);
          const needsDays = !Array.isArray(prev?.days) || prev.days.length === 0;
          return {
            ...prev,
            planningFee: prev?.planningFee === 9200 ? 8600 : prev?.planningFee,
            milestones: needsMilestones ? defaultData.milestones : prev.milestones,
            days: needsDays ? defaultData.days : prev.days,
            checklist: checklist.length > 0 ? checklist : prev.checklist,
            seedVersion: MASTER_PLAN_SEED_VERSION,
          };
        });
      } catch (err) {
        console.error("Master plan reset failed:", err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [data?.seedVersion]);

  // Auto-clear "Saved ✓" after 3s
  useEffect(() => {
    if (saveStatus === "saved") {
      const t = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  const waitingCount = data.decisions.filter(d => d.status === "active").length;

  const allTabs = [
    { key: "overview", label: "Overview" },
    { key: "days", label: "Day by Day" },
    { key: "decisions", label: "Decisions" },
    { key: "progress", label: "Tasks" },
    { key: "checklist", label: "Master Plan" },
    { key: "budget", label: "Budget" },
  ];
  const hidden = new Set(data.hiddenTabs || []);
  const tabs = allTabs.filter(t => !hidden.has(t.key));

  return (
    <div style={{ fontFamily: "'Sen',sans-serif", background: "#FAF8F5", minHeight: "100vh", color: "#1a1a1a" }}>
      {/* HEADER */}
      <div style={{ background: "#1a1a1a", color: "#FAF8F5", padding: "48px 0 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 40px" }}>
          <Editable
            value={data.dashboardTitle || "Married in Japan"}
            onChange={v => u(d => { d.dashboardTitle = v; })}
            tag="div"
            style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#B8977E", marginBottom: 20, display: "inline-block" }}
          />
          <Editable
            value={data.couple.names}
            onChange={v => u(d => { d.couple.names = v; })}
            tag="h1"
            style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(34px,5vw,52px)", fontWeight: 300, lineHeight: 1.1, margin: "0 0 12px", color: "#FAF8F5", display: "block" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 14, color: "rgba(250,248,245,0.55)", marginBottom: 32 }}>
            <Editable
              value={data.couple.location}
              onChange={v => u(d => { d.couple.location = v; })}
              tag="span"
              style={{ fontSize: 14, color: "rgba(250,248,245,0.55)" }}
            />
            <span style={{ color: "rgba(250,248,245,0.2)" }}>·</span>
            <Editable
              value={data.couple.date}
              onChange={v => u(d => { d.couple.date = v; })}
              tag="span"
              style={{ fontSize: 14, color: "rgba(250,248,245,0.55)" }}
            />
            <span style={{ color: "rgba(250,248,245,0.2)" }}>·</span>
            <Editable
              value={data.couple.guests}
              onChange={v => u(d => { d.couple.guests = v; })}
              tag="span"
              style={{ fontSize: 14, color: "rgba(250,248,245,0.55)" }}
            />
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
        {tab === "overview"  && <OverviewTab  data={data} setTab={setTab} u={u} />}
        {tab === "days"      && <DaysTab      data={data} u={u} />}
        {tab === "decisions" && <DecisionsTab data={data} u={u} />}
        {tab === "progress"  && <ProgressTab  data={data} u={u} />}
        {tab === "checklist" && <ChecklistTab data={data} u={u} />}
        {tab === "budget"    && <BudgetTab    data={data} u={u} />}
      </div>

      {/* FOOTER */}
      <div style={{ background: "#1a1a1a", padding: "36px 0", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#B8977E", marginBottom: 6 }}>
          {data.dashboardTitle || "Married in Japan"}
        </div>
        <div style={{ fontSize: 13, color: "rgba(250,248,245,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 }}>
          <span>Last updated: {data.couple.updated} · Juri & Eamon</span>
          <SaveIndicator status={saveStatus} />
        </div>
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
      </div>
    </div>
  );
}
