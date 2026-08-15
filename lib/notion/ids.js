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

export const CURRENCY_PREFIX = {
  AUD: "AU$",
  USD: "US$",
  JPY: "¥",
};
