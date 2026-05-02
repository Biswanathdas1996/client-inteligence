import { Router, type IRouter } from "express";
import { GenerateResearchBody } from "@workspace/api-zod";
import {
  fetchPwCChatCompletion,
  resolvePwCCompletionsUrl,
} from "../lib/chat-completions-fetch";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an enterprise research and solution-mapping agent built for PwC consultants.
Your job is to produce executive-ready, consulting-grade client intelligence reports based on user-provided inputs.

Operating principles:
- Reason at PwC GenAI quality. Be precise, current, and business-oriented.
- Maintain a consulting tone — clear, structured, quantified where possible, never buzzwordy.
- Distinguish facts, trends, and inferred insights. State assumptions explicitly when data is incomplete.
- Prefer earnings calls, annual/quarterly reports, press releases, analyst commentary, regulatory filings, and credible news sources for grounding.
- For peer selection, justify based on industry, geography, size, and business model.
- For pain points, derive them from concrete signals; map each one to a buyer persona and business function.
- For AI solution recommendations, FIRST search the user-supplied Knowledge Base (KB) and only recommend KB items that genuinely match an identified pain point. If no KB item fits a pain point, recommend an industry-standard external AI solution and label its source as "external".
- Every recommended solution must include: the problem addressed, how AI helps, expected business impact (cost / revenue / risk / speed / quality), and the primary buyer persona.
- Build a final Mapping table linking each pain point to its recommended solution and the resulting business value.

RECENCY (NON-NEGOTIABLE):
- Today's date is provided in the user prompt. Treat anything older than ~12 months as STALE for financial figures, and anything older than ~6 months as STALE for strategic initiatives, leadership, M&A and market signals.
- For every number you cite (revenue, growth, margin, market cap, headcount, etc.) it MUST be the latest reported value as of today. Quote the reporting period explicitly (e.g., "FY2025 (year ended ...)" or "Q4 2025"). If the latest value cannot be located, say so in "assumptions" — do not silently fall back to older numbers.
- Comments / quotes / commentary attributed to executives or analysts must be from the most recent earnings call, press release, or news article available.

