// Tolerant property readers for Notion page objects.
// Every reader returns a sensible empty value when the property is missing,
// renamed, or of an unexpected type, so schema drift never throws.

function prop(page, name) {
  return page?.properties?.[name] ?? null;
}

function plain(richText) {
  if (!Array.isArray(richText)) return "";
  return richText.map(t => t?.plain_text ?? "").join("").trim();
}

export function text(page, name) {
  const p = prop(page, name);
  if (!p) return "";
  if (p.type === "title") return plain(p.title);
  if (p.type === "rich_text") return plain(p.rich_text);
  if (p.type === "formula") {
    const f = p.formula;
    if (f?.type === "string") return f.string ?? "";
    if (f?.type === "number") return f.number == null ? "" : String(f.number);
    if (f?.type === "date") return f.date?.start ?? "";
    if (f?.type === "boolean") return f.boolean ? "Yes" : "No";
  }
  if (p.type === "url") return p.url ?? "";
  if (p.type === "email") return p.email ?? "";
  if (p.type === "phone_number") return p.phone_number ?? "";
  return "";
}

export function number(page, name) {
  const p = prop(page, name);
  if (!p) return null;
  if (p.type === "number") return typeof p.number === "number" ? p.number : null;
  if (p.type === "formula" && p.formula?.type === "number") return p.formula.number ?? null;
  return null;
}

export function select(page, name) {
  const p = prop(page, name);
  if (!p) return "";
  if (p.type === "select") return p.select?.name ?? "";
  if (p.type === "status") return p.status?.name ?? "";
  return "";
}

export function multiSelect(page, name) {
  const p = prop(page, name);
  if (!p || p.type !== "multi_select") return [];
  return (p.multi_select ?? []).map(o => o?.name).filter(Boolean);
}

export function checkbox(page, name) {
  const p = prop(page, name);
  if (!p || p.type !== "checkbox") return false;
  return !!p.checkbox;
}

// Returns { start, end } ISO date strings, or null.
export function date(page, name) {
  const p = prop(page, name);
  if (!p) return null;
  let d = null;
  if (p.type === "date") d = p.date;
  else if (p.type === "formula" && p.formula?.type === "date") d = p.formula.date;
  if (!d?.start) return null;
  return { start: d.start, end: d.end ?? null };
}

export function relationIds(page, name) {
  const p = prop(page, name);
  if (!p || p.type !== "relation") return [];
  return (p.relation ?? []).map(r => r?.id).filter(Boolean);
}

// Files: returns [{ name, kind: "notion" | "external", url }]
// Notion-hosted URLs expire after about an hour; callers must not cache them.
export function files(page, name) {
  const p = prop(page, name);
  if (!p || p.type !== "files") return [];
  return (p.files ?? []).map(f => {
    if (f?.type === "file") return { name: f.name ?? "", kind: "notion", url: f.file?.url ?? "" };
    if (f?.type === "external") return { name: f.name ?? "", kind: "external", url: f.external?.url ?? "" };
    return null;
  }).filter(Boolean);
}

export function lastEdited(page) {
  return page?.last_edited_time ?? null;
}
