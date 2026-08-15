"use client";
import { useState } from "react";
import { SectionLabel, AccentLine } from "@/components/shared";

export default function DaysTab({ data }) {
  const days = data.days || [];
  const [selectedDay, setSelectedDay] = useState(days[0]?.id || null);
  const [showRunSheet, setShowRunSheet] = useState(false);
  const day = days.find(d => d.id === selectedDay) || days[0];
  const runSheet = data.runSheet || [];

  if (days.length === 0) {
    return (
      <div>
        <SectionLabel>Wedding Week</SectionLabel>
        <AccentLine />
        <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Your day by day itinerary is being prepared.</p>
      </div>
    );
  }

  const select = (id) => { setSelectedDay(id); setShowRunSheet(false); };

  return (
    <div>
      <SectionLabel>Wedding Week</SectionLabel>
      <AccentLine />

      {/* Day selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 40, overflowX: "auto", paddingBottom: 4 }}>
        {days.map(d => {
          const sel = d.id === day?.id;
          const wedding = d.isWeddingDay;
          return (
            <button key={d.id} onClick={() => select(d.id)} style={{
              flex: "1 0 0", minWidth: 100, padding: "16px 12px", textAlign: "center", cursor: "pointer",
              background: sel ? (wedding ? "#722F37" : "#1a1a1a") : "transparent",
              color: sel ? "#FAF8F5" : "#1a1a1a",
              border: sel ? "none" : "1px solid rgba(0,0,0,0.1)",
              fontFamily: "'Sen',sans-serif", transition: "all 0.2s",
            }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: sel ? (wedding ? "rgba(250,248,245,0.7)" : "#B8977E") : "#888", marginBottom: 4 }}>
                {d.dayLabel}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 400 }}>{d.title}</div>
              <div style={{ fontSize: 10, color: sel ? "rgba(250,248,245,0.5)" : "#aaa", marginTop: 4 }}>{d.dateLabel}</div>
            </button>
          );
        })}
      </div>

      {day && (
        <div>
          {/* Day header */}
          {day.isWeddingDay ? (
            <div style={{ background: "#722F37", color: "#FAF8F5", padding: "24px 28px", marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(250,248,245,0.6)", marginBottom: 6 }}>The Main Event</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300 }}>{day.title}</div>
              <div style={{ fontSize: 13, color: "rgba(250,248,245,0.5)", marginTop: 4 }}>{day.dateLabel}</div>
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#B8977E", marginBottom: 6 }}>{day.dayLabel}</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, marginBottom: 4 }}>{day.title}</div>
              <div style={{ fontSize: 13, color: "#888" }}>{day.dateLabel}</div>
            </div>
          )}

          {/* Summary */}
          <div style={{ marginBottom: 36 }}>
            {day.summary
              ? day.summary.split(/\n+/).map((para, i) => (
                  <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: "#444", margin: "0 0 12px" }}>{para}</p>
                ))
              : <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic", margin: 0 }}>Details for this day are coming soon.</p>}
          </div>

          {/* Run sheet (ceremony day only) */}
          {day.isWeddingDay && runSheet.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => setShowRunSheet(v => !v)}
                style={{
                  fontFamily: "'Sen',sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
                  padding: "14px 28px", background: showRunSheet ? "#722F37" : "none",
                  border: "1px solid #722F37", cursor: "pointer", color: showRunSheet ? "#FAF8F5" : "#722F37",
                  transition: "all 0.2s",
                }}
              >
                {showRunSheet ? "Hide run sheet" : "View run sheet"}
              </button>

              {showRunSheet && <RunSheet items={runSheet} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunSheet({ items }) {
  const hasPhase = items.some(i => i.phase);
  const groups = hasPhase
    ? Object.entries(items.reduce((acc, i) => { (acc[i.phase || "Schedule"] ||= []).push(i); return acc; }, {}))
    : [["", items]];

  return (
    <div style={{ marginTop: 28, border: "1px solid rgba(114,47,55,0.15)", padding: "28px 30px", background: "rgba(114,47,55,0.02)" }}>
      <SectionLabel>Wedding Day Run Sheet</SectionLabel>
      <AccentLine />
      {groups.map(([phase, rows]) => (
        <div key={phase || "all"} style={{ marginBottom: phase ? 28 : 0 }}>
          {phase && (
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#96734e", marginBottom: 12 }}>
              {phase.replace(/^\d+\.\s*/, "")}
            </div>
          )}
          {rows.map(r => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 20, padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: "#722F37", lineHeight: 1.3 }}>{r.start || " "}</div>
              <div>
                <div style={{ fontSize: 15, color: "#1a1a1a", lineHeight: 1.6 }}>{r.block || r.description}</div>
                {r.block && r.description && <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginTop: 4 }}>{r.description}</div>}
                {(r.location || r.pointPerson) && (
                  <div style={{ fontSize: 12, color: "#888", marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {r.location && <span>{r.location}</span>}
                    {r.pointPerson && <span>Point person: {r.pointPerson}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
