import { unstable_cache } from "next/cache";
import { loadPortalDataUncached } from "./portal.js";

const REVALIDATE_SECONDS = 30;

// Cached per client. Notion-hosted file URLs are deliberately NOT part of the
// cached payload (see mapDocuments in portal.js), so nothing cached here can go
// stale in a way that matters.
export function loadPortalData(clientPageId) {
  return unstable_cache(
    () => loadPortalDataUncached(clientPageId),
    ["portal-data", clientPageId],
    { revalidate: REVALIDATE_SECONDS, tags: [`client:${clientPageId}`] },
  )();
}
