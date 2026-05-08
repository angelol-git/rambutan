import { URL } from "url";

const blockedPatterns: RegExp[] = [
  /^localhost$/,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const trackingParams = [
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
] as const;

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();
    return !blockedPatterns.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

export function normalizeUrl(input: string): string {
  const url = new URL(input);

  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || trackingParams.includes(key as (typeof trackingParams)[number])) {
      url.searchParams.delete(key);
    }
  }

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}
