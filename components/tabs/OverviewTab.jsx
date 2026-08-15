"use client";
import { SectionLabel, AccentLine, PriorityBadge, StatusDot } from "@/components/shared";

export default function OverviewTab({ data, setTab }) {
  const activeDecisions = data.decisions.filter(d => d.status === "active");
  const milestones = data.milestones || [];

  return (
    <div>
      {/* Timeline */}
      <SectionLabel>Your Timeline</SectionLabel>
      <AccentLine />
      <div style={{ display: "flex", gap: 0, marginBottom: 56, overflowX: "auto", paddingBottom: 8 }}>
        {milestones.map((m, i) => {
          const done = m.status === "done";
          const current = m.status === "current";
          return (
            <div key={m.id} style={{ flex: "1 0 110px", textAlign: "center", position: "relative" }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  margin: "0 auto 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  background: done ? "#722F37" : current ? "#FAF8F5" : "transparent",
                  color: done ? "#FAF8F5" : current ? "#722F37" : "#bbb",
                  border: done || current ? "2px solid #722F37" : "2px solid #ddd",
                  boxShadow: current ? "0 0 0 4px rgba(114,47,55,0.12)" : "none",
                }}
              >
                {done ? "✓" : `${i + 1}`.padStart(2, "0")}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, color: current ? "#722F37" : "#1a1a1a" }}>{m.label}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{done ? "Done" : current ? "In progress" : "Upcoming"}</div>
              {i < milestones.length - 1 && (
                <div style={{ position: "absolute", top: 17, left: "calc(50% + 22px)", right: "calc(-50% + 22px)", height: 1, background: done ? "#722F37" : "#ddd" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Needs Input */}
      {activeDecisions.length > 0 && (
        <div style={{ marginBottom: 56 }}>
          <SectionLabel>Needs Your Input</SectionLabel>
          <AccentLine />
          <div style={{ display: "grid", gap: 14 }}>
            {activeDecisions.slice(0, 4).map(d => (
              <div
                key={d.id}
                onClick={() => setTab("decisions")}
                style={{ border: "1px solid rgba(114,47,55,0.12)", padding: "22px 26px", cursor: "pointer", transition: "all 0.2s", background: "rgba(114,47,55,0.015)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#722F37"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(114,47,55,0.12)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <PriorityBadge priority={d.priority} />
                    <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 21, fontWeight: 400, margin: "8px 0 4px" }}>{d.title}</h3>
                    {d.description && <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.7 }}>{d.description}</p>}
                  </div>
                  <div style={{ fontSize: 12, color: d.overdue ? "#722F37" : "#888", whiteSpace: "nowrap" }}>by {d.deadline}</div>
                </div>
              </div>
            ))}
            {activeDecisions.length > 4 && (
              <button onClick={() => setTab("decisions")} style={{ fontFamily: "'Sen',sans-serif", fontSize: 13, color: "#722F37", background: "none", border: "none", cursor: "pointer", padding: 8, textAlign: "center" }}>
                View all {activeDecisions.length} items
              </button>
            )}
          </div>
        </div>
      )}

      {/* Working on */}
      <div style={{ marginBottom: 56 }}>
        <SectionLabel>What We're Working On</SectionLabel>
        <AccentLine />
        {data.inProgress.length === 0 && <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Nothing in progress right now.</p>}
        {data.inProgress.slice(0, 8).map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <StatusDot />
            <div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{p.task}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{p.owner}</div>
            </div>
          </div>
        ))}
        {data.inProgress.length > 8 && (
          <button onClick={() => setTab("progress")} style={{ fontFamily: "'Sen',sans-serif", fontSize: 13, color: "#722F37", background: "none", border: "none", cursor: "pointer", padding: "12px 0" }}>
            View all {data.inProgress.length} tasks
          </button>
        )}
      </div>

      {/* Completed */}
      <div>
        <SectionLabel>Recently Completed</SectionLabel>
        <AccentLine />
        {data.completed.length === 0 && <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Nothing completed yet.</p>}
        {data.completed.slice(0, 8).map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
            <span style={{ color: "#5a8a5a", fontSize: 13, flexShrink: 0 }}>✓</span>
            <div style={{ flex: 1, fontSize: 13, color: "#666" }}>{c.task}</div>
            <div style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>{c.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
