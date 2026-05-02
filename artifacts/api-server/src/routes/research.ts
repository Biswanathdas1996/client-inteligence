import { Router, type IRouter } from "express";
import { GenerateResearchBody } from "@workspace/api-zod";
import {
  fetchPwCChatCompletion,
  resolvePwCCompletionsUrl,
} from "../lib/chat-completions-fetch";
import { verifyAllReportUrlsReturn2xx } from "../lib/url-validation";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an enterprise research and solution-mapping agent built for PwC consultants.
Your job is to produce executive-ready, consulting-grade client intelligence reports based on user-provided inputs.

PERPLEXITY / LIVE WEB RESEARCH (WHEN THE USER PROMPT INCLUDES IT — NON-NEGOTIABLE):
- If the user message contains a block titled or describing "Live web research from Perplexity", that entire block (its bullet prose AND every URL in its "Sources:" list) is the sole authoritative fact base for: the subject company's financials, growth, margins, market position, dated corporate events, named leadership changes, peer/competitor facts, and any quantitative claims tied to the requested topics.
- You MUST NOT contradict that block. You MUST NOT "correct", replace, or override its figures with prior parametric knowledge.
- You MUST NOT invent, estimate, or infer specific numbers, percentages, dates, or named facts for those domains when the block does not supply them — write qualitative, careful prose instead, or state the gap in "assumptions", without fabricating data.
- Every inline Markdown [text](url) link in the report that supports a Perplexity-covered fact MUST use a URL that verbatim appears in that Perplexity block or in its numbered Sources list (same scheme, path, and query string). Do not mint plausible-looking IR, SEC, or news URLs that were not returned by the live search.
- KB rows, ROI benchmarks, and solution vendor pages may still use their own URLs when those sections are clearly separate from the Perplexity company dossier — but peer matrices, companySnapshot metrics, topicFindings tied to user topics, and pain-point evidence drawn from company news still depend on Perplexity URLs when the live block is present.

