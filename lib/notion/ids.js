// Notion data source IDs (collection IDs). These are stable per workspace.
// Verified against the live schema on 2026-08-15; see docs/notion-sync-plan.md.
export const DS = {
  clients: "31fbf8a6-bba6-8055-93f8-000b5d5ca1be",
  tasks: "324bf8a6-bba6-80c2-a06a-000bc8f1b3cb",
  checklist: "26c00388-9225-4299-9f67-b9982bb7848d",
  week: "10b46665-b552-4fd6-89e6-c87209f16a21",
  day: "3f35b26e-7340-4fee-832e-fafd0e04b1a1",
  budget: "126c154a-f069-4fc3-bfd8-f02cfdec5537",
  documents: "88b32931-046f-46af-8289-ad3994749697",
};

// Client Database status pipeline, in order. Drives the Overview milestones.
export const CLIENT_STATUS_PIPELINE = [
  "Onboarding",
  "Venue Locked",
  "Core Vendors Booked",
  "Guest Logistics Set",
  "Design & Run-of-Show",
  "Final Confirmations",
  "Event + Wrap",
  "Complete",
];

// Portal Hidden Tabs option name -> Dashboard tab key
export const HIDDEN_TAB_KEYS = {
  Overview: "overview",
  "Day by Day": "days",
  Decisions: "decisions",
  Tasks: "progress",
  "Master Plan": "checklist",
  Budget: "budget",
  Documents: "documents",
};

// Wedding Checklist `Client Visible` default.
//   true  = a row is shown unless Client Visible is explicitly unticked. Because a
//           Notion checkbox has no "unset" state (the API returns false for both),
//           this means the checkbox currently hides nothing. Chosen because the
//           existing 1,361 rows have never been backfilled.
//   false = a row is shown only when Client Visible is ticked (same as MIJ Tasks).
// Flip to false once the backfill is done. Can also be forced from the environment
// with CHECKLIST_VISIBLE_DEFAULT=false, no code change needed.
export const CHECKLIST_VISIBLE_DEFAULT = process.env.CHECKLIST_VISIBLE_DEFAULT !== "false";

// Wedding Checklist `Timeline` options, in display order. Unknown values sort last
// and group under "Other". Add new options here and in ChecklistTab PHASE_LABELS.
export const TIMELINE_ORDER = ["12mo", "9mo", "6mo", "4mo", "3mo", "2mo", "1mo", "Wedding Week"];

// Pseudo-clients used as templates in the Client Database. Never served as a
// portal, whatever Portal Enabled says.
export function isTemplateClient(clientName) {
  return /^\s*template/i.test(clientName ?? "");
}

export const CURRENCY_PREFIX = {
  AUD: "AU$",
  USD: "US$",
  JPY: "¥",
};
