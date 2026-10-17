# Notion field guide for the client portal

Brief for an agent tidying the Married in Japan Notion workspace. The client portal at
`https://portal.marriedinjapan.com/p/<slug>` renders **live** from these databases. Notion is the
only datastore and the portal never writes back.

## The golden rule

The portal reads **only** the properties listed in this document. Everything else in Notion is
invisible to couples, so internal notes stay candid. Two fields are explicitly never rendered and
should keep being used for frank internal commentary:

- `Wedding Checklist → Notes`
- `Wedding Week → Events`, `Tasks`, `Decisions Needed`, `Travel & Logistics`, `Accommodation`

Anything a couple *does* see must be written for them. Copy rules for client-visible text:
no em dashes; never use the words bespoke, nestled, genuinely, honestly, straightforward; the MIJ
planning fee is always one all-in figure (vendor line items are fine); currency follows the client.

## Database IDs

| Database | Data source ID |
|---|---|
| Client Database | `31fbf8a6-bba6-8055-93f8-000b5d5ca1be` |
| MIJ Tasks | `324bf8a6-bba6-80c2-a06a-000bc8f1b3cb` |
| Wedding Checklist | `26c00388-9225-4299-9f67-b9982bb7848d` |
| Wedding Week | `10b46665-b552-4fd6-89e6-c87209f16a21` |
| Wedding Day | `3f35b26e-7340-4fee-832e-fafd0e04b1a1` |
| Budget Items | `126c154a-f069-4fc3-bfd8-f02cfdec5537` |
| Client Documents | `88b32931-046f-46af-8289-ad3994749697` |

---

## 1. Client Database

One row per couple. Controls the whole portal.

| Property | Type | Portal effect | Required |
|---|---|---|---|
| `Client Name` | title | Header name. `A + B` renders as `A & B` | yes |
| `Portal Slug` | text | The URL. Lowercase letters and digits, 6 to 32 chars. Never a name | yes |
| `Portal Password` | text | Login password. Format in use: lowercase femalename+malename | yes |
| `Portal Enabled` | checkbox | Unticked, the portal 404s. The off switch | yes |
| `Currency` | select | `AUD` → AU$, `USD` → US$, `JPY` → ¥. **Blank defaults to US$** | yes |
| `Status` | status | Drives the entire Overview timeline. Blank means nothing shows as current | yes |
| `Ceremony Date` | date | Identifies which Wedding Week day is the wedding day | yes |
| `Travel Dates` | date range | Header date range. Falls back to Ceremony Date | recommended |
| `Ceremony Location` | text | Header location | recommended |
| `# of Guests` | number | Header guest count | recommended |
| `Budget` | number | "Target budget" figure on the Budget tab | recommended |
| `Planning Fee` | number | Single all-in MIJ line on Budget tab. Blank hides the row | recommended |
| `Portal Budget Note` | text | Free text under the budget table. Client-facing | optional |
| `Portal Hidden Tabs` | multi-select | Hides tabs for this client | optional |

`Status` options, in pipeline order:
`Not started`, `Onboarding`, `Venue Locked`, `Core Vendors Booked`, `Guest Logistics Set`,
`Design & Run-of-Show`, `Final Confirmations`, `Event + Wrap`, `In progress`, `Complete`

`Portal Hidden Tabs` options:
`Overview`, `Day by Day`, `Decisions`, `Tasks`, `Master Plan`, `Budget`, `Documents`

`Ceremony Type` options (not rendered, but keep tidy):
`Wedding`, `Vow Renewal`, `Anniversary`, `Engagement`, `Commitment Ceremony`, `Elopement`

---

## 2. MIJ Tasks

Feeds two tabs, split by `Owner`.

- `Owner = Client` → the **Decisions** tab ("things we need from you")
- `Owner` anything else **and** `Triaged` ticked → the **Tasks** tab ("what we're working on")
- `Owner` anything else and `Triaged` unticked → **invisible to the couple**

