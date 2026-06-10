import { Impit } from "impit";
// @ts-expect-error turndown is installed but does not provide declarations here.
import TurndownService from "turndown";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { checkURL, saveURLContent } from "./urlCacheService.js";
import { normalizeUrl } from "../utils/urlValidator.js";

const REMOVE_SELECTORS = `
  style, script, nav, footer, header, .drawer-nav, .site-header,
  .social-menu, .jump-button-group, .post-disclosure, .skip-link,
  .screen-reader-text, .faq-section, .savetherecipe,
  iframe, img, svg, picture, video, noscript, button, form, 
  aside, .ads, .sidebar, .nav-menu
`;

const URL_CACHE_TTL_DAYS = 30;

type JsonLdNode = Record<string, unknown> & {
  "@type"?: string | string[];
  "@graph"?: JsonLdNode[];
};

type UrlExtractionResult = string | JsonLdNode;

export async function getUrlContext(url: string): Promise<string> {
  const normalizedUrl = normalizeUrl(url);
  const existingURL = checkURL(normalizedUrl);

  if (existingURL.success) {
    return existingURL.urlContent.content;
  }

  const urlContent = await extractRecipeFromUrl(url);
  const contextData =
    typeof urlContent === "object"
      ? JSON.stringify(urlContent, null, 2)
      : urlContent;

  const now = new Date();
  const fetchedAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + URL_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  saveURLContent(normalizedUrl, url, urlContent, fetchedAt, expiresAt);

  return contextData;
}

export async function extractRecipeFromUrl(
  url: string,
): Promise<UrlExtractionResult> {
  const html = await fetchHtmlFromUrl(url);
  return extractRecipeFromHtml(html);
}

export async function extractJsonLdRecipeFromUrl(
  url: string,
): Promise<JsonLdNode | null> {
  const html = await fetchHtmlFromUrl(url);
  return extractJsonLdRecipeFromHtml(html);
}

export async function extractMarkdownFromUrl(url: string): Promise<string> {
  const html = await fetchHtmlFromUrl(url);
  return extractMarkdownFromHtml(html);
}

export async function fetchHtmlFromUrl(url: string): Promise<string> {
  const impit = new Impit({
    browser: "chrome",
    ignoreTlsErrors: true,
  });

  const response = await impit.fetch(url);
  return response.text();
}

export function extractRecipeFromHtml(html: string): UrlExtractionResult {
  const $ = cheerio.load(html);

  const jsonLd = parseJsonLd($);
  if (jsonLd) {
    return jsonLd;
  }

  return parseHtml($);
}

export function extractJsonLdRecipeFromHtml(html: string): JsonLdNode | null {
  const $ = cheerio.load(html);
  return parseJsonLd($);
}

export function extractMarkdownFromHtml(html: string): string {
  const $ = cheerio.load(html);
  return parseHtml($);
}

function parseJsonLd($: CheerioAPI): JsonLdNode | null {
  const scripts = $('script[type="application/ld+json"]');
  let result: JsonLdNode | null = null;

  scripts.each((_, el) => {
    try {
      const rawJson = $(el).html();
      if (!rawJson) {
        return;
      }

      const parsed = JSON.parse(rawJson) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        if (!isJsonLdNode(item)) {
          continue;
        }

        const graph = Array.isArray(item["@graph"]) ? item["@graph"] : [item];
        const recipe = graph.find(isRecipeNode);

        if (recipe) {
          result = recipe;
          return false;
        }
      }
    } catch {}
  });

  return result;
}

function parseHtml($: CheerioAPI): string {
  $(REMOVE_SELECTORS).remove();
  const bodyInnerHtml = $("body").html() ?? "";
  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });

  const markdown = turndownService.turndown(bodyInnerHtml);
  return markdown.replace(/\n\s*\n\s*\n/g, "\n\n");
}

function isJsonLdNode(value: unknown): value is JsonLdNode {
  return typeof value === "object" && value !== null;
}

function isRecipeNode(node: JsonLdNode): boolean {
  const type = node["@type"];

  if (typeof type === "string") {
    return type === "Recipe";
  }

  return Array.isArray(type) && type.includes("Recipe");
}
