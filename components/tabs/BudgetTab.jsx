"use client";
import { SectionLabel, AccentLine } from "@/components/shared";

const cell = { padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14 };
const num = { ...cell, textAlign: "right", whiteSpace: "nowrap" };

const STATUS_COLOR = {
  Researching: "#888",
  Quoted: "#96734e",
  Booked: "#722F37",
  Paid: "#5a8a5a",
  "Not needed": "#aaa",
};

export default function BudgetTab({ data }) {
  const prefix = data.currency || "US$";
  const jpy = data.currencyCode === "JPY";
  const fmt = (n) => (n == null || Number.isNaN(Number(n)) ? "" : `${prefix}${Math.round(Number(n)).toLocaleString("en-US")}`);
  const dash = <span style={{ color: "#bbb" }}>-</span>;

  const items = data.budget || [];
  const planningFee = data.planningFee;
  const desired = data.desiredBudget;

  const sumEstimate = items.reduce((s, b) => s + (b.estimate ?? 0), 0);
  const sumActual = items.reduce((s, b) => s + (b.actual ?? 0), 0);
  // For the projected total, use the actual where one exists, else the estimate.
  const projected = items.reduce((s, b) => s + (b.actual ?? b.estimate ?? 0), 0) + (planningFee ?? 0);
  const committed = sumActual + (planningFee ?? 0);
  const anyActual = items.some(b => b.actual != null);

  return (
    <div>
      <SectionLabel>Wedding Budget</SectionLabel>
      <AccentLine />

      {desired != null && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>Target budget</span>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: "#1a1a1a" }}>{fmt(desired)}</span>
        </div>
      )}
      {data.budgetNote && (
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, margin: "0 0 28px" }}>{data.budgetNote}</p>
      )}

      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#722F37", marginBottom: 16, marginTop: 20 }}>Costs</div>
      <div style={{ width: 40, height: 2, background: "#722F37", marginBottom: 20 }} />

      {items.length === 0 && planningFee == null && (
        <p style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Your budget breakdown is being prepared.</p>
      )}

      {(items.length > 0 || planningFee != null) && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr>
              {["Item", "Estimate", "Actual", "Status"].map((h, i) => (
                <th key={h} style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.1)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", textAlign: i === 0 ? "left" : "right", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(b => (
              <tr key={b.id} style={{ opacity: b.status === "Not needed" ? 0.5 : 1 }}>
                <td style={cell}>
                  <div>{b.label}</div>
                  {(b.category || b.vendor || b.notes) && (
                    <div style={{ fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.6 }}>
                      {[b.category, b.vendor].filter(Boolean).join(" · ")}
                      {b.notes && <div>{b.notes}</div>}
                    </div>
                  )}
                </td>
                <td style={num}>{b.estimate != null ? fmt(b.estimate) : dash}</td>
                <td style={{ ...num, color: b.actual != null ? "#1a1a1a" : undefined, fontWeight: b.actual != null ? 600 : 400 }}>{b.actual != null ? fmt(b.actual) : dash}</td>
                <td style={{ ...num, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: STATUS_COLOR[b.status] || "#888" }}>{b.status || ""}</td>
              </tr>
            ))}
            {planningFee != null && (
              <tr>
                <td style={{ ...cell, fontWeight: 600 }}>Married in Japan planning fee</td>
                <td style={num}>{dash}</td>
                <td style={{ ...num, color: "#5a8a5a", fontWeight: 600 }}>{fmt(planningFee)}</td>
                <td style={{ ...num, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#5a8a5a" }}>Confirmed</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Totals */}
      {(items.length > 0 || planningFee != null) && (
        <div style={{ borderTop: "2px solid #722F37", paddingTop: 20, marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Projected Total</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{fmt(projected)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#888" }}>Estimated vendor costs</span>
            <span style={{ fontSize: 13, color: "#888" }}>{fmt(sumEstimate)}</span>
          </div>
          {anyActual && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#5a8a5a" }}>Confirmed so far</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#5a8a5a" }}>{fmt(committed)}</span>
            </div>
          )}
          {desired != null && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: projected > desired ? "#722F37" : "#888" }}>
                {projected > desired ? "Over target by" : "Under target by"}
              </span>
              <span style={{ fontSize: 13, color: projected > desired ? "#722F37" : "#888" }}>{fmt(Math.abs(desired - projected))}</span>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 12, color: "#aaa", lineHeight: 1.7, margin: 0 }}>
        Estimates are our best current figures and will firm up as vendors are booked. Actuals reflect quotes or invoices we have in hand.
        {jpy ? "" : " Vendor costs are shown in your currency for planning purposes; some vendors invoice in Japanese yen."}
      </p>
    </div>
  );
}
