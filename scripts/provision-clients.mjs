#!/usr/bin/env node
/**
 * Give every client row a Portal Slug and Portal Password, and switch Portal Enabled on.
 * Existing values are never overwritten. Prints the full list at the end.
 *
 * Usage: node scripts/provision-clients.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (process.env[k] === undefined) process.env[k] = v;
}

const { Client } = await import("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DS = "31fbf8a6-bba6-8055-93f8-000b5d5ca1be";
const dry = process.argv.includes("--dry");

// Slug alphabet omits look-alike characters so a slug can be read aloud if needed.
const SLUG_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
const WORDS = [
  "sakura", "momiji", "hinoki", "kokoro", "hikari", "tsuki", "yuki", "umi",
  "mori", "kaze", "hoshi", "niji", "sora", "hana", "kumo", "ume",
];

const pick = (arr) => arr[crypto.randomInt(arr.length)];
const slug = () => Array.from({ length: 10 }, () => SLUG_CHARS[crypto.randomInt(SLUG_CHARS.length)]).join("");
const password = () => `${pick(WORDS)}-${pick(WORDS)}-${crypto.randomInt(100, 999)}`;

const txt = (p, k) => {
  const x = p.properties?.[k];
  if (!x) return "";
  if (x.type === "title") return (x.title || []).map(t => t.plain_text).join("");
  if (x.type === "rich_text") return (x.rich_text || []).map(t => t.plain_text).join("");
  return "";
};
const chk = (p, k) => !!p.properties?.[k]?.checkbox;
const sel = (p, k) => p.properties?.[k]?.select?.name ?? p.properties?.[k]?.status?.name ?? "";

let cursor, rows = [];
do {
  const r = await notion.dataSources.query({ data_source_id: DS, page_size: 100, start_cursor: cursor });
  rows.push(...r.results);
  cursor = r.has_more ? r.next_cursor : undefined;
} while (cursor);

const used = new Set(rows.map(p => txt(p, "Portal Slug")).filter(Boolean));
const out = [];

for (const page of rows) {
  const name = txt(page, "Client Name");
  if (!name) continue;
  let s = txt(page, "Portal Slug");
  let pw = txt(page, "Portal Password");
  const wasEnabled = chk(page, "Portal Enabled");
  const props = {};

  if (!s) {
    do { s = slug(); } while (used.has(s));
    used.add(s);
    props["Portal Slug"] = { rich_text: [{ text: { content: s } }] };
  }
  if (!pw) {
    pw = password();
    props["Portal Password"] = { rich_text: [{ text: { content: pw } }] };
  }
  if (!wasEnabled) props["Portal Enabled"] = { checkbox: true };

  if (Object.keys(props).length && !dry) {
    await notion.pages.update({ page_id: page.id, properties: props });
  }
  out.push({
    name,
    slug: s,
    password: pw,
    changed: Object.keys(props),
    currency: sel(page, "Currency") || "(not set)",
    status: sel(page, "Status") || "(not set)",
  });
}

out.sort((a, b) => a.name.localeCompare(b.name));
console.log(dry ? "DRY RUN, nothing written\n" : "Written to Notion\n");
console.log(["CLIENT", "URL", "PASSWORD", "CURRENCY", "STATUS"].join("\t"));
for (const r of out) {
  console.log([r.name, `https://portal.marriedinjapan.com/p/${r.slug}`, r.password, r.currency, r.status].join("\t"));
}
const touched = out.filter(r => r.changed.length);
console.log(`\n${touched.length} of ${out.length} rows updated.`);
