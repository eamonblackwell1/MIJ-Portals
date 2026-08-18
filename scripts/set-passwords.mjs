#!/usr/bin/env node
/**
 * Set Portal Password on every client row to lowercase femalename+malename.
 * Ordering comes from ORDER below, not from guesswork in code, so it can be audited.
 *
 * Usage: node scripts/set-passwords.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";
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

// Client Name -> password. Female first, then male, lowercase, no separator.
// Most of these follow the ordering already used in the Vercel project names.
const ORDER = {
  "Alani + Nick": "alaninick",
  "Amy + Matt": "amymatt",
  "Ashlee + Michael": "ashleemichael",
  "Cameron + Jasmyn": "jasmyncameron",
  "Chelsea + Yi": "chelseayi",
  "Daniel + Lilian": "liliandaniel",
  "Emily + Lucas": "emilylucas",
  "Georgia + Hayden": "georgiahayden",
  "Joseph + Frances": "francesjoseph",
  "Julian + Sydney": "sydneyjulian",
  "Nadia + Alex": "nadiaalex",
  "Nichole + Ryan": "nicholeryan",
  "Olivia + Hansung": "oliviahansung",
  "Sumi + Alex": "sumialex",
  "Vanessa + Jeremy": "vanessajeremy",
};

const { Client } = await import("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DS = "31fbf8a6-bba6-8055-93f8-000b5d5ca1be";
const dry = process.argv.includes("--dry");

const txt = (p, k) => {
  const x = p.properties?.[k];
  if (!x) return "";
  if (x.type === "title") return (x.title || []).map(t => t.plain_text).join("");
  if (x.type === "rich_text") return (x.rich_text || []).map(t => t.plain_text).join("");
  return "";
};

let cursor, rows = [];
do {
  const r = await notion.dataSources.query({ data_source_id: DS, page_size: 100, start_cursor: cursor });
  rows.push(...r.results);
  cursor = r.has_more ? r.next_cursor : undefined;
} while (cursor);

const out = [];
for (const page of rows) {
  const name = txt(page, "Client Name").trim();
  if (!name) continue;
  const pw = ORDER[name];
  if (!pw) { out.push({ name, pw: "NO MAPPING", slug: txt(page, "Portal Slug") }); continue; }
  if (!dry) {
    await notion.pages.update({
      page_id: page.id,
      properties: { "Portal Password": { rich_text: [{ text: { content: pw } }] } },
    });
  }
  out.push({ name, pw, slug: txt(page, "Portal Slug") });
}

out.sort((a, b) => a.name.localeCompare(b.name));
console.log(dry ? "DRY RUN\n" : "Written to Notion\n");
for (const r of out) console.log(`${r.name}\thttps://portal.marriedinjapan.com/p/${r.slug}\t${r.pw}`);
