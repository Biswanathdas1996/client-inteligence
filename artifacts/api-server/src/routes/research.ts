import { Router, type IRouter } from "express";
import { GenerateResearchBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

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
    "financialMetrics": [{"label": string, "value": string, "trend": string}] (4-7 items: revenue, growth, net income/margin, market cap or equivalent, etc.),
    "strategicInitiatives": string[] (3-6 recent initiatives, M&A, restructurings)
  },
  "peers": [{"name": string, "rationale": string, "revenueGrowth": string, "margin": string, "strength": string, "weakness": string}] (3-5 peers),
  "topicFindings": [{"topic": string, "summary": string (2-3 sentences), "signals": string[] (3-5 evidence-based signals)}] (one per requested topic),
  "painPoints": [{"title": string, "description": string, "evidence": string, "persona": string, "businessFunction": string}] (4-7 pain points),
  "solutions": [{"name": string, "source": "knowledge_base" | "external", "problem": string, "howAiHelps": string, "businessImpact": string, "persona": string, "painPointTitle": string (must match a painPoints[].title)}] (one or more per pain point; prefer KB matches when supplied),
  "mapping": [{"painPoint": string, "solution": string, "businessValue": string}] (one row per (painPoint, solution) pair),
  "assumptions": string[] (call out any data limitations or assumptions made)
}`;

router.post("/research", async (req, res) => {
  const parsed = GenerateResearchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.format() });
    return;
  }
  const input = parsed.data;

  const kbBlock =
    input.knowledgeBase && input.knowledgeBase.length > 0
      ? `User-provided AI Solutions Knowledge Base (${input.knowledgeBase.length} rows):\n${JSON.stringify(input.knowledgeBase, null, 2)}`
      : "No Knowledge Base was provided. Use industry-standard AI solution patterns and label all solutions as source=\"external\".";

  const userPrompt = `Generate a client intelligence and pitch report.

Inputs:
- Company Name: ${input.companyName}
- Country / Geography: ${input.country}
- Buyer Persona: ${input.persona ?? "Not specified"}
- Topics of Interest: ${input.topics.join(", ")}

${kbBlock}

${RESPONSE_SCHEMA_HINT}

Constraints:
- Use the latest information you have. If unsure on a specific number, give a reasoned estimate and add it to "assumptions".
- All "painPointTitle" values inside "solutions" MUST match a "title" inside "painPoints" exactly.
- Recommend KB solutions where they fit. If none of the KB rows fit a given pain point, fall back to an external solution.
- Always include at least one recommended solution per identified pain point.
- Output JSON ONLY.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!content) throw new Error("Empty response from model");

    let report: unknown;
    try {
      report = JSON.parse(content);
    } catch {
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
    res
      .status(500)
      .json({ error: "Failed to generate research report. Please try again." });
  }
});

export default router;
