/**
 * POST to the PwC Gen AI shared service chat completions endpoint via fetch.
 * Endpoint: POST `…/chat/completions`, with Bearer + `x-api-key` headers.
 */

export type ChatCompletionRole = "system" | "user" | "assistant";

export interface ChatCompletionMessage {
  role: ChatCompletionRole;
  content: string;
}

export interface FetchPwCChatCompletionOptions {
  /** Host or full URL, e.g. `https://genai-sharedservice-americas.pwc.com` */
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatCompletionMessage[];
  maxTokens?: number;
  temperature?: number;
}

/** Resolves POST URL: PwC endpoint is `…/chat/completions`. */
export function resolvePwCCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    throw new Error(`Invalid base URL: ${baseUrl}`);
  }

  let path = u.pathname.replace(/\/+$/, "");
  if (path === "") path = "/";

  if (path.endsWith("/chat/completions")) {
    // Already correct — keep as-is
    u.pathname = path;
  } else if (path.endsWith("/completions")) {
    // Has /completions but missing /chat prefix — fix it
    u.pathname = path.replace(/\/completions$/, "/chat/completions");
  } else if (path === "/") {
    u.pathname = "/chat/completions";
  } else {
    u.pathname = `${path}/chat/completions`;
  }
  u.search = "";
  u.hash = "";
  return u.toString();
}

function summarizeErrorBody(status: number, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return `(empty body, HTTP ${status})`;

  try {
    const data = JSON.parse(trimmed) as unknown;
    if (data && typeof data === "object" && "error" in data) {
      return JSON.stringify((data as { error: unknown }).error).slice(0, 800);
    }
    if (data && typeof data === "object" && "message" in data) {
      return String((data as { message: unknown }).message).slice(0, 800);
    }
    return JSON.stringify(data).slice(0, 800);
  } catch {
    return trimmed.slice(0, 800);
  }
}

/**
 * Calls PwC Gen AI. Avoids `response_format` and other fields that some APIM layers
 * reject with HTTP 403 / "fault filter abort".
 */
export async function fetchPwCChatCompletion(
  options: FetchPwCChatCompletionOptions,
): Promise<string> {
  const url = resolvePwCCompletionsUrl(options.baseUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.apiKey}`,
    "x-api-key": options.apiKey,
  };

  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    max_tokens: options.maxTokens ?? 8192,
  };
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const raw = await res.text();

  if (!res.ok) {
    const summary = summarizeErrorBody(res.status, raw);
    throw new Error(`Chat completion failed (HTTP ${res.status}): ${summary}`);
  }

  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(
      `Chat completion returned non-JSON (HTTP ${res.status}): ${raw.slice(0, 400)}`,
    );
  }

  const choice = (
    data as {
      choices?: Array<{ message?: { content?: string | null } }>;
    }
  ).choices?.[0];
  const content =
    typeof choice?.message?.content === "string"
      ? choice.message.content.trim()
      : "";

  if (!content) throw new Error("Empty response from model");

  return content;
}
