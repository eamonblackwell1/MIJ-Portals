# Notion Sync: Plan (v2, agreed scope)

Companion to `mij-client-portal-brief.md`. Nothing here is built yet.

## Scope in one line

Everything on today's tracker ships, plus a Wedding Day run sheet and a Documents tab. Notion is the only datastore. The portal is fully read-only: zero writes back to Notion. Pilot on Olivia + Hansung.

## 0. What I verified

**Repo (current state)**
- Next.js 16 app, one route `app/[slug]/page.jsx`. Data is a single JSON blob per client in a Supabase `dashboards` table (`slug`, `couple_names`, `password_hash`, `data`).
- Every tab is fully editable in-browser (`Editable`, `NotesPanel`, add/remove buttons, status selects), saved to Supabase via `useDebouncedSave`.
- Auth is a bcrypt check in `/api/auth`, then a flag in `localStorage`. The server component ships the whole data blob to the browser *before* the password check, so the gate is cosmetic. Fixed by the rebuild.
- Per-client deployment today = a separate Vercel project with `DEFAULT_SLUG` (see `scripts/duplicate-dashboard.mjs`), plus an xlsx seeding path (`lib/masterPlanWorkbook.js`) and migration `useEffect`s in `Dashboard.jsx`. All of this goes.

**Notion (schemas read via the connector, not guessed)**

| Database | Data source ID | Relevant properties |
|---|---|---|
| Client Database | `31fbf8a6-bba6-8055-93f8-000b5d5ca1be` | Client Name (title), Ceremony Type, Ceremony Date, Ceremony Location, Travel Dates, # of Guests, Currency (AUD/USD/JPY), Budget, Planning Fee, Status (Onboarding → Venue Locked → Core Vendors Booked → Guest Logistics Set → Design & Run-of-Show → Final Confirmations → Event + Wrap → Complete), Next Action, relations to Tasks / Checklist / Week / Day |
| MIJ Tasks | `324bf8a6-bba6-80c2-a06a-000bc8f1b3cb` | Task (title), Client (relation), Owner (Ayaka/Client/Juri/Eamon/Akiko), Status (Not started/In progress/Blocked/Done), Due Date, Priority (Low/Normal/High), Category, Notes, Files & media, Triaged (checkbox) |
| Wedding Checklist | `26c00388-9225-4299-9f67-b9982bb7848d` | Item (title), Client (relation), Category, Timeline (12mo/9mo/6mo/3mo/1mo/Wedding Week), Status (Not started/In progress/Locked/N/A), Notes, Due Date (formula) |
| Wedding Week | `10b46665-b552-4fd6-89e6-c87209f16a21` | Title, Client, Day (number), Date, Description, Events, Tasks (text), Decisions Needed (text), Travel & Logistics, Accommodation, Day Status |
| Wedding Day | `3f35b26e-7340-4fee-832e-fafd0e04b1a1` | Block (title), Client, Phase (Morning/Afternoon/Evening), Start, Location, Description, Point Person, Status |

## 1. Architecture

**One app, one Vercel project, Notion is the only datastore.** Supabase, the xlsx seed, the duplicate script and per-client Vercel projects are removed. Client pages live at `/p/<slug>` on one domain (e.g. `portal.marriedinjapan.com`); `<slug>` is an opaque random string stored on the Client row, never a couple name.

**Read path.** The `/p/[slug]` server component verifies the session cookie first, then calls `lib/notion/` which runs the per-client queries (Client row + Tasks, Checklist, Week, Day, Budget Items, Documents filtered by `Client contains <page id>`) and maps them into the same `data` shape the tab components already render. Tabs keep their design and props; they lose their edit controls. Results are cached per client with `unstable_cache`, revalidating every ~2 minutes. Notion's 3 req/s limit is comfortable at 15 clients with that cache. The adapter degrades quietly: a missing property or an empty table renders an empty section, never a 500.

**Auth.** `POST /api/auth` checks the password against the Client row and sets a signed, httpOnly cookie (HMAC with `PORTAL_SECRET`) bound to that slug. No Notion data is fetched until the cookie verifies. `X-Robots-Tag: noindex` and `<meta name="robots" content="noindex">` on every portal route. Provisioning a client = filling three properties in Notion. No code change, no deploy.

**Write path: none.** The portal never writes to Notion. Couples read their open items and reply to the team over email or Slack; the team updates Notion. This avoids the failure mode where a couple ticks something done and nobody sees it. If a write-back is ever wanted later, the only candidate is "mark a Client-owned task done" and it bolts on without redesign.

**Documents.** File links do not expose Notion's signed URLs (they expire after ~1 hour). A link points at `/api/doc/<pageId>`, which checks the cookie, asks Notion for a fresh URL, and redirects. Files therefore stay behind the password. External links (Google Drive etc.) pass straight through.

**Removed from the codebase.** `Editable`, `NotesPanel`, `SaveIndicator`, `useDebouncedSave`, `lib/supabase*.js`, `lib/masterPlanWorkbook.js`, `/api/master-plan`, `scripts/`, `vanessa_jeremy_tasks.xlsx`, `@supabase/supabase-js`, `xlsx`, `bcryptjs`, all add/remove/select controls in the tabs, all migration effects. `lib/defaultData.js` stays only as a dev fixture. New dependency: `@notionhq/client`.

## 2. Tab-by-tab mapping

