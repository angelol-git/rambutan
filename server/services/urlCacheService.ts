import { postgresDb } from "../database/db.js";

type UrlCacheRow = {
  normalized_url: string;
  source_url: string;
  content: string;
  fetched_at: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};

type UrlCacheLookupResult =
  | { success: true; urlContent: UrlCacheRow }
  | { success: false; error: string };

export async function checkURL(url: string): Promise<UrlCacheLookupResult> {
  const urlContent = await postgresDb
    .selectFrom("url_cache")
    .selectAll()
    .where("normalized_url", "=", url)
    .executeTakeFirst();

  if (!urlContent) return { success: false, error: "URL not found" };
  if (urlContent.expires_at.getTime() <= Date.now()) {
    return { success: false, error: "URL cache expired, reparse." };
  }
  return { success: true, urlContent };
}

export async function saveURLContent(
  normalizedUrl: string,
  sourceUrl: string,
  urlContent: unknown,
  fetchedAt: string,
  expiresAt: string,
): Promise<void> {
  const content =
    typeof urlContent === "string" ? urlContent : JSON.stringify(urlContent);
  await postgresDb
    .insertInto("url_cache")
    .values({
      normalized_url: normalizedUrl,
      source_url: sourceUrl,
      content,
      fetched_at: fetchedAt,
      expires_at: expiresAt,
    })
    .onConflict((oc) =>
      oc.column("normalized_url").doUpdateSet({
        source_url: sourceUrl,
        content,
        fetched_at: fetchedAt,
        expires_at: expiresAt,
        updated_at: new Date(),
      }),
    )
    .execute();
}
