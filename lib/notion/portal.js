import { getNotion, queryAll, queryForClient } from "./client.js";
import { DS, CLIENT_STATUS_PIPELINE, HIDDEN_TAB_KEYS, CURRENCY_PREFIX } from "./ids.js";
import * as P from "./props.js";

const URGENT_WINDOW_DAYS = 14;

// ---------- Client lookup ----------

// Find the Client row by Portal Slug. Uncached: used by the auth route,
// which must see a password change straight away.
export async function findClientBySlug(slug) {
  if (!slug || !/^[a-z0-9]{6,32}$/i.test(slug)) return null;
  const rows = await queryAll(DS.clients, {
    filter: { property: "Portal Slug", rich_text: { equals: slug } },
  });
  const page = rows[0];
  if (!page) return null;
  return {
    id: page.id,
    slug,
    enabled: P.checkbox(page, "Portal Enabled"),
    password: P.text(page, "Portal Password"),
    names: P.text(page, "Client Name"),
  };
}

// ---------- Formatting helpers ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseISODate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

// "May 2, 2027"
function fmtLong(iso) {
  const d = parseISODate(iso);
  if (!d) return "";
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// "Friday, May 2"
function fmtWeekday(iso) {
  const d = parseISODate(iso);
  if (!d) return "";
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// "May 2 to 6, 2027" or "Mar 28 to Apr 2, 2027" or "May 2, 2027"
function fmtRange(range) {
  if (!range?.start) return "";
  const a = parseISODate(range.start);
  const b = parseISODate(range.end);
  if (!a) return "";
  if (!b || b.getTime() === a.getTime()) return fmtLong(range.start);
  const sameMonth = a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
  if (sameMonth) return `${MONTHS_LONG[a.getUTCMonth()]} ${a.getUTCDate()} to ${b.getUTCDate()}, ${a.getUTCFullYear()}`;
  return `${MONTHS[a.getUTCMonth()]} ${a.getUTCDate()} to ${MONTHS[b.getUTCMonth()]} ${b.getUTCDate()}, ${b.getUTCFullYear()}`;
}

function daysUntil(iso, now) {
  const d = parseISODate(iso);
  if (!d) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((d.getTime() - today) / 86400000);
}

// "1. 8am" -> { order: 1, label: "8am" }
function parseStart(s) {
  const m = /^\s*(\d+)\.\s*(.*)$/.exec(s ?? "");
  if (m) return { order: +m[1], label: m[2].trim() };
  return { order: Number.POSITIVE_INFINITY, label: (s ?? "").trim() };
}

function coupleLabelFrom(names) {
  // "Ashlee + Michael" -> "Ashlee and Michael"
  return (names ?? "").replace(/\s*[+&]\s*/g, " and ").trim();
}

function displayNames(names) {
  // "Ashlee + Michael" -> "Ashlee & Michael"
  return (names ?? "").replace(/\s*\+\s*/g, " & ").trim();
}

// ---------- Section mappers ----------

function mapMilestones(status) {
  const idx = CLIENT_STATUS_PIPELINE.indexOf(status);
  return CLIENT_STATUS_PIPELINE.map((label, i) => ({
    id: `m${i + 1}`,
    label,
    status: idx < 0 ? "upcoming" : i < idx ? "done" : i === idx ? "current" : "upcoming",
  }));
}

function mapTasks(rows, now) {
  const decisions = [];
  const inProgress = [];
  const completed = [];

  for (const page of rows) {
    const owner = P.select(page, "Owner");
    const status = P.select(page, "Status");
    const due = P.date(page, "Due Date");
    const item = {
      id: page.id,
      task: P.text(page, "Task"),
      owner,
      status,
      priority: P.select(page, "Priority"),
      category: P.select(page, "Category"),
      due: due?.start ?? null,
      dueLabel: due?.start ? fmtLong(due.start) : "",
      edited: P.lastEdited(page),
    };
    if (!item.task) continue;

    if (owner === "Client") {
      const done = status === "Done";
      const dleft = daysUntil(item.due, now);
      let bucket = "on-horizon";
      if (done) bucket = "resolved";
      else if (dleft != null && dleft <= URGENT_WINDOW_DAYS) bucket = "active";
      decisions.push({
        id: item.id,
        title: item.task,
        description: item.category || "",
        deadline: item.dueLabel,
        overdue: !done && dleft != null && dleft < 0,
        priority: item.priority === "High" ? "high" : item.priority === "Low" ? "low" : "medium",
        status: bucket,
      });
      continue;
    }

    // Team tasks: only triaged rows reach the couple.
    if (!P.checkbox(page, "Triaged")) continue;
    if (status === "Done") {
      completed.push({ id: item.id, task: item.task, date: item.edited ? fmtLong(item.edited.slice(0, 10)) : "" });
    } else if (status === "In progress" || status === "Blocked" || status === "Not started") {
      inProgress.push({ id: item.id, task: item.task, owner: owner || "Married in Japan", status });
    }
  }

  // Urgent first, then by due date; completed newest first.
  const byDue = (a, b) => (!a.deadline) - (!b.deadline);
  decisions.sort((a, b) => (a.status === "active") !== (b.status === "active") ? (a.status === "active" ? -1 : 1) : byDue(a, b));
  completed.reverse();
  return { decisions, inProgress, completed };
}

function mapDays(rows, ceremonyDate) {
  const days = rows
    .map(page => {
      const dateRange = P.date(page, "Date");
      const dayNum = P.number(page, "Day");
      const rawTitle = P.text(page, "Title");
      // Titles are stored like "Day 3 — Wedding Day"; strip the prefix, the tab shows the day label separately.
      const title = rawTitle.replace(/^\s*day\s*\d+\s*[—–:-]\s*/i, "").trim() || rawTitle;
      return {
        id: page.id,
        dayNum: dayNum ?? Number.POSITIVE_INFINITY,
        dayLabel: dayNum != null ? `Day ${dayNum}` : "",
        title,
        date: dateRange?.start ?? null,
        dateLabel: dateRange?.start ? fmtWeekday(dateRange.start) : "",
        summary: P.text(page, "Description"),
        isWeddingDay: false,
      };
    })
    .sort((a, b) => a.dayNum - b.dayNum);

  // Mark the ceremony day: by matching date first, then by title.
  let wed = ceremonyDate ? days.find(d => d.date === ceremonyDate) : null;
  if (!wed) wed = days.find(d => /wedding\s*day|ceremony/i.test(d.title));
  if (wed) wed.isWeddingDay = true;
  return days;
}

function mapRunSheet(rows) {
  return rows
    .map(page => {
      const start = parseStart(P.text(page, "Start"));
      return {
        id: page.id,
        order: start.order,
        start: start.label,
        block: P.text(page, "Block"),
        description: P.text(page, "Description"),
        location: P.text(page, "Location"),
        pointPerson: P.text(page, "Point Person"),
        phase: P.select(page, "Phase"),
        status: P.select(page, "Status"),
      };
    })
    .filter(r => r.start || r.block || r.description)
    .sort((a, b) => a.order - b.order);
}

const TIMELINE_ORDER = ["12mo", "9mo", "6mo", "3mo", "1mo", "Wedding Week"];

function mapChecklist(rows) {
  const statusMap = { "Not started": "not-started", "In progress": "in-progress", Locked: "done" };
  return rows
    .map(page => {
      const status = P.select(page, "Status");
      if (status === "N/A") return null;
      const timeline = P.select(page, "Timeline");
      const due = P.date(page, "Due Date");
      return {
        id: page.id,
        phase: timeline,
        phaseOrder: TIMELINE_ORDER.indexOf(timeline),
        category: P.select(page, "Category"),
        task: P.text(page, "Item"),
        due: due?.start ?? null,
        dueLabel: due?.start ? fmtLong(due.start) : "",
        status: statusMap[status] ?? "not-started",
      };
    })
    .filter(r => r && r.task)
    .sort((a, b) => {
      const ao = a.phaseOrder < 0 ? 99 : a.phaseOrder;
      const bo = b.phaseOrder < 0 ? 99 : b.phaseOrder;
      if (ao !== bo) return ao - bo;
      if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
      return a.category.localeCompare(b.category) || a.task.localeCompare(b.task);
    })
    .map((r, i) => ({ ...r, num: i + 1 }));
}

function mapBudget(rows) {
  return rows
    .filter(page => !P.checkbox(page, "Hide from Portal"))
    .map(page => ({
      id: page.id,
      label: P.text(page, "Item"),
      category: P.select(page, "Category"),
      estimate: P.number(page, "Estimate"),
      actual: P.number(page, "Actual"),
      status: P.select(page, "Status"),
      vendor: P.text(page, "Vendor"),
      notes: P.text(page, "Notes"),
    }))
    .filter(b => b.label);
}

function mapDocuments(rows) {
  return rows
    .filter(page => !P.checkbox(page, "Hide from Portal"))
    .map(page => {
      const f = P.files(page, "File");
      const link = P.text(page, "Link");
      return {
        id: page.id,
        name: P.text(page, "Name"),
        type: P.select(page, "Type") || "Other",
        notes: P.text(page, "Notes"),
        // External links are stable and can be sent to the browser as-is.
        // Notion-hosted files are served via /api/doc/<id>, which fetches a fresh URL.
        href: link || (f.find(x => x.kind === "external")?.url ?? ""),
        hasFile: f.some(x => x.kind === "notion"),
        fileName: f[0]?.name ?? "",
      };
    })
    .filter(d => d.name && (d.href || d.hasFile));
}

// ---------- Main entry ----------

export async function loadPortalDataUncached(clientPageId) {
  const notion = getNotion();
  const now = new Date();

  const [client, tasks, checklist, week, day, budget, documents] = await Promise.all([
    notion.pages.retrieve({ page_id: clientPageId }),
    queryForClient(DS.tasks, clientPageId),
    queryForClient(DS.checklist, clientPageId),
    queryForClient(DS.week, clientPageId),
    queryForClient(DS.day, clientPageId),
    queryForClient(DS.budget, clientPageId),
    queryForClient(DS.documents, clientPageId),
  ]);

  const names = P.text(client, "Client Name");
  const currencyCode = P.select(client, "Currency");
  const currency = CURRENCY_PREFIX[currencyCode] ?? "US$";
  const ceremony = P.date(client, "Ceremony Date");
  const travel = P.date(client, "Travel Dates");
  const guests = P.number(client, "# of Guests");
  const status = P.select(client, "Status");

  const hiddenTabs = P.multiSelect(client, "Portal Hidden Tabs")
    .map(n => HIDDEN_TAB_KEYS[n])
    .filter(Boolean);

  const { decisions, inProgress, completed } = mapTasks(tasks, now);

  const allRows = [client, ...tasks, ...checklist, ...week, ...day, ...budget, ...documents];
  const updatedISO = allRows.reduce((m, r) => (r?.last_edited_time > m ? r.last_edited_time : m), "");

  return {
    clientId: clientPageId,
    dashboardTitle: "Married in Japan",
    couple: {
      names: displayNames(names),
      location: P.text(client, "Ceremony Location"),
      date: fmtRange(travel) || fmtRange(ceremony),
      guests: guests != null ? `${guests} guests` : "",
      updated: updatedISO ? fmtLong(updatedISO.slice(0, 10)) : "",
    },
    coupleLabel: coupleLabelFrom(names),
    ceremonyDate: ceremony?.start ?? null,
    currency,
    currencyCode,
    desiredBudget: P.number(client, "Budget"),
    planningFee: P.number(client, "Planning Fee"),
    budgetNote: P.text(client, "Portal Budget Note"),
    hiddenTabs,
    milestones: mapMilestones(status),
    decisions,
    inProgress,
    completed,
    days: mapDays(week, ceremony?.start ?? null),
    runSheet: mapRunSheet(day),
    checklist: mapChecklist(checklist),
    budget: mapBudget(budget),
    documents: mapDocuments(documents),
  };
}


// Fresh signed URL for a Notion-hosted file on a Client Documents row.
// Verifies the row belongs to the given client before returning anything.
export async function getDocumentFileUrl(docPageId, clientPageId) {
  const notion = getNotion();
  const page = await notion.pages.retrieve({ page_id: docPageId });
  const owners = P.relationIds(page, "Client");
  if (!owners.includes(clientPageId)) return null;
  if (P.checkbox(page, "Hide from Portal")) return null;
  const f = P.files(page, "File");
  const notionFile = f.find(x => x.kind === "notion");
  if (notionFile?.url) return notionFile.url;
  const external = P.text(page, "Link") || f.find(x => x.kind === "external")?.url;
  return external || null;
}
