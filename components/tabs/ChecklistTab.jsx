"use client";
import { useState } from "react";
import { SectionLabel, AccentLine } from "@/components/shared";

const PHASE_LABELS = {
  "12mo": "12 months out",
  "9mo": "9 months out",
  "6mo": "6 months out",
  "3mo": "3 months out",
  "1mo": "1 month out",
  "Wedding Week": "Wedding week",
};

const STATUS = {
  "not-started": { label: "Not Started", color: "#777" },
  "in-progress": { label: "In Progress", color: "#96734e" },
  done: { label: "Locked In", color: "#5a8a5a" },
};

export default function ChecklistTab({ data }) {
  const checklist = data.checklist || [];
  const [filter, setFilter] = useState("open");
  const visible = filter === "all" ? checklist : checklist.filter(i => i.status !== "done");
  const doneCount = checklist.filter(i => i.status === "done").length;

  // Group by phase, preserving the adapter's sort order.
  const groups = [];
  for (const item of visible) {
    const key = item.phase || "Other";
    let g = groups.find(x => x.key === key);
    if (!g) { g = { key, label: PHASE_LABELS[key] || key, items: [] }; groups.push(g); }
    g.items.push(item);
  }

  return (
    <div>
      <SectionLabel>Master Plan</SectionLabel>
      <AccentLine />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, margin: 0 }}>
          {checklist.length} planning items · {doneCount} locked in
        </p>
        <div style={{ display: "flex", gap: 0 }}>
          {[["open", "Open"], ["all", "All"]].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              fontFamily: "'Sen',sans-serif", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
              padding: "8px 14px", cursor: "pointer",
              background: filter === key ? "#1a1a1a" : "transparent",
              color: filter === key ? "#FAF8F5" : "#888",
              border: "1px solid rgba(0,0,0,0.12)",
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Nothing to show.</p>}

      {groups.map(g => (
        <div key={g.key} style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#96734e", marginBottom: 12 }}>{g.label}</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["#", "Item", "Category", "Due", "Status"].map((h, i) => (
                  <th key={h} style={{
                    padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.1)", fontSize: 11, letterSpacing: 2,
                    textTransform: "uppercase", fontWeight: 600,
                    textAlign: i === 1 ? "left" : i === 0 ? "center" : "right",
                    width: i === 0 ? 40 : undefined,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.items.map(item => {
                const s = STATUS[item.status] || STATUS["not-started"];
                const done = item.status === "done";
                return (
                  <tr key={item.id} style={{ opacity: done ? 0.55 : 1 }}>
                    <td style={{ padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", textAlign: "center", fontSize: 12, color: "#888" }}>{item.num}</td>
                    <td style={{ padding: "10px 8px 10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14, color: done ? "#999" : "#333", textDecoration: done ? "line-through" : "none" }}>{item.task}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 12, color: "#888", textAlign: "right", whiteSpace: "nowrap" }}>{item.category}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 12, color: "#888", textAlign: "right", whiteSpace: "nowrap" }}>{item.dueLabel || ""}</td>
                    <td style={{ padding: "10px 0 10px 8px", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: s.color, textAlign: "right", whiteSpace: "nowrap" }}>{s.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
