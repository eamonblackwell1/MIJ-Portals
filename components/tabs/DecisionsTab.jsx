"use client";
import { SectionLabel, AccentLine, PriorityBadge } from "@/components/shared";

function DecisionCard({ d, coupleLabel }) {
  const resolved = d.status === "resolved";
  return (
    <div style={{ border: "1px solid rgba(0,0,0,0.08)", padding: "24px 26px", marginBottom: 14, opacity: resolved ? 0.6 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        {resolved
          ? <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#5a8a5a", fontWeight: 600 }}>Resolved</span>
          : <PriorityBadge priority={d.priority} />}
        <div style={{ fontSize: 12, color: d.overdue ? "#722F37" : "#888", fontWeight: d.overdue ? 600 : 400 }}>
          {resolved || !d.deadline ? "" : d.overdue ? `Was due ${d.deadline}` : `by ${d.deadline}`}
        </div>
      </div>
      <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400, margin: "0 0 6px", textDecoration: resolved ? "line-through" : "none" }}>{d.title}</h3>
      {d.description && <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.7 }}>{d.description}</p>}
    </div>
  );
}

export default function DecisionsTab({ data }) {
  const active = data.decisions.filter(d => d.status === "active");
  const horizon = data.decisions.filter(d => d.status === "on-horizon");
  const resolved = data.decisions.filter(d => d.status === "resolved");

  const renderSection = (label, items) => items.length > 0 && (
    <div key={label} style={{ marginBottom: 44 }}>
      <SectionLabel>{label}</SectionLabel>
      <AccentLine />
      {items.map(d => <DecisionCard key={d.id} d={d} coupleLabel={data.coupleLabel} />)}
    </div>
  );

  return (
    <div>
      <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginTop: 0, marginBottom: 36 }}>
        These are the things we need from you. When one is done, let us know and we will update it here.
      </p>
      {data.decisions.length === 0 && (
        <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Nothing needed from you right now.</p>
      )}
      {renderSection("Needs Input Now", active)}
      {renderSection("On the Horizon", horizon)}
      {renderSection("Resolved", resolved)}
    </div>
  );
}
