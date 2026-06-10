import db from "../db.js";
import type { UrlCacheRow } from "./db.types.js";

type UrlCacheLookupResult =
  | { success: true; urlContent: UrlCacheRow }
  | { success: false; error: string };

export function checkURL(url: string): UrlCacheLookupResult {
  const urlContent = db
    .prepare("SELECT * FROM url_cache WHERE normalized_url = ?")
    .get(url) as UrlCacheRow | undefined;

  if (!urlContent) {
    return { success: false, error: "URL not found" };
  }

  const isExpired = new Date(urlContent.expires_at).getTime() <= Date.now();
  if (isExpired) {
    return { success: false, error: "URL cache expired, reparse." };
  }

  return { success: true, urlContent };
}

export function saveURLContent(
  normalizedUrl: string,
  sourceUrl: string,
  urlContent: unknown,
  fetchedAt: string,
  expiresAt: string,
): void {
  const serializedContent =
    typeof urlContent === "string" ? urlContent : JSON.stringify(urlContent);

  db.prepare(
    `INSERT INTO url_cache (
       normalized_url,
       source_url,
       content,
       fetched_at,
       expires_at,
       updated_at
     )
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(normalized_url) DO UPDATE SET
       source_url = excluded.source_url,
       content = excluded.content,
       fetched_at = excluded.fetched_at,
       expires_at = excluded.expires_at,
       updated_at = CURRENT_TIMESTAMP`,
  ).run(normalizedUrl, sourceUrl, serializedContent, fetchedAt, expiresAt);
}