SOURCE AUTHENTICITY (TIERED, NEVER LEAVE A SECTION EMPTY):
- Try sources in this order and use the FIRST tier that produces a defensible URL for each fact. Do NOT skip straight to the lowest tier — exhaust the higher tier first.
  Tier A (strict, preferred): government / regulator domains (sec.gov, *.gov, *.gov.in, *.gov.uk, europa.eu, rbi.org.in, sebi.gov.in, bseindia.com, nseindia.com), the company's own official site / IR / press / newsroom pages, top-tier business news (Bloomberg, Reuters, FT, WSJ, The Economist, CNBC, Nikkei Asia, Business Standard, Mint, Economic Times), primary filings (10-K, 10-Q, 20-F, annual reports, prospectuses).
  Tier B (broader credible, fallback): established industry analysts (Gartner, IDC, McKinsey, Deloitte, BCG, S&P, Moody's, Fitch), Forbes, Fortune, Barron's, Moneycontrol, regional / trade press, Seeking Alpha author articles.
  Tier C (last resort): any credible publicly indexed page that directly supports the claim.
- NEVER cite, at any tier: blog spam, content farms, SEO listicles, AI-generated summaries, Wikipedia, Statista preview pages, Macrotrends, or pure aggregators that don't link to a primary source.
- When a figure or claim relies on Tier B or Tier C, mark it inline by appending " (broader-web)" to the link label, e.g. "[$3.4B FY2024 (broader-web)](https://...)". Tier A links need no marker.
- Every URL must be a real, working HTTPS deep link to the page substantiating the claim — not a generic homepage.
- If even Tier C fails for a specific number, omit just that number (not the surrounding section), state the gap in "assumptions", and proceed.

INLINE HYPERLINK CITATION FORMAT (NON-NEGOTIABLE):
- Every number, statistic, named fact, dated event, named executive, named peer financial, and direct quote that appears anywhere in the JSON's STRING FIELDS must be wrapped as an inline Markdown hyperlink: [the exact phrase](https://authoritative-source/...). Example: "Revenue rose to [$45.2B in FY2025](https://investor.acme.com/.../press-release.htm), up [12% YoY](https://www.reuters.com/...)."
- This applies to: executiveSummary, companySnapshot.description, financialMetrics[].value, financialMetrics[].trend, peers[].rationale, peers[].revenueGrowth, peers[].margin, peers[].strength, peers[].weakness, topicFindings[].summary, topicFindings[].signals[], painPoints[].description, painPoints[].evidence, solutions[].businessImpact, solutions[].howAiHelps, mapping[].businessValue.
- The structured per-row "sourceUrl" and "signalSources" fields are still required — keep them populated AND additionally embed inline links inside the prose.
- Do NOT use bare URLs, footnote-style "[1]" markers, or "(source: ...)" parentheticals. Use ONLY the [label](url) Markdown form.

Output: ONLY a single JSON object that strictly matches the provided schema. Do not wrap it in code fences. Do not include commentary outside the JSON.`;

const RESPONSE_SCHEMA_HINT = `Return JSON shaped as:
{
  "companyName": string,
  "country": string,
  "persona": string | null,
  "generatedAt": ISO-8601 string,
  "executiveSummary": string (3-6 sentences, board-ready),
  "companySnapshot": {
    "description": string,
    "revenueStreams": string[] (3-6 items),
    "financialMetrics": [{"label": string, "value": string, "trend": string, "sourceUrl": string (REQUIRED — real URL to source)}] (4-7 items: revenue, growth, net income/margin, market cap or equivalent, etc.),
    "strategicInitiatives": string[] (3-6 recent initiatives, M&A, restructurings)
  },
  "peers": [{"name": string, "rationale": string, "revenueGrowth": string, "margin": string, "strength": string, "weakness": string, "sourceUrl": string (REQUIRED — URL to source for peer financial data)}] (3-5 peers),
  "topicFindings": [{"topic": string, "summary": string (2-3 sentences), "sourceUrl": string (REQUIRED — URL to primary source for this finding), "signals": string[] (3-5 evidence-based signals), "signalSources": string[] (REQUIRED — one URL per signal, same order as signals array)}] (one per requested topic),
  "painPoints": [{"title": string, "description": string (the WHY: 2-3 sentences explaining why this is a real challenge for the company today, with the specific business consequence), "evidence": string (the WHERE-IT-CAME-FROM: name the exact source artefact and the specific quote or data point that surfaced this challenge — e.g. "Q3 FY2025 earnings call (Oct 28 2025): CFO flagged supply-chain disruption costing ~$120M in inventory write-downs" or "10-K Risk Factors section, page 24: company discloses ongoing legacy-IT modernisation gap". The string MUST contain at least one inline Markdown link [exact phrase](deep-url) to the primary artefact (filing PDF, earnings transcript, press release, regulator notice, or news article) — never just a homepage), "sourceUrl": string (REQUIRED — same primary-artefact URL as a clean field, used for the "Reference" badge in the UI), "persona": string, "businessFunction": string}] (4-7 pain points; each pain point MUST be derivable from a concrete, dated, sourced signal — do not invent generic challenges),
  "solutions": [{"name": string, "source": "knowledge_base" | "external", "problem": string, "howAiHelps": string, "businessImpact": string, "persona": string, "painPointTitle": string (must match a painPoints[].title), "sourceUrl": string (URL to solution reference or vendor page)}] (one or more per pain point; prefer KB matches when supplied),
  "mapping": [{"painPoint": string, "solution": string, "businessValue": string}] (one row per (painPoint, solution) pair),
  "assumptions": string[] (call out any data limitations or assumptions made, including cases where source URLs are best-available estimates)
}

CRITICAL: Every "sourceUrl" field must be a real, working HTTPS deep link to the page that substantiates the claim (not a homepage). Cascade through Tier A → Tier B → Tier C as defined in the system prompt; only Tier B/C URLs need the inline "(broader-web)" marker. Do NOT use placeholder text like "N/A". In addition to "sourceUrl", every numeric or factual phrase inside the prose strings (executiveSummary, descriptions, evidence, signals, businessImpact, etc.) MUST be wrapped as an inline Markdown link: [the exact phrase](https://...). Empty sections are NOT acceptable — fall back to broader-web sources before omitting. A report with bare numbers (no inline [text](url) links) or with empty required sections is a FAILURE and must be regenerated.`;

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0]?.trim() || undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

interface PerplexityCitation {
  title?: string;
  url?: string;
}

type PerplexityTier = "strict" | "broad" | "wide";

type PerplexityResult =
  | {
      ok: true;
      text: string;
      citations: PerplexityCitation[];
      tier: PerplexityTier;
      tierAttempts: Array<{ tier: PerplexityTier; reason: string }>;
    }
  | { ok: false; detail: string };

/** Perplexity Sonar chat API — POST https://api.perplexity.ai/chat/completions */
const PERPLEXITY_CHAT_URL = "https://api.perplexity.ai/chat/completions";

/**
 * Tier-1 allowlist: regulators + top-tier global/Indian business newswires.
 * Perplexity caps `search_domain_filter` at 10 entries.
 */
const PERPLEXITY_DOMAIN_ALLOWLIST_STRICT = [
  "sec.gov",
  "bseindia.com",
  "nseindia.com",
  "reuters.com",
  "bloomberg.com",
  "ft.com",
  "wsj.com",
  "cnbc.com",
  "economist.com",
  "businessstandard.com",
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/** MM/DD/YYYY format required by Perplexity's search_after_date_filter. */
function dateMinusMonths(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

interface PerplexityCallOptions {
  domainFilter?: string[];
  afterDate?: string;
  systemPrompt: string;
  query: string;
}

interface PerplexityCallOutcome {
  ok: boolean;
  text: string;
  citations: PerplexityCitation[];
  detail?: string;
}

async function callPerplexityOnce(
  apiKey: string,
  opts: PerplexityCallOptions,
): Promise<PerplexityCallOutcome> {
  try {
    const body: Record<string, unknown> = {
      model: "sonar-pro",
      messages: [
        { role: "system", content: opts.systemPrompt },
        { role: "user", content: opts.query },
      ],
      temperature: 0.2,
      return_citations: true,
    };
    if (opts.afterDate) body.search_after_date_filter = opts.afterDate;
    if (opts.domainFilter && opts.domainFilter.length > 0) {
      body.search_domain_filter = opts.domainFilter;
    }

    const res = await fetch(PERPLEXITY_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    if (!res.ok) {
      const hint = raw.trim().slice(0, 400);
      return {
        ok: false,
        text: "",
        citations: [],
        detail: `HTTP ${res.status}${hint ? `: ${hint}` : ""}`,
      };
    }

    let data: {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
      search_results?: Array<{ title?: string; url?: string }>;
    };
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      return {
        ok: false,
        text: "",
        citations: [],
        detail: `Response was not valid JSON: ${raw.slice(0, 200)}`,
      };
    }

    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    const citations: PerplexityCitation[] =
      data.search_results?.map((r) => ({ title: r.title, url: r.url })) ??
      data.citations?.map((url) => ({ url })) ??
      [];
    if (!text) {
      return { ok: false, text: "", citations: [], detail: "Empty assistant message in response" };
    }
    return { ok: true, text, citations };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, text: "", citations: [], detail: msg };
  }
}

/**
 * "Thin" = the model returned text but didn't actually find substantive evidence.
 * Detect via short prose AND/OR very few citations AND/OR explicit "no data" hedges.
 * The thresholds are intentionally generous — we'd rather widen the search and
 * end up with a slightly broader source than ship an empty section.
 */
function isThinResult(out: PerplexityCallOutcome): boolean {
  if (!out.ok) return true;
  const text = out.text || "";
  if (text.length < 400) return true;
  if (out.citations.length < 3) return true;
  const hedges = [
    /no (?:public|recent|specific) (?:data|information|figures?)/i,
    /could not (?:find|locate|verify)/i,
    /unable to (?:find|locate|verify)/i,
    /information is not (?:publicly )?available/i,
    /no (?:results?|sources?) (?:were |was )?(?:found|returned|available)/i,
  ];
  return hedges.some((re) => re.test(text));
}

async function fetchPerplexityContext(
  apiKey: string,
  query: string,
): Promise<PerplexityResult> {
  const today = todayIsoDate();
  const tierAttempts: Array<{ tier: PerplexityTier; reason: string }> = [];

  // ---- Tier 1: strict — curated allowlist + 12-month recency window ------
  const strictPrompt = `You are a research assistant for PwC consultants. Today's date is ${today}.
Return concise, factual, source-grounded findings using ONLY the LATEST available data as of today.
Hard rules:
- Every quoted number (revenue, growth, margin, market cap, headcount) must be the most recently reported figure available; always state the reporting period (e.g., "FY2025", "Q1 2026").
- Cite ONLY authoritative sources: regulator filings (SEC, BSE, NSE, RBI, SEBI), the company's own official site / investor-relations pages / press releases, or top-tier business news (Reuters, Bloomberg, FT, WSJ, CNBC, The Economist, Business Standard, Mint, Economic Times, Nikkei). Do NOT cite Wikipedia, blogs, content farms, Statista preview pages, Macrotrends, or AI summaries.
- For every fact, attach the direct URL to the page that substantiates it (not a homepage). Use bullet points.`;

  const strict = await callPerplexityOnce(apiKey, {
    domainFilter: PERPLEXITY_DOMAIN_ALLOWLIST_STRICT,
    afterDate: dateMinusMonths(12),
    systemPrompt: strictPrompt,
    query,
  });
  tierAttempts.push({
    tier: "strict",
    reason: strict.ok
      ? `text=${strict.text.length}ch, citations=${strict.citations.length}`
      : `failed: ${strict.detail}`,
  });
  if (strict.ok && !isThinResult(strict)) {
    return { ok: true, text: strict.text, citations: strict.citations, tier: "strict", tierAttempts };
  }

  // ---- Tier 2: broaden sources but keep recency -------------------------
  // Drop the hard 10-domain allowlist; rely on prompt-level rules to keep
  // results credible. This catches: company IR pages on bespoke domains,
  // additional regional news (Mint, Economic Times, Nikkei, Forbes, etc.),
  // and trade-press coverage of niche companies.
  const broadPrompt = `You are a research assistant for PwC consultants. Today's date is ${today}.
The strict-allowlist search returned thin results. Widen to ANY credible business / regulator / industry source — but still reject Wikipedia, content farms, low-quality blogs, AI-generated summaries, Statista preview pages, and Macrotrends.
Acceptable: company IR / press / investor pages, regulator filings worldwide, established business news (Reuters, Bloomberg, FT, WSJ, CNBC, Economist, Business Standard, Mint, Economic Times, Nikkei, Forbes, Fortune, Barron's, Seeking Alpha author articles, Moneycontrol, LiveMint), industry analyst notes (Gartner, IDC, McKinsey, Deloitte, BCG, S&P, Moody's, Fitch), trade publications.
Still required:
- Latest reported figures only — state the reporting period.
- Direct deep-link URL for every fact (not a homepage).
- Bullet points.`;

  const broad = await callPerplexityOnce(apiKey, {
    domainFilter: undefined,
    afterDate: dateMinusMonths(12),
    systemPrompt: broadPrompt,
    query,
  });
  tierAttempts.push({
    tier: "broad",
    reason: broad.ok
      ? `text=${broad.text.length}ch, citations=${broad.citations.length}`
      : `failed: ${broad.detail}`,
  });
  if (broad.ok && !isThinResult(broad)) {
    return { ok: true, text: broad.text, citations: broad.citations, tier: "broad", tierAttempts };
  }

  // ---- Tier 3: drop recency too — last-resort whole-web search ----------
  // For some companies (private, regional, niche) the latest filing is older
  // than 12 months; let any vintage through but still demand a working URL.
  const widePrompt = `You are a research assistant for PwC consultants. Today's date is ${today}.
Earlier searches returned insufficient data. Search the entire credible web with no recency limit. Still reject Wikipedia, content farms, AI summaries, Statista previews, and Macrotrends.
For every figure: state the reporting period explicitly and clearly mark it as "(latest available — may pre-date last 12 months)" if older. Provide a direct deep-link URL for every fact. Use bullet points.`;

  const wide = await callPerplexityOnce(apiKey, {
    domainFilter: undefined,
    afterDate: undefined,
    systemPrompt: widePrompt,
    query,
  });
  tierAttempts.push({
    tier: "wide",
    reason: wide.ok
      ? `text=${wide.text.length}ch, citations=${wide.citations.length}`
      : `failed: ${wide.detail}`,
  });
  if (wide.ok) {
    return { ok: true, text: wide.text, citations: wide.citations, tier: "wide", tierAttempts };
  }

  // All three tiers failed. Return whichever succeeded with content (even if thin),
  // else surface the last error.
  if (broad.ok) {
    return { ok: true, text: broad.text, citations: broad.citations, tier: "broad", tierAttempts };
  }
  if (strict.ok) {
    return { ok: true, text: strict.text, citations: strict.citations, tier: "strict", tierAttempts };
  }
  return { ok: false, detail: wide.detail || broad.detail || strict.detail || "All Perplexity tiers failed" };
}

router.post("/research", async (req, res) => {
  const parsed = GenerateResearchBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid request", details: parsed.error.format() });
    return;
  }
  const input = parsed.data;

  const pwcKey = firstHeader(req.headers["x-pwc-genai-key"]);
  const pwcBaseUrl = firstHeader(req.headers["x-pwc-genai-base-url"]);
  const pwcModelOverride = firstHeader(req.headers["x-pwc-genai-model"]);
  const perplexityKey = firstHeader(req.headers["x-perplexity-key"]);

  const PWC_DEFAULT_BASE_URL = "https://genai-sharedservice-americas.pwc.com";
  const PWC_DEFAULT_MODEL = "vertex_ai.gemini-2.5-flash-image";

  if (!pwcKey) {
    res.status(400).json({
      error:
        "PwC Gen AI credentials are required. Set API Key in Settings (sent as x-pwc-genai-key).",
    });
    return;
  }

  const resolvedBaseUrl = (pwcBaseUrl || PWC_DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const model = pwcModelOverride || PWC_DEFAULT_MODEL;

  req.log.info(
    {
      model,
      resolvedBaseUrl,
      chatCompletionsUrl: resolvePwCCompletionsUrl(resolvedBaseUrl),
    },
    "Research request starting (PwC Gen AI)",
  );

  const kbBlock =
    input.knowledgeBase && input.knowledgeBase.length > 0
      ? `User-provided AI Solutions Knowledge Base (${input.knowledgeBase.length} rows):\n${JSON.stringify(input.knowledgeBase, null, 2)}`
      : 'No Knowledge Base was provided. Use industry-standard AI solution patterns and label all solutions as source="external".';

  const todayStr = todayIsoDate();
  let liveResearchBlock = "No live web research was performed for this report.";
  let researchTier: PerplexityTier | "none" | "failed" = "none";
  if (perplexityKey) {
    const query = `Today's date is ${todayStr}. Provide the LATEST verifiable information about ${input.companyName} (${input.country}) relevant to a strategic consulting brief, prioritising sources published in roughly the last 12 months. Cover:
1. Most recent financial performance — latest reported fiscal year AND latest quarter (revenue, growth %, profit/margin, guidance). State the reporting period explicitly.
2. Strategic initiatives, M&A, restructurings, leadership changes from the last 6-12 months.
3. Key direct peers/competitors in ${input.country} with their LATEST size and positioning notes.
4. Recent signals related to: ${input.topics.join(", ")}.
For EVERY number, percentage, or named fact, attach the direct URL of the page that substantiates it (not a homepage). If a figure cannot be located via the strict allowlist, fall back to the broadest credible source available (still no Wikipedia / content farms / AI summaries) and clearly mark it as "(broader-web fallback)".`;
    const plex = await fetchPerplexityContext(perplexityKey, query);
    if (plex.ok) {
      researchTier = plex.tier;
      req.log.info(
        { tier: plex.tier, attempts: plex.tierAttempts, citationCount: plex.citations.length },
        "Perplexity research completed",
      );
      const sources =
        plex.citations.length > 0
          ? `\n\nSources:\n${plex.citations
              .slice(0, 12)
              .map(
                (c, i) =>
                  `[${i + 1}] ${c.title ? `${c.title} — ` : ""}${c.url ?? ""}`,
              )
              .join("\n")}`
          : "";
      const tierNote =
        plex.tier === "strict"
          ? "Sources passed the strict allowlist (regulators + top-tier business news)."
          : plex.tier === "broad"
            ? "Strict-allowlist search was thin; results were widened to any credible business / regulator / industry source. Treat figures from non-allowlist domains as best-available."
            : "Both strict and broad searches were thin; recency filter was dropped. Some figures may pre-date the last 12 months — check the URL and the reporting period stated.";
      liveResearchBlock = `Live web research from Perplexity (tier: ${plex.tier}). ${tierNote}\nUse as ground truth where it conflicts with prior knowledge:\n${plex.text}${sources}`;
    } else {
      researchTier = "failed";
      req.log.warn({ detail: plex.detail }, "Perplexity web research failed");
      liveResearchBlock =
        `Live web research via Perplexity failed (${plex.detail}). Rely on PwC Gen AI prior knowledge and state this in "assumptions".`;
    }
  }

  const userPrompt = `Generate a client intelligence and pitch report.

Today's date: ${todayStr}. Treat this as "now" — every number, statistic and quote you produce must be the LATEST available as of this date, with the reporting period stated.

Inputs:
- Company Name: ${input.companyName}
- Country / Geography: ${input.country}
- Buyer Persona: ${input.persona ?? "Not specified"}
- Topics of Interest: ${input.topics.join(", ")}

${liveResearchBlock}

${kbBlock}

${RESPONSE_SCHEMA_HINT}

Constraints:
- Use the latest information available as of ${todayStr}.
- DO NOT leave required sections empty. For each section (companySnapshot, peers, topicFindings, painPoints, solutions, mapping) you MUST produce content. Cascade through the following source tiers and use the FIRST tier that yields a defensible answer:
  Tier A — strict authoritative: regulator filings (SEC, BSE, NSE, RBI, SEBI, EU/UK regulators), the company's own IR / press / official site, top-tier business news (Reuters, Bloomberg, FT, WSJ, CNBC, Economist, Business Standard, Mint, Economic Times, Nikkei).
  Tier B — broader credible: established industry analysts (Gartner, IDC, McKinsey, Deloitte, BCG, S&P, Moody's, Fitch), trade publications, regional business press, Forbes / Fortune / Barron's, Moneycontrol.
  Tier C — last resort: any credible publicly indexed page that supports the claim (still NO Wikipedia, Statista preview pages, Macrotrends, AI-generated summaries, content farms, or low-quality blogs).
  When you fall back to Tier B or Tier C for a specific figure, append " (broader-web)" to the inline link label so the reader knows, e.g. "[$3.4B FY2024 revenue (broader-web)](https://...)".
- Only OMIT a figure if all three tiers fail; in that case still write the surrounding prose, explicitly say the value is unavailable, and add a line to "assumptions".
- Inline-link every number, percentage, dated event, named executive, peer financial, and direct quote in the prose using Markdown [text](url) syntax. The url must be a deep link (not a homepage).
- All "painPointTitle" values inside "solutions" MUST match a "title" inside "painPoints" exactly.
- Recommend KB solutions where they fit. If none of the KB rows fit a given pain point, fall back to an external solution.
- Always include at least one recommended solution per identified pain point.
- ${
    researchTier === "broad"
      ? 'NOTE: live-search tier was "broad" (strict allowlist returned thin results). It is acceptable to cite the broader-credible sources surfaced in the live-research block, with the "(broader-web)" tag.'
      : researchTier === "wide"
        ? 'NOTE: live-search tier was "wide" (recency filter was relaxed). Some cited pages may be older than 12 months — preserve the reporting period in the prose.'
        : researchTier === "failed" || researchTier === "none"
          ? 'NOTE: no live-search context was available. Use prior knowledge, but still inline-link to the most authoritative public URL you can identify for each fact.'
          : "NOTE: live-search tier was strict — all sources should be allowlist-grade."
  }
- Output JSON ONLY.`;

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userPrompt },
  ];

  try {
    const content = await fetchPwCChatCompletion({
      baseUrl: resolvedBaseUrl,
      apiKey: pwcKey,
      model,
      messages,
      maxTokens: 8192,
      temperature: 0.3,
    });

    let report: unknown;
    try {
      // Strip markdown code fences the model sometimes wraps around JSON
      const jsonText = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      report = JSON.parse(jsonText);
    } catch {
      req.log.warn(
        { contentPreview: content.slice(0, 500) },
        "Model returned non-JSON output",
      );
      throw new Error("Model returned non-JSON output");
    }

    const finalReport = {
      generatedAt: new Date().toISOString(),
      ...(report as Record<string, unknown>),
      companyName: input.companyName,
      country: input.country,
      persona: input.persona ?? null,
    };

    res.json(finalReport);
  } catch (err) {
    req.log.error({ err }, "Failed to generate research report");
    const message =
      err instanceof Error ? err.message : "Failed to generate research report";
    res.status(500).json({
      error: `Failed to generate report using the configured PwC Gen AI credentials: ${message}`,
    });
  }
});

export default router;
