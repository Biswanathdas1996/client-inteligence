import type { ReactNode } from "react";
import {
  Printer,
  AlertTriangle,
  ExternalLink,
  Lightbulb,
  MapPin,
  Calendar,
  Briefcase,
  Zap,
  TrendingUp,
  Database,
} from "lucide-react";
import { ResearchReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

function SourceLink({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-1 inline-flex shrink-0 items-center text-[#DC6900]/70 transition-colors hover:text-[#DC6900] no-print"
      title={url}
      aria-label="View source"
    >
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

/**
 * Renders a string that may contain inline Markdown links of the form
 * `[label](https://...)` as a sequence of text + anchor nodes. Links are
 * accepted only if the URL starts with http(s):// to keep it XSS-safe.
 *
 * The model is instructed to embed these inline so that every number /
 * verifiable claim in the report is clickable to its primary source.
 */
function RichText({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null;
  // [label](url) — label has no unescaped ']' or newline; url has no ')' or whitespace.
  const linkRe = /\[([^\]\n]+?)\]\((https?:\/\/[^\s)]+)\)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = linkRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, label, url] = match;
    nodes.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[#DC6900] underline decoration-[#DC6900]/40 underline-offset-2 transition-colors hover:text-[#C45E05] hover:decoration-[#DC6900]"
        title={url}
      >
        {label}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return <span className={className}>{nodes}</span>;
}

function ReportSectionHeading({ index, title }: { index: number; title: string }) {
  const n = String(index).padStart(2, "0");
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 print:mb-4">
      <span className="inline-flex shrink-0 items-center rounded-full bg-[#FFF5EB] px-3 py-1 text-[11px] font-semibold tabular-nums tracking-wide text-[#DC6900] ring-1 ring-[#DC6900]/15">
        {n}
      </span>
      <h2 className="min-w-0 text-xl font-semibold tracking-tight text-neutral-900 md:text-[1.35rem]">{title}</h2>
      <span
        className="hidden h-px min-w-[3rem] flex-1 bg-gradient-to-r from-neutral-300/90 to-transparent sm:block"
        aria-hidden
      />
    </div>
  );
}

export function ReportView({ report }: { report: ResearchReport }) {
  const handlePrint = () => window.print();

  return (
    <div className="mx-auto mb-12 max-w-5xl overflow-hidden rounded-[1.75rem] border border-neutral-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-12px_rgba(45,45,45,0.08)] ring-1 ring-neutral-950/[0.04] print:mb-6 print:overflow-visible print:shadow-none">
      {/* Report Header */}
      <div className="relative overflow-hidden border-b border-neutral-200/60 bg-gradient-to-br from-white via-neutral-50/80 to-[#FFF8EF] px-8 py-12 md:px-14 md:py-14 print:overflow-visible print:px-8 print:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-[22rem] w-[22rem] rounded-full bg-[#DC6900]/[0.08] blur-3xl no-print" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-[18rem] w-[18rem] rounded-full bg-[#FFB600]/[0.14] blur-3xl no-print" />

        <div className="relative z-10 flex justify-between gap-6">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC6900]/90">Strategic intelligence brief</p>
            <h1 className="mt-4 text-[1.875rem] font-semibold tracking-tight text-neutral-900 md:text-[2.5rem] md:leading-[1.1]">
              {report.companyName}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                {report.country}
              </span>
              {report.persona && (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-neutral-300 sm:inline sm:self-center" aria-hidden />
                  <span className="inline-flex items-center gap-2">
                    <Briefcase className="h-4 w-4 shrink-0 text-neutral-400" />
                    {report.persona}
                  </span>
                </>
              )}
              <span className="hidden h-1 w-1 rounded-full bg-neutral-300 sm:inline sm:self-center" aria-hidden />
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-neutral-400" />
                {new Date(report.generatedAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </span>
            </div>
          </div>
          <div className="no-print hidden shrink-0 sm:flex sm:items-start sm:pt-1">
            <Button
              variant="outline"
              type="button"
              onClick={handlePrint}
              aria-label="Print or save as PDF"
              className="group h-10 gap-2 rounded-full border-neutral-200/70 bg-white/80 px-5 text-[13px] font-semibold tracking-tight text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_10px_28px_-12px_rgba(45,45,45,0.16)] backdrop-blur-md transition-[box-shadow,border-color,background-color,color] duration-200 hover:border-[#DC6900]/45 hover:bg-[#FFF8EF] hover:text-[#C45E05] hover:shadow-[0_4px_28px_-10px_rgba(220,105,0,0.28)] focus-visible:ring-2 focus-visible:ring-[#DC6900]/30 focus-visible:ring-offset-2 [&_svg]:size-[15px] [&_svg]:text-neutral-400 [&_svg]:transition-colors group-hover:[&_svg]:text-[#DC6900]"
            >
              <Printer aria-hidden />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-20 px-8 py-12 md:px-14 md:py-16 print:space-y-8 print:px-8 print:py-8">
        {/* 1. Executive Summary */}
        <section className="scroll-mt-20">
          <ReportSectionHeading index={1} title="Executive Summary" />
          <div className="relative rounded-2xl border border-neutral-200/70 bg-gradient-to-b from-neutral-50/70 to-white p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] md:p-10">
            <span
              className="absolute inset-y-4 left-0 w-1 rounded-full bg-gradient-to-b from-[#FFB600] to-[#DC6900] md:inset-y-6"
              aria-hidden
            />
            <div className="prose prose-neutral max-w-none pl-4 text-neutral-900 prose-p:text-[1.0625rem] prose-p:leading-[1.7] prose-p:text-neutral-800 md:pl-5">
              <RichText text={report.executiveSummary} />
            </div>
          </div>
        </section>

        {/* 2. Company Snapshot */}
        <section className="scroll-mt-20">
          <ReportSectionHeading index={2} title="Company Snapshot" />
          <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="border-b border-neutral-200/60 bg-gradient-to-b from-white to-neutral-50/60 px-5 py-4 md:px-6 md:py-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Financial health</div>
              <div className="flex flex-wrap gap-2.5 md:gap-3">
                {report.companySnapshot.financialMetrics.map((metric, i) => (
                  <div
                    key={i}
                    className="min-w-[calc(50%-5px)] flex-1 basis-[140px] rounded-xl border border-neutral-200/60 bg-white/90 px-3.5 py-2.5 shadow-sm md:min-w-0 md:basis-[min(160px,calc(25%-9px))]"
                  >
                    <div className="line-clamp-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      {metric.label}
                    </div>
                    <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                      <span className="inline-flex items-center text-lg font-semibold tabular-nums leading-none text-neutral-900">
                        <RichText text={metric.value} />
                        <SourceLink url={metric.sourceUrl} />
                      </span>
                      {metric.trend ? (
                        <span
                          className={`whitespace-nowrap text-xs font-medium ${
                            metric.trend.includes("down") || metric.trend.includes("-")
                              ? "text-[#E0301E]"
                              : "text-[#DC6900]"
                          }`}
                        >
                          <RichText text={metric.trend} />
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-5 p-5 md:p-6">
              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Overview</h3>
                <p className="text-[0.9375rem] leading-relaxed text-neutral-800">
                  <RichText text={report.companySnapshot.description} />
                </p>
              </div>
              <div className="grid gap-6 border-t border-neutral-200/60 pt-5 sm:grid-cols-2 sm:gap-8">
                <div className="min-w-0">
                  <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#DC6900]" aria-hidden />
                    Revenue streams
                  </h3>
                  <ul className="space-y-2.5 text-[0.9375rem] leading-snug text-neutral-800">
                    {report.companySnapshot.revenueStreams.map((stream, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#E45C2B]" aria-hidden />
                        <RichText text={stream} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="min-w-0">
                  <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    <Lightbulb className="h-3.5 w-3.5 shrink-0 text-[#DC6900]" aria-hidden />
                    Strategic initiatives
                  </h3>
                  <ul className="space-y-2.5 text-[0.9375rem] leading-snug text-neutral-800">
                    {report.companySnapshot.strategicInitiatives.map((init, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#FFB600]" aria-hidden />
                        <RichText text={init} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Peer Landscape */}
        <section className="scroll-mt-20">
          <ReportSectionHeading index={3} title="Peer Landscape" />
          <div className="overflow-hidden rounded-2xl border border-neutral-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/90">
                    <th className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 md:px-6">
                      Peer
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 md:px-6">
                      Rationale
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500 md:px-6">
                      Growth
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500 md:px-6">
                      Margin
                    </th>
                    <th className="w-1/4 whitespace-nowrap py-3.5 pl-5 pr-6 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 md:pl-6">
                      Key strength
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/80">
                  {report.peers.map((peer, i) => (
                    <tr key={i} className="transition-colors hover:bg-neutral-50/70">
                      <td className="align-top px-5 py-4 text-sm font-semibold text-neutral-900 md:px-6">
                        <span className="inline-flex items-center gap-1">
                          {peer.name}
                          <SourceLink url={peer.sourceUrl} />
                        </span>
                      </td>
                      <td className="align-top px-5 py-4 pr-4 text-sm leading-relaxed text-neutral-600 md:px-6">
                        <RichText text={peer.rationale} />
                      </td>
                      <td className="align-top px-5 py-4 text-right text-sm font-medium tabular-nums text-neutral-900 md:px-6">
                        {peer.revenueGrowth ? <RichText text={peer.revenueGrowth} /> : "—"}
                      </td>
                      <td className="align-top px-5 py-4 text-right text-sm font-medium tabular-nums text-neutral-900 md:px-6">
                        {peer.margin ? <RichText text={peer.margin} /> : "—"}
                      </td>
                      <td className="align-top py-4 pl-5 pr-6 text-sm leading-relaxed text-neutral-600 md:pl-6 md:pr-6">
                        {peer.strength ? <RichText text={peer.strength} /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. Strategic Topic Findings */}
        {report.topicFindings.length > 0 && (
          <section className="scroll-mt-20">
            <ReportSectionHeading index={4} title="Strategic Findings" />
            <div className="grid gap-6 print:gap-5">
              {report.topicFindings.map((finding, i) => (
                <div
                  key={i}
                  className="group rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow-md md:p-8"
                >
                  <h3 className="text-lg font-semibold text-[#DC6900] transition-colors group-hover:text-[#C45E05]">
                    <span className="inline-flex items-center gap-1.5">
                      {finding.topic}
                      <SourceLink url={finding.sourceUrl} />
                    </span>
                  </h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-neutral-800">
                    <RichText text={finding.summary} />
                  </p>
                  <div className="mt-5 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      <span className="inline-block h-1 w-8 rounded-full bg-gradient-to-r from-[#FFB600] to-[#DC6900]" aria-hidden />
                      Market signals
                    </div>
                    <ul className="space-y-2">
                      {finding.signals.map((signal, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm leading-snug text-neutral-600">
                          <span className="mt-0.5 shrink-0 font-semibold text-[#DC6900]">›</span>
                          <span className="flex items-start gap-1">
                            <RichText text={signal} />
                            <SourceLink url={finding.signalSources?.[j]} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Identified Pain Points */}
        <section className="scroll-mt-20">
          <ReportSectionHeading index={5} title="Operational Pain Points" />
          <div className="grid gap-6 md:grid-cols-2 print:grid-cols-1 print:gap-5">
            {report.painPoints.map((pain, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-[#E0301E]/[0.22] bg-white p-6 shadow-[0_1px_3px_rgba(224,48,30,0.06)] md:p-7"
              >
                <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#F25544] to-[#E0301E]" />
                <div className="relative flex justify-between gap-4">
                  <h3 className="pr-2 text-[1.05rem] font-semibold leading-snug text-neutral-900">{pain.title}</h3>
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#E0301E]/90" />
                </div>
                <div className="relative mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-neutral-200/80 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                    {pain.businessFunction}
                  </span>
                  <span className="rounded-lg border border-neutral-200/80 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                    {pain.persona}
                  </span>
                </div>
                <p className="relative mt-4 text-[0.9375rem] leading-relaxed text-neutral-800">
                  <RichText text={pain.description} />
                </p>
                <div className="relative mt-5 border-t border-neutral-200/70 pt-4 text-sm text-neutral-600">
                  <span className="font-semibold text-neutral-900">Evidence: </span>
                  <RichText text={pain.evidence} />
                  <SourceLink url={pain.sourceUrl} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. AI Solutions Mapping */}
        <section className="scroll-mt-20">
          <ReportSectionHeading index={6} title="Technology Intervention" />
          <div className="space-y-6 md:space-y-7 print:space-y-5">
            {report.mapping.map((map, i) => {
              const solution = report.solutions.find((s) => s.name === map.solution);
              const isKb = solution?.source === "knowledge_base";
              const pain = report.painPoints.find((p) => p.title === map.painPoint);

              return (
                <div
                  key={i}
                  className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:flex-row print:flex-col"
                >
                  <div className="border-b border-neutral-200/60 bg-neutral-50/80 p-6 md:w-[38%] md:border-b-0 md:border-r md:border-neutral-200/60 print:w-full print:border-r-0 print:border-b print:border-neutral-200/60">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      <AlertTriangle className="h-3.5 w-3.5 text-neutral-400" />
                      Identified challenge
                    </div>
                    <div className="font-semibold leading-snug text-neutral-900">{map.painPoint}</div>
                    {pain && (pain.persona || pain.businessFunction) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {pain.businessFunction && (
                          <span className="rounded-md border border-neutral-200/80 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                            {pain.businessFunction}
                          </span>
                        )}
                        {pain.persona && (
                          <span className="rounded-md border border-neutral-200/80 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                            {pain.persona}
                          </span>
                        )}
                      </div>
                    )}
                    {pain?.description && (
                      <div className="mt-4">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                          Why it matters
                        </div>
                        <p className="text-sm leading-relaxed text-neutral-700">
                          <RichText text={pain.description} />
                        </p>
                      </div>
                    )}
                    {(pain?.evidence || pain?.sourceUrl) && (
                      <div className="mt-4 border-t border-neutral-200/70 pt-3">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                          Identified from
                        </div>
                        {pain?.evidence && (
                          <p className="text-[13px] leading-relaxed text-neutral-700">
                            <RichText text={pain.evidence} />
                          </p>
                        )}
                        {pain?.sourceUrl && (
                          <a
                            href={pain.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex max-w-full items-center gap-1.5 text-[12px] font-medium text-[#DC6900] underline decoration-[#DC6900]/40 underline-offset-2 transition-colors hover:text-[#C45E05] hover:decoration-[#DC6900]"
                            title={pain.sourceUrl}
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {(() => {
                                try {
                                  return new URL(pain.sourceUrl).hostname.replace(/^www\./, "");
                                } catch {
                                  return "Reference";
                                }
                              })()}
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 bg-white p-6 md:p-7">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#DC6900]">
                          <Zap className="h-3.5 w-3.5" />
                          Proposed solution
                        </div>
                        <div className="text-[1.2rem] font-semibold tracking-tight text-neutral-900 md:text-xl">{map.solution}</div>
                      </div>
                      {isKb ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FFF5EB] px-3 py-1.5 text-[11px] font-semibold text-[#DC6900] ring-1 ring-[#DC6900]/20">
                          <Database className="h-3.5 w-3.5" /> PwC asset
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200/90 bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                          Market solution
                        </span>
                      )}
                    </div>

                    <p className="text-[0.9375rem] leading-relaxed text-neutral-800">
                      {solution?.howAiHelps ? (
                        <RichText text={solution.howAiHelps} />
                      ) : (
                        "Strategic application of advanced analytics and generative models to optimize this operational workflow."
                      )}
                    </p>

                    <div className="mt-5 flex gap-4 rounded-xl border border-neutral-200/60 bg-gradient-to-br from-neutral-50/90 to-white p-5">
                      <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#DC6900]" />
                      <div>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          Business value
                        </div>
                        <div className="text-sm font-medium text-neutral-900">
                          <RichText text={map.businessValue} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. Assumptions */}
        {report.assumptions && report.assumptions.length > 0 && (
          <section className="no-print scroll-mt-20 rounded-2xl border border-neutral-200/70 bg-neutral-50/40 px-6 py-8">
            <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Methodological assumptions</h3>
            <ul className="list-disc space-y-2 pl-5 text-xs leading-relaxed text-neutral-600">
              {report.assumptions.map((assump, i) => (
                <li key={i}>{assump}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="hidden border-t border-neutral-200/70 py-8 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 print-only">
        Confidential · internal PwC use only
      </div>
    </div>
  );
}