Operating principles:
- Reason at PwC GenAI quality. Be precise, current, and business-oriented.
- Maintain a consulting tone — clear, structured, quantified where possible, never buzzwordy.
- Distinguish facts, trends, and inferred insights. State assumptions explicitly when data is incomplete.
- Prefer earnings calls, annual/quarterly reports, press releases, analyst commentary, regulatory filings, and credible news sources for grounding.
- For peer selection, justify based on industry, geography, size, and business model.
- PEER COMPARISON MATRIX IS MANDATORY: in addition to the qualitative peers[] table, populate "peerComparison" with a side-by-side metrics matrix of the SELECTED company vs the arithmetic average of the named peer set. Use the SAME peer companies for the average that you named in peers[]. For INSURANCE / reinsurance, the matrix MUST contain exactly these five rows, in order: Combined ratio, Loss ratio, NWP growth, Book size (gross written premium or AUM — state which), Net profit. For other industries pick the 4-6 most diagnostic KPIs the consultant would expect (banks → NIM/CIR/GNPA/RoA/Loan growth; SaaS → ARR growth/NRR/Rule of 40/FCF margin; pharma → R&D % sales/gross margin/pipeline NPV/top-product revenue). Each companyValue and peerAverage cell MUST contain an inline Markdown link to the primary source for that figure (filing, regulator return, IR page). State the reporting period (FY25, Q1 FY26, etc.) inside the cell.
- For pain points, derive them from concrete signals; map each one to a buyer persona and business function.
- For AI solution recommendations, FIRST search the user-supplied Knowledge Base (KB) and only recommend KB items that genuinely match an identified pain point. If no KB item fits a pain point, recommend an industry-standard external AI solution and label its source as "external".
- Every recommended solution must include: the problem addressed, how AI helps, expected business impact (cost / revenue / risk / speed / quality), and the primary buyer persona.
- ROI MATH IS MANDATORY for every solution. Populate "roiCalculation" with: (a) a baseline volume/cost grounded in the company's own disclosed numbers (latest 10-K, annual report, earnings transcript, or press release — inline-linked); (b) an uplift % grounded in a published industry benchmark from a credible source (Gartner, IDC, McKinsey, BCG, Deloitte, Forrester, S&P, IBM, AWS, Microsoft, Google whitepapers, peer-reviewed studies — inline-linked); (c) a worked formula a reader can audit with a calculator; (d) the resulting annual value with currency and period; (e) a payback estimate vs. an inline-linked implementation cost; (f) a list of assumptions, each carrying an inline source link. Never invent baseline numbers — if the company does not disclose the volume directly, derive it from a stated ratio (e.g. revenue ÷ ASP, employees × hours/yr) and show the derivation in the formula. ROI math without inline links to the underlying numbers is a FAILURE.
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
- When a figure or claim relies on Tier B or Tier C, mark it inline by appending " (broader-web)" INSIDE the label brackets, e.g. "[$3.4B FY2024 (broader-web)](https://...)". The "(broader-web)" tag MUST sit before the closing "]" — never inside the URL parens. WRONG: "[$3.4B FY2024](https://example.com (broader-web))". RIGHT: "[$3.4B FY2024 (broader-web)](https://example.com)". Tier A links need no marker.
- Every URL must be a real, working HTTPS deep link to the page substantiating the claim — not a generic homepage.
- NEVER write "Unavailable", "N/A", "Not available", "No data", "Data not found", or any equivalent placeholder as a value. Every field MUST contain real, substantive content. If a specific number cannot be sourced even at Tier C, fall back to the company's most recent disclosed figure from your prior knowledge (state the period, e.g. "FY2024"), or to a credible industry estimate, or to a qualitative description ("largest US auto insurer by direct premium written" rather than "Unavailable"). Add a line to "assumptions" noting the source limitation, but the field itself MUST carry real content.

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
  "peerComparison": {
    "peerSetSummary": string (one sentence naming the peers used for the average and the reporting period; inline-link each peer name to its IR / regulator filing — e.g. "Peer set: [HDFC Life](https://...), [SBI Life](https://...), [ICICI Pru Life](https://...) — FY25 disclosures"),
    "metrics": [{
      "label": string (the metric name),
      "unit": string (display hint, e.g. "%", "pp", "₹ Cr", "$M"),
      "companyValue": string (the SELECTED company's latest reported value with an inline Markdown link to the primary source — e.g. "[96.4%](https://...)"),
      "peerAverage": string (arithmetic average across the named peer set with an inline Markdown link to source / methodology, including n and period — e.g. "[101.2% (n=4 peers, FY25)](https://...)"),
      "delta": string (signed gap with direction, e.g. "-4.8 pp better" or "+220 bps worse"; omit if not meaningful),
      "interpretation": string (one-line plain-English read of the gap; optional)
    }]
  } (REQUIRED whenever a sensible peer set exists. If the company is in INSURANCE / reinsurance, "metrics" MUST contain exactly these 5 rows, in this order: "Combined ratio", "Loss ratio", "NWP growth", "Book size" (gross written premium or AUM, depending on what's disclosed; state which in interpretation), "Net profit". For non-insurance companies pick the 4-6 most diagnostic industry KPIs (e.g. SaaS: ARR growth, Net revenue retention, Rule of 40, FCF margin; Banks: NIM, CIR, GNPA%, RoA, Loan growth; Pharma: R&D as % of sales, Gross margin, Pipeline NPV, Top-product revenue). Every companyValue and peerAverage MUST be inline-linked. The peer set used for averages MUST be the same companies named in "peers[]"),
  "topicFindings": [{"topic": string, "summary": string (2-3 sentences), "sourceUrl": string (REQUIRED — URL to primary source for this finding), "signals": string[] (3-5 evidence-based signals), "signalSources": string[] (REQUIRED — one URL per signal, same order as signals array)}] (one per requested topic),
  "painPoints": [{"title": string, "description": string (the WHY: 2-3 sentences explaining why this is a real challenge for the company today, with the specific business consequence), "evidence": string (the WHERE-IT-CAME-FROM: name the exact source artefact and the specific quote or data point that surfaced this challenge — e.g. "Q3 FY2025 earnings call (Oct 28 2025): CFO flagged supply-chain disruption costing ~$120M in inventory write-downs" or "10-K Risk Factors section, page 24: company discloses ongoing legacy-IT modernisation gap". The string MUST contain at least one inline Markdown link [exact phrase](deep-url) to the primary artefact (filing PDF, earnings transcript, press release, regulator notice, or news article) — never just a homepage), "sourceUrl": string (REQUIRED — same primary-artefact URL as a clean field, used for the "Reference" badge in the UI), "persona": string, "businessFunction": string}] (4-7 pain points; each pain point MUST be derivable from a concrete, dated, sourced signal — do not invent generic challenges),
  "solutions": [{
    "name": string,
    "source": "knowledge_base" | "external",
    "problem": string,
    "howAiHelps": string,
    "businessImpact": string,
    "persona": string,
    "painPointTitle": string (must match a painPoints[].title),
    "sourceUrl": string (URL to solution reference or vendor page),
    "roiCalculation": {
      "baseline": string (current-state cost or volume the solution acts on, with at least one inline Markdown source link — e.g. "Acme processes ~[12M invoices/year](https://...) at a manual cost of [~$8.40 per invoice](https://...)"),
      "uplift": string (the % improvement assumed — efficiency gain, defect reduction, capacity unlocked, etc. — backed by an industry benchmark with an inline link, e.g. "[55-70% straight-through processing](https://...) per Gartner"),
      "formula": string (the actual arithmetic written out so a reader can audit it — e.g. "12,000,000 × $8.40 × 60% = $60.5M annual savings"),
      "annualValue": string (headline annualised value with currency and period, e.g. "≈ $60.5M / year in OpEx savings"),
      "paybackPeriod": string (estimated payback vs. implementation cost; cost assumption MUST be inline-linked — e.g. "Implementation ~[$5-7M](https://...) → payback in 1-2 months"),
      "assumptions": string[] (each line MUST contain an inline Markdown link to the assumption's source)
    }
  }] (one or more per pain point; prefer KB matches when supplied; roiCalculation is REQUIRED — never omit it),
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
Return concise, factual findings grounded ONLY in URLs returned by your web search for this query — not in training memory.
Hard rules:
- Do not state any fact, figure, date, or name unless a retrieved search result directly supports it. If you cannot verify via search, say "Not found in retrieved sources" for that item — never guess or fabricate.
- Do not invent, paraphrase into existence, or "construct" URLs. Every link must be a real URL from search results that resolves to the cited content (deep link preferred, not a generic homepage).
- Every quoted number (revenue, growth, margin, market cap, headcount) must be the most recently reported figure available in those sources; always state the reporting period (e.g., "FY2025", "Q1 2026").
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
Hard rules (same as strict tier):
- Only include facts supported by retrieved search results; never fill gaps from memory. If unavailable, say so plainly rather than inventing.
- Only use URLs returned by search — no fabricated or guessed links. Deep links must load the substantiating page.
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
Hard rules:
- Facts and URLs must come only from retrieved search results — no memory-only claims, no invented URLs.
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
  let researchTier: PerplexityTier | "none" = "none";
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
      liveResearchBlock = `Live web research from Perplexity (tier: ${plex.tier}). ${tierNote}

CRITICAL — SOURCE OF TRUTH FOR FACTS:
The following bullets and every URL under "Sources:" are the authoritative fact base for this company, its peers as described here, and the requested topics. The report generator MUST treat them as overriding any prior model knowledge. MUST NOT add or change numbers, dates, or definitive claims beyond what is supported here. MUST NOT invent links — every citation for these facts MUST use URLs copied exactly from this block or from the Sources list. Unverifiable or missing items go in "assumptions" as gaps, not as fabricated data. The API will not return the report unless every cited URL verifies as HTTP 2xx from the server; prefer URLs you are confident respond successfully.

Perplexity findings:
${plex.text}${sources}`;
    } else {
      req.log.warn({ detail: plex.detail }, "Perplexity web research failed");
      res.status(503).json({
        error:
          "Report not generated: live web research via Perplexity failed. Check your Perplexity API key and try again.",
        perplexityDetail: plex.detail,
      });
      return;
    }
  }

  const liveSearchTierNote =
    researchTier === "broad"
      ? 'NOTE: live-search tier was "broad" (strict allowlist returned thin results). It is acceptable to cite the broader-credible sources surfaced in the live-research block, with the "(broader-web)" tag.'
      : researchTier === "wide"
        ? 'NOTE: live-search tier was "wide" (recency filter was relaxed). Some cited pages may be older than 12 months — preserve the reporting period in the prose.'
        : researchTier === "none"
          ? 'NOTE: no live-search context was available. Use prior knowledge, but still inline-link to the most authoritative public URL you can identify for each fact.'
          : 'NOTE: live-search tier was strict — all sources should be allowlist-grade.';

  const liveResearchLockIn =
    researchTier === "none"
      ? ""
      : `LIVE RESEARCH LOCK-IN: A Perplexity block is present above. For company financials, peer facts in that block, and topic signals covered there, you MUST derive content only from that block and its Sources URLs — no hallucinated figures, no alternate URLs for the same claims, no "helpful" padding from memory. ROI/solution benchmark links may still follow KB + tier rules if they are clearly separate.`;

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
- NEVER use placeholder text like "Unavailable", "N/A", "Not available", "No data", "TBD", or "Data not found" as a value in ANY field. If you cannot source a specific number even at Tier C, write a real fallback: the most recent figure you know from prior knowledge (with the period stated), a qualitative description of the metric, or a credible estimate range — and note the source limitation in "assumptions". Empty placeholders are a HARD FAILURE.
- Inline-link every number, percentage, dated event, named executive, peer financial, and direct quote in the prose using Markdown [text](url) syntax. The url must be a deep link (not a homepage).
- All "painPointTitle" values inside "solutions" MUST match a "title" inside "painPoints" exactly.
- Recommend KB solutions where they fit. If none of the KB rows fit a given pain point, fall back to an external solution.
- Always include at least one recommended solution per identified pain point.
- ${liveSearchTierNote}${
    liveResearchLockIn ? `\n- ${liveResearchLockIn}` : ""
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

    const urlGate = await verifyAllReportUrlsReturn2xx(finalReport);
    if (!urlGate.ok) {
      req.log.warn(
        {
          checked: urlGate.checked,
          failureCount: urlGate.failures.length,
          sample: urlGate.failures.slice(0, 8),
        },
        "Report withheld: not every cited URL returned HTTP 2xx",
      );
      res.status(422).json({
        error:
          "Report not returned: every cited URL must return HTTP 2xx. Regenerate or fix the failing links.",
        urlCheckFailures: urlGate.failures,
        checkedUrlCount: urlGate.checked,
      });
      return;
    }
    if (urlGate.checked > 0) {
      req.log.info({ checked: urlGate.checked }, "All cited URLs returned HTTP 2xx");
    }

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
