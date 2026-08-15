"use client";
import { SectionLabel, AccentLine } from "@/components/shared";

const TYPE_ORDER = ["Proposal", "Contract", "Venue estimate", "Hotel estimate", "Vendor quote", "Other"];

export default function DocumentsTab({ data }) {
  const docs = data.documents || [];
  const groups = TYPE_ORDER
    .map(type => ({ type, items: docs.filter(d => d.type === type) }))
    .filter(g => g.items.length > 0);
  // Any type not in the known list goes at the end.
  const known = new Set(TYPE_ORDER);
  const others = docs.filter(d => !known.has(d.type));
  if (others.length) groups.push({ type: "Other", items: others });

  return (
    <div>
      <SectionLabel>Documents</SectionLabel>
      <AccentLine />
      <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginTop: 0, marginBottom: 36 }}>
        Proposals, contracts, estimates and quotes we have shared with you. Links open in a new tab.
      </p>

      {docs.length === 0 && <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>No documents shared yet.</p>}

      {groups.map(g => (
        <div key={g.type} style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#96734e", marginBottom: 12 }}>{g.type}</div>
          {g.items.map(d => {
            const href = d.hasFile ? `/api/doc/${d.id}` : d.href;
            return (
              <a
                key={d.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                  padding: "16px 20px", marginBottom: 10, border: "1px solid rgba(0,0,0,0.08)",
                  textDecoration: "none", color: "#1a1a1a", transition: "all 0.2s", background: "#fff",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#722F37"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, lineHeight: 1.5 }}>{d.name}</div>
                  {d.notes && <div style={{ fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.6 }}>{d.notes}</div>}
                </div>
                <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#722F37", whiteSpace: "nowrap" }}>
                  {d.hasFile ? "Download" : "Open"}
                </span>
              </a>
            );
          })}
        </div>
      ))}
    </div>
  );
}