| Property | Type | Portal effect |
|---|---|---|
| `Client` | relation | **Required.** No relation means the row belongs to nobody and is invisible |
| `Task` | title | The text couples read. Write client-facing |
| `Owner` | select | `Ayaka`, `Client`, `Juri`, `Eamon`, `Akiko` |
| `Status` | status | `Not started`, `In progress`, `Blocked`, `Done`. `Done` moves it to Resolved or Completed |
| `Due Date` | date | Overdue or within 14 days puts a Client task in "Needs input now" and lights the badge |
| `Priority` | select | `Low`, `Normal`, `High`. Badge only |
| `Category` | select | Shown as the subtitle on Decisions cards |
| `Triaged` | checkbox | Gate for team tasks reaching the Tasks tab |
| `Notes` | text | **Not rendered.** Safe for internal notes |

Transcript automation writes `[Waiting on client] …` into `Notes` while leaving `Owner` as a team
member. Any task like that should be re-owned to `Owner = Client` so it reaches the couple.

---

## 3. Wedding Checklist

The Master Plan tab. Grouped by `Timeline`.

| Property | Type | Portal effect |
|---|---|---|
| `Client` | relation | **Required** |
| `Item` | title | Visible text |
| `Timeline` | select | `12mo`, `9mo`, `6mo`, `4mo`, `3mo`, `2mo`, `1mo`, `Wedding Week`. The grouping, in that order. Any other value groups last under "Other" |
| `Status` | select | `Not started`, `In progress`, `Locked`. **`N/A` hides the row entirely** |
| `Category` | select | Shown as a column |
| `Due Date` | formula | Derived from Ceremony Date. Read only |
| `Client Visible` | checkbox | See below. Currently hides nothing |
| `Waiting on` | select | `Client` shows a small "Your action" tag on the row. `MIJ`, `Venue`, `Vendor` show nothing |
| `To delete` | checkbox | **Ticked hides the row entirely** |
| `Notes` | text | **Not rendered.** Safe for internal notes |
| `Last chased` | date | **Not rendered.** Internal |
| `Venue deadline` | date | **Not rendered.** Internal |
| `Applies to` | multi-select | **Not rendered.** Internal |

**`Client Visible` and the default flag.** The portal has one switch, `CHECKLIST_VISIBLE_DEFAULT`
in `lib/notion/ids.js` (overridable with the environment variable of the same name). While it is
`true`, which it is today, every checklist row is shown regardless of the checkbox, because the
existing rows have never been backfilled. A Notion checkbox has no "unset" state, so an unticked
box cannot be told apart from a never-touched one: with the flag on, unticking `Client Visible` does
**not** hide a row. Use `Status = N/A` or `To delete` for that. Once the backfill is done, flip the
flag to `false` and the checklist behaves like MIJ Tasks: only ticked rows reach the couple.

Standard set is 85 rows per client. Rows naming internal MIJ logistics, for example
"Book MIJ team travel", are better set to `N/A` or reworded, since couples see the `Item` text.

---

## 4. Wedding Week

The Day by Day tab. **Only four fields reach the couple.**

| Property | Type | Portal effect |
|---|---|---|
| `Client` | relation | **Required** |
| `Day` | number | Ordering, 1, 2, 3 |
| `Title` | title | Day heading. A `Day 3 — ` prefix is stripped automatically |
| `Date` | date | Shown as "Sunday, Mar 28" |
| `Description` | text | **The only body text couples see.** Must be written for them |
| `Events`, `Tasks`, `Decisions Needed`, `Travel & Logistics`, `Accommodation`, `Day Status` | | **Not rendered.** Internal |

`Description` is the highest-value cleanup in the workspace. Write two or three sentences saying
what happens that day, in the couple's voice. No internal shorthand (no "agreed WA 7/2", no
"promised at onboarding"), no vendor negotiations, no blame.

---

## 5. Wedding Day

The run sheet, opened from the ceremony day on Day by Day.

| Property | Type | Portal effect |
|---|---|---|
| `Client` | relation | **Required** |
| `Start` | text | Time label. **Keep the `1. 8am`, `2. 11am` numbering**, it is what orders the timeline |
| `Description` | text | What happens |
| `Block` | title | Optional heading above the description |
| `Location`, `Point Person` | text | Shown when filled |
| `Phase` | select | `1. Morning`, `Afternoon`, `Evening`. Groups the run sheet when set |
| `Status` | select | `Not started`, `In progress`, `Locked` |

---

## 6. Budget Items

The Budget tab. Everything except `Hide from Portal` is shown.

