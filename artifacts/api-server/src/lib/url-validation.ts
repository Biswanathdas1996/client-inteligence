/**
 * Validates every HTTPS URL embedded in a generated research report.
 *
 * Gate used by POST /research: the API does not return the report JSON until
 * each unique cited URL returns HTTP 200 on verification (redirects followed;
 * final response status must be exactly 200).
 *
 * Behaviour:
 * - HEAD first; if status is not 200, GET once (many hosts reject HEAD or
 *   return misleading statuses).
 * - Success only if the final response status is exactly 200.
 * - Timeouts, DNS/TLS/network errors, and non-200 statuses are failures.
 */

const INLINE_LINK_RE =
  /\[([^\]\n]+?)\]\((https?:\/\/[^\s)]+)(?:\s+\(([^)]+)\))?\)/g;

const URL_TIMEOUT_MS = 8000;
const MAX_CONCURRENCY = 8;

const BOT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface UrlCheckFailure {
  url: string;
  status: number | null;
  reason: string;
}

export type VerifyReportUrlsResult =
  | { ok: true; checked: number }
  | { ok: false; checked: number; failures: UrlCheckFailure[] };

interface StrictCheckResult {
  ok: boolean;
  status: number | null;
  reason: string;
}

async function checkStrictHttp200(url: string): Promise<StrictCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": BOT_UA, Accept: "*/*" },
    });

    if (res.status !== 200) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": BOT_UA, Accept: "*/*" },
      });
    }

    if (res.status === 200) {
      return { ok: true, status: 200, reason: "OK" };
    }
    return {
      ok: false,
      status: res.status,
      reason: `Expected HTTP 200, got ${res.status}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const aborted =
      e instanceof Error && (e.name === "AbortError" || msg.includes("aborted"));
    return {
      ok: false,
      status: null,
      reason: aborted ? "Request timed out or aborted" : msg || "Network error",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function checkAllStrict200(
  urls: string[],
): Promise<Map<string, StrictCheckResult>> {
  const result = new Map<string, StrictCheckResult>();
  let i = 0;
  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENCY, urls.length) },
    async () => {
      while (i < urls.length) {
        const idx = i++;
        const url = urls[idx];
        const r = await checkStrictHttp200(url);
        result.set(url, r);
      }
    },
  );
  await Promise.all(workers);
  return result;
}

function collectUrls(report: unknown, into: Set<string>): void {
  if (report == null) return;
  if (typeof report === "string") {
    let m: RegExpExecArray | null;
    INLINE_LINK_RE.lastIndex = 0;
    while ((m = INLINE_LINK_RE.exec(report)) !== null) {
      into.add(m[2]);
    }
    return;
  }
  if (Array.isArray(report)) {
    for (const item of report) collectUrls(item, into);
    return;
  }
  if (typeof report === "object") {
    for (const [key, value] of Object.entries(report as Record<string, unknown>)) {
      if (typeof value === "string" && isUrlField(key) && /^https?:\/\//i.test(value)) {
        into.add(value.trim());
      }
      collectUrls(value, into);
    }
  }
}

function isUrlField(key: string): boolean {
  const lower = key.toLowerCase();
  return lower === "sourceurl" || lower === "signalsources" || lower.endsWith("url");
}

/**
 * Fails unless every extracted URL returns HTTP 200 (after redirects).
 */
export async function verifyAllReportUrlsReturn200(
  report: Record<string, unknown>,
): Promise<VerifyReportUrlsResult> {
  const urls = new Set<string>();
  collectUrls(report, urls);
  const list = Array.from(urls);
  if (list.length === 0) {
    return { ok: true, checked: 0 };
  }

  const outcomes = await checkAllStrict200(list);
  const failures: UrlCheckFailure[] = [];
  for (const url of list) {
    const r = outcomes.get(url)!;
    if (!r.ok) {
      failures.push({ url, status: r.status, reason: r.reason });
    }
  }

  if (failures.length > 0) {
    return { ok: false, checked: list.length, failures };
  }
  return { ok: true, checked: list.length };
}
