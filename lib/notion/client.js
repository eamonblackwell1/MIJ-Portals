import { Client } from "@notionhq/client";

let client;

export function getNotion() {
  if (!client) {
    const auth = process.env.NOTION_TOKEN;
    if (!auth) throw new Error("NOTION_TOKEN is not set");
    client = new Client({ auth });
  }
  return client;
}

// Query a data source and follow pagination until exhausted.
export async function queryAll(dataSourceId, { filter, sorts } = {}) {
  const notion = getNotion();
  const results = [];
  let cursor;
  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter,
      sorts,
      page_size: 100,
      start_cursor: cursor,
    });
    results.push(...(res.results ?? []));
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return results;
}

// Rows in `dataSourceId` whose `Client` relation contains `clientPageId`.
export function queryForClient(dataSourceId, clientPageId, extra = {}) {
  const base = { property: "Client", relation: { contains: clientPageId } };
  const filter = extra.filter ? { and: [base, extra.filter] } : base;
  return queryAll(dataSourceId, { filter, sorts: extra.sorts });
}
