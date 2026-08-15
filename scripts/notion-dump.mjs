#!/usr/bin/env node
// Dump the mapped portal payload for a Portal Slug, straight from Notion (no cache).
// Usage: node scripts/notion-dump.mjs <portal-slug> [section]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

const [slug, section] = process.argv.slice(2);
if (!slug) {
  console.error("Usage: node scripts/notion-dump.mjs <portal-slug> [section]");
  process.exit(1);
}

const { findClientBySlug, loadPortalDataUncached } = await import("../lib/notion/portal.js");
const client = await findClientBySlug(slug);
if (!client) {
  console.error(`No client with Portal Slug "${slug}"`);
  process.exit(1);
}
console.error(`Client: ${client.names} (${client.id}) enabled=${client.enabled}`);
const data = await loadPortalDataUncached(client.id);
const out = section ? data[section] : data;
console.log(JSON.stringify(out, null, 2));
