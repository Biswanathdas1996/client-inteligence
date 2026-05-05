/**
 * Validates every HTTPS URL embedded in a generated research report.
 *
 * Gate used by POST /research: the API does not return the report JSON until
 * each unique cited URL returns a successful HTTP status after verification
 * (redirects followed; final status must be 2xx, i.e. 200–299).
 *
 * Behaviour:
 * - HEAD first; if status is not 2xx, GET once (many hosts reject HEAD or
 *   return misleading statuses).
 * - Success if the final response status is 200–299.
 * - Up to 3 attempts per URL with short backoff on network errors, 429, 502/503/504.
 * - After a minimal GET fails with 401/403/405, one browser-like GET is attempted.
 */

const INLINE_LINK_RE =
  /\[([^\]\n]+?)\]\((https?:\/\/[^\s)]+)(?:\s+\(([^)]+)\))?\)/g;

const URL_TIMEOUT_MS = 8000;
const MAX_CONCURRENCY = 8;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

const BOT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Some hosts return 403/401 to minimal bot requests but accept a browser-like document fetch. */
const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

const browserLikeHeaders = (): Record<string, string> => ({
  "User-Agent": BOT_UA,
  Accept: BROWSER_ACCEPT,
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

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

function isHttp2xx(status: number): boolean {
  return status >= 200 && status < 300;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetryStatus(status: number | null): boolean {
  if (status == null) return true;
  return (
    status === 429 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

async function checkUrlOnce(url: string): Promise<StrictCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": BOT_UA, Accept: "*/*" },
    });

    if (!isHttp2xx(res.status)) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": BOT_UA, Accept: "*/*" },
      });
    }

    if (isHttp2xx(res.status)) {
      return { ok: true, status: res.status, reason: "OK" };
    }

    // Paywalled / bot-managed sites sometimes block minimal fetches but allow a browser-like GET.
    if (res.status === 401 || res.status === 403 || res.status === 405) {
      const res2 = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: browserLikeHeaders(),
      });
      if (isHttp2xx(res2.status)) {
        return { ok: true, status: res2.status, reason: "OK" };
      }
      return {
        ok: false,
        status: res2.status,
        reason: `Expected HTTP 2xx, got ${res2.status}`,
      };
    }

    return {
      ok: false,
      status: res.status,
      reason: `Expected HTTP 2xx, got ${res.status}`,
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

async function checkUrlWithRetries(url: string): Promise<StrictCheckResult> {
  let last: StrictCheckResult = {
    ok: false,
    status: null,
    reason: "No attempt",
  };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    last = await checkUrlOnce(url);
    if (last.ok) return last;
    if (attempt < MAX_ATTEMPTS && shouldRetryStatus(last.status)) {
      await sleep(RETRY_DELAY_MS * attempt);
      continue;
    }
    break;
  }
  return last;
}

async function checkAll2xx(
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
        const r = await checkUrlWithRetries(url);
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
 * Fails unless every extracted URL returns HTTP 2xx (after redirects).
 */
export async function verifyAllReportUrlsReturn2xx(
  report: Record<string, unknown>,
): Promise<VerifyReportUrlsResult> {
  const urls = new Set<string>();
  collectUrls(report, urls);
  const list = Array.from(urls);
  if (list.length === 0) {
    return { ok: true, checked: 0 };
  }

  const outcomes = await checkAll2xx(list);
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
