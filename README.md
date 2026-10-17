# Married in Japan Client Portal

Read-only client portal rendered live from the Married in Japan Notion workspace. Next.js on Vercel. Notion is the only datastore; the portal never writes to it.

See `docs/notion-sync-plan.md` for the architecture and `docs/mij-client-portal-brief.md` for the original brief.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in NOTION_TOKEN and PORTAL_SECRET
npm run dev
```

Open `http://localhost:3000/p/<portal-slug>`.

## Environment variables

| Name | Purpose |
|---|---|
| `NOTION_TOKEN` | Internal integration token for "MIJ Automation" (starts `ntn_`). Server only. |
| `PORTAL_SECRET` | Long random string used to sign session cookies. Server only. |

Set both on the Vercel project. No other configuration is needed.

## Provision a client (no code, no deploy)

On the client's row in the Notion **Client Database**:

1. `Portal Slug`: a random lowercase string, 8 to 12 characters, letters and numbers only. Never a name. Generate one with `node -e 'console.log(require("crypto").randomBytes(8).toString("base64url").replace(/[-_]/g,"").toLowerCase().slice(0,10))'`.
2. `Portal Password`: the password the couple will type.
3. `Portal Enabled`: tick it.
4. Optional: `Portal Hidden Tabs`, `Portal Budget Note`.

Send the couple `https://<domain>/p/<slug>` and the password. Untick `Portal Enabled` to switch the portal off.

## Where each tab reads from

| Tab | Notion source | Fields shown |
|---|---|---|
| Header | Client Database | Client Name, Ceremony Location, Travel Dates (or Ceremony Date), # of Guests, Currency |
| Overview timeline | Client Database `Status` | Position in the status pipeline |
| Day by Day | Wedding Week (Client relation) | Title, Date, Description. Run sheet from Wedding Day (Start, Block, Description, Location, Point Person) |
| Decisions | MIJ Tasks, Owner = Client | Task, Priority, Due Date, Status |
| Tasks | MIJ Tasks, Owner ≠ Client, Triaged | Task, Owner, Status |
| Master Plan | Wedding Checklist (Client relation) | Item, Category, Timeline, Due Date, Status, "Your action" tag when Waiting on = Client |
| Budget | Budget Items (Client relation) + Client `Budget`, `Planning Fee`, `Currency` | Item, Category, Estimate, Actual, Status, Vendor, Notes |
| Documents | Client Documents (Client relation) | Name, Type, File or Link, Notes |

Anything not listed here (Wedding Week Events / Tasks / Decisions Needed / Travel & Logistics, Checklist Notes / Last chased / Venue deadline / Applies to / To delete, MIJ Tasks Notes) is internal and never rendered.

Data is cached per client for 30 seconds. Rows with `Hide from Portal` ticked are skipped. Checklist rows with `Status = N/A` or `To delete` ticked are skipped. MIJ Tasks rows need `Triaged` and `Client Visible` ticked. Checklist rows also need `Client Visible` ticked (governed by `CHECKLIST_VISIBLE_DEFAULT` in `lib/notion/ids.js`, `false` since the Oct 2026 backfill; `true` would show every row regardless). Clients whose name starts with `TEMPLATE` are never served.

## Debug

```bash
npm run notion:dump -- <portal-slug>            # full mapped payload
npm run notion:dump -- <portal-slug> budget     # one section
```
