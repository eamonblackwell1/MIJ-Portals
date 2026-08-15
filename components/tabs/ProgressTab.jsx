"use client";
import { SectionLabel, AccentLine, StatusDot } from "@/components/shared";

export default function ProgressTab({ data }) {
  return (
    <div>
      <div style={{ marginBottom: 48 }}>
        <SectionLabel>In Progress</SectionLabel>
        <AccentLine />
        {data.inProgress.length === 0 && <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Nothing in progress right now.</p>}
        {data.inProgress.map(p => (
          <div key={p.id} style={{ padding: "16px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <StatusDot color={p.status === "Blocked" ? "#B8977E" : "#722F37"} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>{p.task}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  {p.owner}{p.status === "Blocked" ? " · Waiting on a vendor" : ""}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <SectionLabel>Completed</SectionLabel>
        <AccentLine />
        {data.completed.length === 0 && <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Nothing completed yet.</p>}
        {data.completed.map(c => (
          <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ color: "#5a8a5a", fontSize: 13, flexShrink: 0 }}>✓</span>
              <div style={{ flex: 1, fontSize: 13, color: "#666" }}>{c.task}</div>
              <div style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>{c.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