| Property | Type | Portal effect |
|---|---|---|
| `Client` | relation | **Required** |
| `Item` | title | Line label |
| `Estimate` | number | Estimate column |
| `Actual` | number | Actual column, bolded. Drives "Confirmed so far" |
| `Status` | select | `Researching`, `Quoted`, `Booked`, `Paid`, `Not needed` |
| `Category` | select | Subtitle |
| `Vendor` | text | Subtitle |
| `Notes` | text | **Shown to the couple.** Unlike Notes elsewhere |
| `Hide from Portal` | checkbox | Tick to keep a line internal |

Amounts must be in the client's `Currency`, since the portal only prefixes a symbol and does not
convert. Do not add a planning fee line here; that comes from `Client Database → Planning Fee`.

**Gotcha:** Budget Items `Category` uses plain hyphens (`Attire - Bride`, `Attire - Groom`) whereas
MIJ Tasks and Wedding Checklist use em dashes (`Attire — Bride`). Writing the wrong variant fails.

---

## 7. Client Documents

The Documents tab.

| Property | Type | Portal effect |
|---|---|---|
| `Client` | relation | **Required** |
| `Name` | title | Link label |
| `Type` | select | `Proposal`, `Contract`, `Venue estimate`, `Hotel estimate`, `Vendor quote`, `Other`. Groups the tab |
| `File` | files | Upload. Served through a signed, expiring link behind the password |
| `Link` | url | Use instead of `File` for Google Drive or other external links |
| `Notes` | text | **Shown to the couple** |
| `Hide from Portal` | checkbox | Tick to keep a document internal |

A row needs either `File` or `Link`, otherwise it is skipped.

---

## Current gaps, in priority order

As of 18 Aug 2026, across 15 clients.

**1. Currency, 13 clients blank.** Their budgets currently render as US$. Set `AUD`, `USD` or `JPY`
on every row. Only Ashlee + Michael (AUD) and Chelsea + Yi (USD) are set.

**2. Status, 10 clients blank.** Their Overview timeline shows no current stage. Set the pipeline
stage that matches reality.

**3. Planning Fee, all 15 blank.** No planning fee line appears on any Budget tab.

**4. Budget, 14 blank.** No target budget figure. Only Ashlee + Michael has one (12000).

**5. Budget Items, 11 rows in total, all for Joseph + Frances.** Every other client's Budget tab
says "being prepared".

**6. Client Documents, zero rows workspace-wide.** Every Documents tab is empty.

**7. Wedding Week Descriptions: 40 rows exist, 28 have no Description at all**, and several of the
12 that do are written internally. Clients with rows: Cameron + Jasmyn 14, Nichole + Ryan 9,
Joseph + Frances 8, Alani + Nick 5, Ashlee + Michael 3, Emily + Lucas 1.

**8. Triaged: 545 team tasks exist, only 113 are ticked.** So most clients' Tasks tab is nearly
empty. Either tick `Triaged` on tasks worth showing, or the filter gets dropped in code.

**9. Missing basics:** Chelsea + Yi and Olivia + Hansung have no Ceremony Date, Ceremony Location
or guest count. Olivia + Hansung also has zero tasks.

**10. Wedding Day run sheets exist for only 4 clients** (Nichole + Ryan 34, Alani + Nick 17,
Amy + Matt 9, Ashlee + Michael 8). Others have no run sheet, so the button does not appear.

**11. Julian + Sydney is `Complete` with no rows anywhere.** Confirm whether their portal should be
switched off via `Portal Enabled`.

---

## Failure modes to avoid

- **Missing `Client` relation** is the single biggest one. A row without it is invisible on every
  portal and looks like data loss.
- **Renaming a property** makes that section silently render blank rather than erroring. Load one
  portal after any schema change.
- **Invalid select values** are rejected by the API. Copy the exact strings from this document.
- **`N/A`** on a checklist row hides it completely, which is a feature, not a bug.
- Changing `Portal Slug` **immediately breaks** any link already sent to that couple.
- A Client Database row whose `Client Name` starts with `TEMPLATE` is never served as a portal,
  even with `Portal Enabled` ticked, and the provisioning script skips it.

## Verifying a change

Data is cached for 30 seconds, so a Notion edit appears on the portal within about a minute.
`Portal Password` and `Portal Enabled` are checked fresh on every login, so those take effect
immediately.
