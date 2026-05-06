"use client";
import { useState, useEffect } from "react";

export default function Editable({ value, onChange, tag: Tag = "span", style = {}, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (editing) {
    const base = {
      ...style,
      fontFamily: style.fontFamily || "'Sen',sans-serif",
      border: "1px solid #B8977E",
      background: "rgba(184,151,126,0.06)",
      outline: "none",
      borderRadius: 0,
      width: "100%",
      padding: "6px 10px",
      boxSizing: "border-box",
    };
    if (multiline) {
      return (
        <textarea
          value={draft}
          onClick={e => e.stopPropagation()}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { setEditing(false); onChange(draft); }}
          onKeyDown={e => e.key === "Escape" && (setEditing(false), setDraft(value))}
          autoFocus
          style={{ ...base, minHeight: 70, fontSize: style.fontSize || 14, lineHeight: 1.7, resize: "vertical" }}
        />
      );
    }
    return (
      <input
        value={draft}
        onClick={e => e.stopPropagation()}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onChange(draft); }}
        onKeyDown={e => {
          if (e.key === "Enter") { setEditing(false); onChange(draft); }
          if (e.key === "Escape") { setEditing(false); setDraft(value); }
        }}
        autoFocus
        style={{ ...base, fontSize: style.fontSize || 14 }}
      />
    );
  }

  return (
    <Tag
      onClick={e => { e.stopPropagation(); setEditing(true); }}
      style={{
        ...style,
        ...(multiline ? { whiteSpace: "pre-wrap" } : {}),
        cursor: "pointer",
        borderBottom: "1px dashed transparent",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderBottomColor = "#B8977E")}
      onMouseLeave={e => (e.currentTarget.style.borderBottomColor = "transparent")}
      title="Click to edit"
    >
      {value || "Click to edit..."}
    </Tag>
  );
}