| Tracker section | Notion source | Notes |
|---|---|---|
| Header (names, location, dates, guests) | Client DB: Client Name, Ceremony Location, Travel Dates (fallback Ceremony Date), # of Guests | Currency symbol from `Currency`: AUD → AU$, USD → US$, JPY → ¥ |
| Overview: milestones | Client DB `Status` pipeline order | done / current / upcoming from position in the pipeline; no dates |
| Overview: "needs input" count | MIJ Tasks, Owner = Client, urgent bucket (see below) | |
| Day by Day | Wedding Week rows, sorted by `Day` | `Tasks` and `Decisions Needed` are plain text; one line per row |
| Run sheet (new) | Wedding Day rows, grouped by Phase, sorted by Start | On Day by Day, the ceremony day card gets a "View run sheet" affordance that opens a detailed view (Morning / Afternoon / Evening blocks with Start, Location, Description, Point Person, Status). Other days keep the standard card |
| Decisions ("things we need from you") | MIJ Tasks, Owner = Client | Grouped by the due-date rule below. Read only |
| Tasks | MIJ Tasks, Owner ≠ Client, Triaged = true | In progress / completed by Status. Read only |
| Master Plan | Wedding Checklist rows | Timeline → phase; Category → group; Not started / In progress / Locked → not-started / in-progress / done; N/A hidden. Owner column dropped |
| Budget | Budget Items DB (new) + Client `Budget`, `Planning Fee`, `Currency` | Estimate and Actual per line, totals for both; planning fee always the single figure from the Client row |
| Documents (new tab) | Client Documents DB (new) | Grouped by Type, links via `/api/doc/<id>` |
| Hidden tabs | Client DB `Portal Hidden Tabs` | Replaces `data.hiddenTabs` |
| Footer "last updated" | max `last_edited_time` across fetched rows | |

**Grouping rule for the Decisions tab (due-date based)**
- Needs input now: Status ≠ Done and (Due Date overdue or within 14 days)
- On the horizon: Status ≠ Done and (Due Date later than 14 days or empty)
- Resolved: Status = Done

## 3. New Notion databases and properties

All new databases go under the "Married in Japan" parent page (`296bf8a6-bba6-833a-91fc-018cf5a8405e`) and are shared with the MIJ Automation integration.

**Client Database (add properties)**
- `Portal Slug` (text): random, e.g. 10 lowercase alphanumerics
- `Portal Password` (text): plaintext, team-visible
- `Portal Enabled` (checkbox)
- `Portal Hidden Tabs` (multi-select: Overview, Day by Day, Decisions, Tasks, Master Plan, Budget, Documents)
- `Portal Budget Note` (text): free-text note shown under the budget table

**Budget Items (new)**
- `Item` (title)
- `Client` (relation → Client Database)
- `Category` (select, same options as MIJ Tasks Category)
- `Estimate` (number)
- `Actual` (number)
- `Status` (select: Researching / Quoted / Booked / Paid / Not needed)
- `Vendor` (text, optional)
- `Notes` (text, shown to couple)
- `Show on Portal` (checkbox, default on)

**Client Documents (new)**
- `Name` (title)
- `Client` (relation → Client Database)
- `Type` (select: Proposal / Contract / Venue estimate / Hotel estimate / Vendor quote / Other)
- `File` (files & media)
- `Notes` (text)
- `Show on Portal` (checkbox, default on)

**MIJ Tasks, Wedding Checklist, Wedding Week, Wedding Day**: no schema changes.

## 4. Build order

1. **Notion setup** (no code): create Budget Items and Client Documents, add the five Client Database properties, share everything with MIJ Automation, populate Olivia + Hansung with a few budget lines, documents and Client-owned tasks so there is real data to render.
2. **Adapter**: `lib/notion/` client, per-table fetchers, mapping into the existing `data` shape, cache tags. Env: `NOTION_TOKEN`, `PORTAL_SECRET`. Data source IDs as constants.
3. **Auth + routing**: `/p/[slug]`, cookie session, noindex, remove `app/page.jsx` redirect and `DEFAULT_SLUG`.
4. **Read-only tabs**: strip edit UI tab by tab, wire to adapter output; add the run sheet block to Day by Day and the Documents tab; verify against the pilot in dev.
5. **Document route**: `/api/doc/<id>` cookie-checked redirect to a fresh Notion file URL.
6. **Cleanup**: remove Supabase, xlsx, bcrypt, scripts, dead components; README with the "provision a client in Notion" checklist.
7. **Pilot review** with Eamon on Olivia + Hansung, then flip `Portal Enabled` for the rest.

## 5. Decisions already made

- Decisions and Tasks both come from MIJ Tasks; `Owner = Client` is the couple-facing list. No separate Decisions database.
- No write-backs at all. Couples respond over email or Slack; the team updates Notion. Keeps the loop visible to the team.
- Run sheet is a detailed view opened from the ceremony day card on Day by Day, not inline on every day.
- Budget lines use Estimate and Actual, not a low/high range.
- Portal password stored plaintext on the Client row (simple provisioning; visible to anyone with access to that database).
- Milestones derive from Client Status; no target dates.
- Master Plan owner column dropped.

## 6. Remaining open question

- Domain: one shared domain for all portals (`portal.marriedinjapan.com/p/<slug>`) is the assumption. Confirm, or name the domain to use.
