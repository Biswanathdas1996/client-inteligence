export default function About() {
  return (
    <div className="flex-1 overflow-auto bg-[#FAFAFA] p-8 md:p-12">
      <div className="max-w-3xl mx-auto bg-white border border-[#E5E5E5] p-10 md:p-16 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-[#2D2D2D] mb-6">Methodology & Standards</h1>

        <div className="prose prose-sm md:prose-base prose-neutral max-w-none text-[#2D2D2D]">
          <p className="lead text-lg text-[#696969] mb-6">
            Client Intelligence produces a single strategic brief from structured inputs: company name, country or geography, at least one topic of interest, an optional buyer persona (CFO, COO, CIO, CRO, CEO, or other), and an optional proprietary solution catalog file. A hosted API orchestrates live web retrieval (when enabled), enterprise Gen AI synthesis, and machine-readable output that the app renders as an interactive report with clickable sources.
          </p>

          <h2 className="text-xl font-bold text-[#DC6900] mt-10 mb-4 border-b border-[#E5E5E5] pb-2">End-to-end flow</h2>
          <ol className="space-y-3 mb-8 text-[#696969] list-decimal pl-5">
            <li>
              <strong className="text-[#2D2D2D]">Capture inputs.</strong> The brief form enforces company, geography, and topics. Persona narrows tone for the executive summary. Uploading a CSV or Excel catalog parses rows into an in-memory knowledge base passed through to generation.
            </li>
            <li>
              <strong className="text-[#2D2D2D]">Optional live web research.</strong> When a Perplexity API key is supplied, the backend runs Perplexity Sonar with citations enabled, scoped to the company, geography, and your topics. The retrieval text plus an enumerated source list are injected into the model prompt as the authoritative company-and-topic fact base. If that step fails, the API does not return a report for that configuration.
            </li>
            <li>
              <strong className="text-[#2D2D2D]">Synthesis.</strong> A PwC Gen AI chat completion builds one JSON document matching the report schema: narrative sections, tables, pain points, solution rows, ROI objects, and cross-links between pain points and solutions.
            </li>
            <li>
              <strong className="text-[#2D2D2D]">Link gate.</strong> Before the response is returned, the server checks each unique HTTPS URL embedded in the report (inline citations and structured <code className="text-[13px]">sourceUrl</code> fields). Every URL must follow redirects to a successful HTTP 2xx response; otherwise the run is rejected so consultants are not handed broken references.
            </li>
          </ol>
          <p className="mb-8 text-[#696969]">
            If live research is not enabled, generation still follows tiered sourcing and inline citation rules below; the model must defend claims with real deep links rather than placeholders, using the best authoritative pages it can identify for each fact.
          </p>

          <h2 className="text-xl font-bold text-[#DC6900] mt-10 mb-4 border-b border-[#E5E5E5] pb-2">Live retrieval tiers (Perplexity)</h2>
          <p className="mb-4">
            Retrieval is deliberately conservative first, then widens only when early passes are too thin (short prose, very few sources, or explicit “could not find” language). Each tier uses a low temperature and requires facts and URLs to come from search results—not from silent parametric memory.
          </p>
          <ul className="space-y-4 mb-8 list-none pl-0">
            <li className="pl-4 border-l-2 border-[#FFB600]">
              <strong>Tier 1 — strict.</strong> Search is limited to a curated allowlist (major regulators and exchanges such as SEC, BSE, and NSE, plus top-tier business newswires) and a rolling recency window (roughly the last twelve months). This mimics a filing-first, wire-service-first desk posture.
            </li>
            <li className="pl-4 border-l-2 border-[#DC6900]">
              <strong>Tier 2 — broad.</strong> If strict results are insufficient, domain filtering is removed while keeping the same twelve-month bias and prompting rules. This captures company IR pages on bespoke domains, regional press, analyst notes, and trade coverage that strict filters may miss.
            </li>
            <li className="pl-4 border-l-2 border-[#E45C2B]">
              <strong>Tier 3 — wide.</strong> If results are still thin, the recency filter may be dropped so older but verifiable disclosures can surface—the prompt requires the model to state reporting periods clearly and flag when figures pre-date the usual window.
            </li>
          </ul>
          <p className="mb-8 text-[#696969]">
            The tier name and a short interpretation (strict vs widened sources vs relaxed recency) travel with the live block so the downstream model calibrates confidence and tagging—for example, when broader-credible domains or older periods are in play.
          </p>

          <h2 className="text-xl font-bold text-[#DC6900] mt-10 mb-4 border-b border-[#E5E5E5] pb-2">Grounding when live research is present</h2>
          <p className="mb-4">
            When the prompt contains the live research block, that block—including its bullet prose and the numbered <strong>Sources</strong> list—is the single source of truth for the subject company’s financial performance, margins and growth as stated there, dated corporate events, named leadership changes, peer facts described in the block, and quantitative claims tied to your requested topics.
          </p>
          <ul className="space-y-2 mb-8 text-[#696969] list-disc pl-5">
            <li>The writer model must not “correct” or replace those figures with prior knowledge.</li>
            <li>It must not invent numbers, percentages, dates, or names when the block does not supply them—those gaps belong in qualitative phrasing or in the <strong>assumptions</strong> array.</li>
            <li>Inline Markdown links that support Perplexity-grounded facts must use URLs copied verbatim from the block or its source list (same scheme, path, and query string)—not plausible-looking URLs synthesized for effect.</li>
            <li>Knowledge-base rows, ROI benchmark pages, and external vendor links may still appear where they are clearly separate from the company dossier (for example industry uplift studies or solution documentation).</li>
          </ul>

          <h2 className="text-xl font-bold text-[#DC6900] mt-10 mb-4 border-b border-[#E5E5E5] pb-2">Source tiers inside the written report</h2>
          <p className="mb-4">
            Independent of live retrieval, the synthesis prompt insists on a waterfall for each fact: exhaust the strictest credible tier before falling back. Labels in the UI may carry a <strong>(broader-web)</strong> marker when a claim relies on Tier B or C.
          </p>
          <ul className="space-y-3 mb-6 list-none pl-0">
            <li className="pl-4 border-l-2 border-[#FFB600]">
              <strong>Tier A (preferred):</strong> Regulator and government domains, primary filings (10-K, 10-Q, 20-F, annual reports), the company’s official IR and press channels, and top-tier business news (for example Reuters, Bloomberg, Financial Times, Wall Street Journal, CNBC, The Economist, and major regional outlets used in the product configuration).
            </li>
            <li className="pl-4 border-l-2 border-[#DC6900]">
              <strong>Tier B:</strong> Established analyst houses and consultancies (Gartner, IDC, large strategy firms, ratings agencies), respected business magazines, regional press, and some contributor-style equity research—still requiring a deep page that substantiates the claim.
            </li>
            <li className="pl-4 border-l-2 border-[#E45C2B]">
              <strong>Tier C (last resort):</strong> Any other credible indexed page that directly supports the statement, after higher tiers fail—never used to skip straight past filings or primary news when those exist.
            </li>
          </ul>
          <p className="mb-4 text-[#696969]">
            Disallowed reference types include Wikipedia as a primary anchor, generic aggregators without underlying sources, SEO listicles, obvious content farms, AI-generated summary mills, Statista preview paywalls, Macrotrends-style scrapes, and bare homepages used where a deep link is required.
          </p>
          <p className="mb-8 text-[#696969]">
            The pipeline also instructs the model to avoid empty placeholders (“N/A”, “Unavailable”, and similar) in required fields: if a number cannot be sourced, the section should still contain substantive qualitative content, a best-available estimate with period stated, or an explicit limitation line in <strong>assumptions</strong>.
          </p>

          <h2 className="text-xl font-bold text-[#DC6900] mt-10 mb-4 border-b border-[#E5E5E5] pb-2">Recency expectations</h2>
          <p className="mb-8 text-[#696969]">
            The generator receives today’s date and is instructed to treat figures older than about twelve months as stale for financial metrics, and strategic initiatives, leadership moves, and market narratives older than about six months as needing freshening or qualification. Live retrieval prompts emphasize the latest fiscal year and latest quarter where disclosures exist; executive and analyst quotes are expected to trace to the most recent call, release, or article available at generation time. When only older material exists—common for niche issuers—that limitation is surfaced in prose or assumptions rather than hidden.
          </p>

          <h2 className="text-xl font-bold text-[#DC6900] mt-10 mb-4 border-b border-[#E5E5E5] pb-2">Citations in the UI</h2>
          <p className="mb-8 text-[#696969]">
            The report renderer parses <code className="text-[13px]">[label](https://…)</code> Markdown links in string fields and turns them into tappable anchors (only http and https schemes are accepted for safety). Structured fields such as <code className="text-[13px]">sourceUrl</code> on peers, topic cards, pain points, and signals drive small external-link affordances beside headings and bullets. Expect both inline links inside sentences and row-level source badges—duplication is intentional so readers can skim tables or open a primary artefact in one click.
          </p>

          <h2 className="text-xl font-bold text-[#DC6900] mt-10 mb-4 border-b border-[#E5E5E5] pb-2">Our AI principles</h2>
          <ul className="space-y-4 mb-8 list-none pl-0">
            <li className="pl-4 border-l-2 border-[#FFB600]">
              <strong>Accuracy & traceability:</strong> Prefer disclosure-backed and wire-backed claims; separate fact, trend, and inference; when live research is attached, treat it as overriding memory for company facts; never fabricate URLs or figures to fill silence.
            </li>
            <li className="pl-4 border-l-2 border-[#DC6900]">
              <strong>Security & confidentiality:</strong> Engagement inputs and uploaded catalogs are handled in the application and API path you deploy—not used to train public foundation models.
            </li>
            <li className="pl-4 border-l-2 border-[#E45C2B]">
              <strong>Consulting-grade structure:</strong> Peers are justified by industry, geography, scale, and business model. Pain points are required to trace to concrete, dated signals. Each pain point maps to at least one solution row, with explicit business value language and a mandatory ROI object for auditability.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-[#DC6900] mt-10 mb-4 border-b border-[#E5E5E5] pb-2">Knowledge base integration</h2>
          <p className="mb-4">
            Parsed catalog rows are serialized into the prompt as a structured knowledge base. The model is told to recommend knowledge-base solutions only when a row genuinely fits an identified pain point; otherwise it should recommend an industry-standard external option and set the source field accordingly. In the canvas, knowledge-base matches render with a PwC asset badge; external recommendations render as market solutions.
          </p>
          <p className="mb-8 text-[#696969]">
            Solution rows must still spell out the problem addressed, how AI changes the operating model, impact across cost, revenue, risk, speed, or quality, and the primary buyer persona, with URLs pointing at internal offering sheets or external vendor references as appropriate.
          </p>

          <h2 className="text-xl font-bold text-[#DC6900] mt-10 mb-4 border-b border-[#E5E5E5] pb-2">Report structure & analytical depth</h2>
          <p className="mb-4">Sections mirror the on-screen canvas numbering:</p>
          <ol className="space-y-4 mb-6 text-[#696969] list-decimal pl-5">
            <li>
              <strong className="text-[#2D2D2D]">Executive summary (3–6 sentences).</strong> Persona-aware, board tone, every quantitative clause inline-linked where the schema carries citations.
            </li>
            <li>
              <strong className="text-[#2D2D2D]">Company snapshot.</strong> Narrative, three-to-six revenue streams, four-to-seven financial metrics (labels, values, trends, each with <code className="text-[13px]">sourceUrl</code>), and three-to-six recent initiatives or restructuring moves.
            </li>
            <li>
              <strong className="text-[#2D2D2D]">Peer landscape.</strong> Three to five named peers with rationale, growth and margin columns where available, strengths and weaknesses, and a required comparison matrix when a defensible peer set exists. The matrix compares the selected company to the arithmetic average of the same peer names used in the table: each cell carries an inline-linked figure and reporting period. Insurance and reinsurance briefs prescribe five rows in a fixed order—combined ratio, loss ratio, net written premium growth, book size (premium or AUM, stated explicitly), and net profit. Other industries use four to six sector-typical KPIs (for example banks: net interest margin, cost-to-income, asset quality, return on assets, loan growth; SaaS: ARR growth, net revenue retention, Rule of 40, free cash flow margin; pharma: R&amp;D intensity, gross margin, pipeline value cues, top-product revenue).
            </li>
            <li>
              <strong className="text-[#2D2D2D]">Strategic findings.</strong> One card per requested topic: short summary, primary <code className="text-[13px]">sourceUrl</code>, three-to-five evidence bullets, and a parallel <code className="text-[13px]">signalSources</code> array so each signal has its own link.
            </li>
            <li>
              <strong className="text-[#2D2D2D]">Operational pain points.</strong> Typically four to seven items. Each includes title, consequence-focused description, and an evidence string that names the artefact (filing section, call date, headline) with at least one deep link to that artefact—plus persona and business-function tags for routing conversations.
            </li>
            <li>
              <strong className="text-[#2D2D2D]">Technology intervention.</strong> A mapping row per pain-point and solution pair showing business value in prose. Each solution exposes a worked ROI block: baseline (anchored in the company’s own disclosures with links), uplift percentage grounded in a published benchmark (vendor whitepapers, analyst studies, hyperscaler guidance—also linked), a handwritten formula a reader can audit, annualized value, payback versus an implementation cost assumption, and a bullet list of assumptions where every line carries its own source link. Baselines may be derived indirectly (for example revenue divided by a stated price) when direct volumes are not disclosed, provided the derivation is shown in the formula string.
            </li>
          </ol>
          <p className="mb-8 text-[#696969] text-sm">
            A closing <strong>methodological assumptions</strong> band (visible in-product) collects residual limitations—datapoint delays, currency of filings, or reliance on broader-web sources—so partners can qualify the brief in client conversations.
          </p>
        </div>
      </div>
    </div>
  );
}
