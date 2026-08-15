# MIJ Client Tracker: Notion Sync Brief

Eamon Blackwell, Married in Japan (marriedinjapan.com), Tokyo. Destination wedding planning, ~15 active clients, US/AU couples. You have full access to the tracker repo; read it before proposing anything.

## The goal

Every client already has a tracker in this repo (Vanessa + Jeremy was the first; the others were cloned from it). The design is good and DOES NOT CHANGE. The problem is the data: it is manually entered, so it is stale everywhere, and updating 15 trackers by hand is untenable. 

Make the trackers render live from our Notion workspace, so that the team works only in Notion and the trackers are simply always current. All existing tracker data can be treated as disposable; we are happy to wipe it and repopulate from Notion fresh. No migration needed.

You decide the architecture (keep per-client structure or consolidate, sync mechanism, caching, what new Notion databases are needed for data that currently lives only in the trackers, like budget line items and decisions). Propose before building. Prefer the simplest thing that works; this is a 15-client business, not a platform.

## Hard constraints (the only ones)

1. **One-way data flow.** Notion is the sole source of truth. Team edits happen in Notion, never in the tracker. The tracker keeps exactly two client-facing writes: (a) a couple responding to a "decision needed", (b) a couple ticking a task that is theirs. Both write back to the Notion row. All other edit UI in the current codebase gets stripped. Do not build bidirectional sync.
2. **Auth.** These pages show real budgets. No couple names or guessable strings in URLs, noindex, and a simple per-client password before anything renders. Provisioning a new client should not require code changes.
3. **Nothing ships to actual clients until Eamon reviews.** Build against Olivia + Hansung as the pilot.
4. **Copy rules for any client-visible strings you add:** no em dashes; never use bespoke, nestled, genuinely, honestly, straightforward; MIJ's planning fee always a single all-in figure (vendor cost line items are fine); currency display follows the client (AU$ for Australians).

## What we have and use today

- **This repo:** Next.js, deployed on Vercel, GitHub-connected. Same stack as our main site and per-client proposal sites.
- **Notion** is our operational source of truth. Relevant existing databases (verify all schemas yourself, do not guess property names):
  - Client Database — ID `31fbf8a6bba680678ac7ed9ece9df0a4`. One row per client: names, ceremony type, ceremony date, guest count, status, currency, revenue.
  - MIJ Tasks Database — ID `324bf8a6bba6802b963dc46202a89797`. Tasks with a Client relation, Owner (Eamon/Juri), Status, Due Date, Priority, Notes. Populated by the team and by an automation that turns call transcripts into tasks.
  - Wedding Checklist, Wedding Week, and Wedding Day databases also exist (IDs unknown; find and inspect them).
  - Any NEW databases you propose must be created under the shared "Married in Japan" parent page (ID `296bf8a6-bba6-833a-91fc-018cf5a8405e`) so the team can see them, and must be shared with our integration.
- **Notion API access:** we have an existing internal integration called "MIJ Automation" (token starts `ntn_`). The deployed app should use this token via env vars.
- Other systems exist (n8n automations, Slack, Supabase) but are out of scope; do not depend on them.

## First task, before any code

Walk Eamon through connecting you to Notion (Notion MCP server in Cursor), then read the actual database schemas and the tracker codebase, then come back with: (1) your proposed architecture in a few paragraphs, (2) the list of new Notion databases/properties needed and their proposed schemas, (3) build order. Get sign-off, then build.
