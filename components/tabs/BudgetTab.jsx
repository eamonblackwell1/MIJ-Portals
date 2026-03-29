"use client";
import { SectionLabel, AccentLine } from "@/components/shared";
import Editable from "@/components/Editable";

export default function BudgetTab({ data, u }) {
  const updateBudgetItem = (id, field, value) => u(d => { const f = d.budget.find(x => x.id === id); if (f) f[field] = value; });
  const addBudgetItem = () => u(d => { d.budget.push({ id: `b${Date.now()}`, label: "New Category", low: 0, high: 0, confirmed: 0, isConfirmed: false, status: "Not started" }); });
  const removeBudgetItem = (id) => u(d => { d.budget = d.budget.filter(x => x.id !== id); });
  const lockConfirmed = (id) => u(d => {
    const f = d.budget.find(x => x.id === id);
    if (!f) return;
    const confirmed = Number(f.confirmed) || 0;
    if (confirmed <= 0) return;
    f.isConfirmed = true;
    f.status = "Confirmed";
  });
  const unlockConfirmed = (id) => u(d => {
    const f = d.budget.find(x => x.id === id);
    if (!f) return;
    f.isConfirmed = false;
  });
  const parseMoneyInput = (raw) => {
    const n = parseInt(String(raw).replace(/[^0-9]/g, ""), 10);
    return Number.isNaN(n) ? 0 : n;
  };
  const moneyInputStyle = {
    width: 110,
    textAlign: "right",
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "6px 8px",
    fontSize: 13,
    fontFamily: "'Sen',sans-serif",
    background: "#fff",
  };
  const formatMoney = (n) => `AU$${(Number(n) || 0).toLocaleString()}`;
  const planningFee = Number(data.planningFee) || 0;

  const vendorLow = data.budget.reduce((s, b) => s + (b.isConfirmed ? (Number(b.confirmed) || 0) : (Number(b.low) || 0)), 0);
  const vendorHigh = data.budget.reduce((s, b) => s + (b.isConfirmed ? (Number(b.confirmed) || 0) : (Number(b.high) || 0)), 0);
  const confirmedSpend = data.budget.reduce((s, b) => s + (b.isConfirmed ? (Number(b.confirmed) || 0) : 0), 0) + planningFee;
  const totalLow = vendorLow + planningFee;
  const totalHigh = vendorHigh + planningFee;

  return (
    <div>
      <SectionLabel>Wedding Budget</SectionLabel>
      <AccentLine />
      <div style={{ marginBottom: 28 }}>
        <Editable value={data.budgetNote} onChange={v => u(d => { d.budgetNote = v; })} tag="p" multiline style={{ fontSize: 14, color: "#888", lineHeight: 1.7, display: "block", margin: 0 }} />
      </div>

      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#722F37", marginBottom: 16, marginTop: 8 }}>Estimated Costs</div>
      <div style={{ width: 40, height: 2, background: "#722F37", marginBottom: 20 }} />

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr>
            {["Category", "Low Estimate", "High Estimate", "Confirmed Price", "Status", ""].map((h, i) => (
              <th key={i} style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.1)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", textAlign: i === 0 ? "left" : i === 5 ? "center" : "right", fontWeight: 600, width: i === 0 ? "30%" : i === 5 ? "30px" : undefined }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.budget.map(b => (
            <tr key={b.id}>
              <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14 }}>
                <Editable value={b.label} onChange={v => updateBudgetItem(b.id, "label", v)} style={{ fontSize: 14 }} />
              </td>
              <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14, textAlign: "right" }}>
                <input
                  value={Number(b.low) || 0}
                  onChange={e => updateBudgetItem(b.id, "low", parseMoneyInput(e.target.value))}
                  inputMode="numeric"
                  style={moneyInputStyle}
                  aria-label="Low estimate"
                />
              </td>
              <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14, textAlign: "right" }}>
                <input
                  value={Number(b.high) || 0}
                  onChange={e => updateBudgetItem(b.id, "high", parseMoneyInput(e.target.value))}
                  inputMode="numeric"
                  style={moneyInputStyle}
                  aria-label="High estimate"
                />
              </td>
              <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 12, textAlign: "right", color: "#888" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                  <input
                    value={Number(b.confirmed) || 0}
                    onChange={e => updateBudgetItem(b.id, "confirmed", parseMoneyInput(e.target.value))}
                    inputMode="numeric"
                    style={{ ...moneyInputStyle, width: 116, borderColor: b.isConfirmed ? "rgba(90,138,90,0.45)" : "rgba(0,0,0,0.12)" }}
                    aria-label="Confirmed price"
                  />
                  {b.isConfirmed ? (
                    <button
                      onClick={() => unlockConfirmed(b.id)}
                      style={{ fontFamily: "'Sen',sans-serif", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", border: "1px solid rgba(90,138,90,0.35)", background: "rgba(90,138,90,0.1)", color: "#4f7b4f", padding: "5px 8px", cursor: "pointer" }}
                    >
                      Confirmed
                    </button>
                  ) : (
                    <button
                      onClick={() => lockConfirmed(b.id)}
                      disabled={(Number(b.confirmed) || 0) <= 0}
                      style={{ fontFamily: "'Sen',sans-serif", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", border: "1px solid rgba(0,0,0,0.15)", background: "transparent", color: (Number(b.confirmed) || 0) > 0 ? "#777" : "#bbb", padding: "5px 8px", cursor: (Number(b.confirmed) || 0) > 0 ? "pointer" : "not-allowed" }}
                    >
                      Mark Confirmed
                    </button>
                  )}
                </div>
              </td>
              <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 12, textAlign: "right", color: b.isConfirmed ? "#5a8a5a" : "#888" }}>
                <Editable value={b.status} onChange={v => updateBudgetItem(b.id, "status", v)} style={{ fontSize: 12, color: b.isConfirmed ? "#5a8a5a" : "#888" }} />
              </td>
              <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                <button onClick={() => removeBudgetItem(b.id)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14 }}>×</button>
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14, fontWeight: 600 }}>Planning Fee</td>
            <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14, textAlign: "right", color: "#aaa" }}>-</td>
            <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14, textAlign: "right", color: "#aaa" }}>-</td>
            <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14, textAlign: "right", color: "#5a8a5a", fontWeight: 600 }}>
              <input
                value={planningFee}
                onChange={e => u(d => { d.planningFee = parseMoneyInput(e.target.value); })}
                inputMode="numeric"
                style={{ ...moneyInputStyle, width: 116, borderColor: "rgba(90,138,90,0.45)", color: "#5a8a5a", fontWeight: 600 }}
                aria-label="Planning fee"
              />
            </td>
            <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 12, textAlign: "right", color: "#5a8a5a" }}>Confirmed</td>
            <td style={{ padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", width: 30 }}></td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ borderTop: "2px solid #722F37", paddingTop: 20, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Projected Total</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{formatMoney(totalLow)} – {formatMoney(totalHigh)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#5a8a5a" }}>Confirmed Spend</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#5a8a5a" }}>{formatMoney(confirmedSpend)}</span>
        </div>
      </div>

      <button
        onClick={addBudgetItem}
        style={{ fontFamily: "'Sen',sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", padding: "14px 28px", background: "none", border: "1px solid rgba(0,0,0,0.12)", cursor: "pointer", color: "#888", width: "100%", transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#722F37"; e.currentTarget.style.color = "#722F37"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.color = "#888"; }}
      >
        + Add Category
      </button>
    </div>
  );
}
