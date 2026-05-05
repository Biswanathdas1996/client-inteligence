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
  BarChart3,
  Layers,
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
  // [label](url) with an optional trailing " (annotation)" inside the URL parens —
  // the model sometimes writes [x](https://... (broader-web)) instead of putting
  // the tag inside the label. Capture the annotation so it can be appended to
  // the visible label rather than left as raw text.
  const linkRe = /\[([^\]\n]+?)\]\((https?:\/\/[^\s)]+)(?:\s+\(([^)]+)\))?\)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = linkRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, label, url, annotation] = match;
    const visible = annotation && !label.includes(annotation)
      ? `${label} (${annotation})`
      : label;
    nodes.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[#DC6900] underline decoration-[#DC6900]/40 underline-offset-2 transition-colors hover:text-[#C45E05] hover:decoration-[#DC6900]"
        title={url}
      >
        {visible}
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
    <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4 print:mb-4">
      <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-white to-[#FFF5EB] text-[12px] font-bold tabular-nums tracking-tight text-[#C45E05] shadow-[0_1px_2px_rgba(45,45,45,0.06),inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-[#DC6900]/12 print:shadow-none"
          aria-hidden
        >
          {n}
        </span>
        <div className="min-w-0">
          <h2 className="text-[1.125rem] font-semibold leading-snug tracking-tight text-neutral-950 md:text-xl">
            {title}
          </h2>
          <span className="mt-2 block h-[3px] w-10 rounded-full bg-gradient-to-r from-[#DC6900] via-[#EB8C00] to-[#FFB600]/70 print:hidden" aria-hidden />
        </div>
      </div>
      <span className="hidden h-px flex-1 bg-gradient-to-r from-neutral-200/90 via-neutral-200/40 to-transparent sm:block print:hidden" aria-hidden />
    </header>
  );
}

export function ReportView({ report }: { report: ResearchReport }) {
  const handlePrint = () => window.print();

  return (
    <div className="mx-auto mb-8 w-full max-w-[min(100%,96rem)] overflow-hidden rounded-[2rem] border border-neutral-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_28px_64px_-16px_rgba(45,45,45,0.10)] ring-1 ring-neutral-950/[0.035] print:mb-6 print:overflow-visible print:rounded-xl print:shadow-none print:ring-0">
      {/* Report Header */}
      <div className="relative overflow-hidden border-b border-neutral-200/60 bg-gradient-to-br from-white via-neutral-50/80 to-[#FFF8EF] px-5 py-8 md:px-8 md:py-10 xl:px-10 print:overflow-visible print:px-8 print:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-[22rem] w-[22rem] rounded-full bg-[#DC6900]/[0.08] blur-3xl no-print" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-[18rem] w-[18rem] rounded-full bg-[#FFB600]/[0.14] blur-3xl no-print" />

        <div className="relative z-10 flex justify-between gap-6">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC6900]/90">Strategic intelligence brief</p>
            <h1 className="mt-3 text-[1.625rem] font-semibold tracking-tight text-neutral-900 md:text-[2rem] md:leading-[1.12]">
              {report.companyName}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-neutral-600">
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

        {report.productLine && (
          <div
            className="relative z-10 mt-6 rounded-xl border border-[#DC6900]/28 bg-gradient-to-r from-[#FFF8EF] to-[#FFFCF8] px-4 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] md:px-5 print:mt-5 print:border-neutral-300 print:bg-neutral-50 print:shadow-none"
            role="note"
          >
            <p className="flex flex-col gap-2 text-[13px] leading-snug text-neutral-800 sm:flex-row sm:items-start sm:gap-3">
              <span className="inline-flex shrink-0 items-center gap-2 font-semibold text-[#C45E05]">
                <Layers className="h-4 w-4 shrink-0" aria-hidden />
                Product line scope
              </span>
              <span className="text-neutral-700">
                This briefing—including live web research, peer comparison, financial figures discussed, topic findings, and AI solution recommendations—is scoped to{" "}
                <strong className="font-semibold text-neutral-900">{report.productLine}</strong> only, not the full corporate group unless sources report only consolidated results (then see assumptions and prose caveats).
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="relative isolate space-y-12 bg-gradient-to-b from-neutral-50/85 via-white to-neutral-50/50 px-5 py-10 md:space-y-14 md:px-9 md:py-12 xl:px-12 print:space-y-8 print:bg-white print:px-8 print:py-8 print:via-white print:to-white">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-neutral-200/70 to-transparent print:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-4 -top-24 z-0 h-[20rem] max-w-4xl rounded-[100%] bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(220,105,0,0.07),transparent_72%)] blur-2xl no-print md:inset-x-12"
          aria-hidden
        />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-[45%] z-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(250,250,250,0.65)_100%)] print:hidden" aria-hidden />

        {/* 1. Executive Summary */}
        <section className="relative z-10 scroll-mt-20">
          <ReportSectionHeading index={1} title="Executive Summary" />
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200/55 bg-white/85 p-5 shadow-[0_2px_8px_-2px_rgba(45,45,45,0.06),0_0_0_1px_rgba(255,255,255,0.6)_inset] backdrop-blur-[2px] md:p-7 xl:p-8 print:border print:bg-white print:shadow-none print:backdrop-blur-none">
            <span
              className="absolute inset-y-5 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-[#FFB600] via-[#EB8C00] to-[#DC6900] opacity-90 md:inset-y-6"
              aria-hidden
            />
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/4 -translate-y-1/4 rounded-full bg-gradient-to-br from-[#DC6900]/[0.06] to-transparent blur-2xl no-print" aria-hidden />
            <div className="prose prose-neutral relative max-w-none pl-4 text-neutral-900 prose-p:my-2 prose-p:text-[0.9375rem] prose-p:leading-[1.55] prose-p:text-neutral-800 md:pl-6 xl:columns-2 xl:gap-10 xl:[column-rule:1px_solid_rgb(229_229_229/0.55)]">
              <RichText text={report.executiveSummary} />
            </div>
          </div>
        </section>

        {/* 2. Company Snapshot */}
        <section className="relative z-10 scroll-mt-20">
          <ReportSectionHeading index={2} title="Company Snapshot" />
          <div className="overflow-hidden rounded-3xl border border-neutral-200/55 bg-white/90 shadow-[0_2px_10px_-4px_rgba(45,45,45,0.07)] backdrop-blur-[1px] print:border print:bg-white print:shadow-none print:backdrop-blur-none">
            <div className="relative overflow-hidden border-b border-neutral-200/50 bg-gradient-to-br from-white via-[#FFFBF7] to-neutral-50/40 px-5 py-6 md:px-7 md:py-7 print:border-neutral-200 print:bg-white print:via-white print:to-white">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#FFB600] via-[#EB8C00] to-[#DC6900] print:hidden"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-20 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#DC6900]/[0.06] blur-3xl no-print"
                aria-hidden
              />
              <div className="relative pl-1 md:pl-2">
                <div className="mb-5 flex flex-wrap items-center gap-3 md:mb-6">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[#DC6900] shadow-[0_1px_2px_rgba(45,45,45,0.06)] ring-1 ring-[#DC6900]/12 print:shadow-none">
                    <BarChart3 className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC6900]/90">
                      Financial health
                    </p>
                    <p className="mt-1 max-w-2xl text-[13px] leading-snug text-neutral-600">
                      Key performance indicators from the latest available filings and disclosures.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 xl:grid-cols-5">
                  {report.companySnapshot.financialMetrics.map((metric, i) => (
                    <div
                      key={i}
                      className="group relative min-w-0 overflow-hidden rounded-2xl border border-neutral-200/55 bg-white/95 px-4 py-3.5 shadow-[0_1px_2px_rgba(45,45,45,0.04)] ring-1 ring-neutral-950/[0.02] transition-[box-shadow,border-color] duration-200 hover:border-[#DC6900]/25 hover:shadow-[0_8px_24px_-12px_rgba(220,105,0,0.18)] print:break-inside-avoid print:shadow-none print:hover:border-neutral-200/55"
                    >
                      <span
                        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#FFB600]/90 via-[#EB8C00] to-[#DC6900] opacity-90 transition-opacity duration-200 group-hover:opacity-100 print:hidden"
                        aria-hidden
                      />
                      <div className="line-clamp-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                        {metric.label}
                      </div>
                      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-2 sm:gap-y-1">
                        <span className="inline-flex flex-wrap items-baseline gap-1 text-xl font-semibold tabular-nums tracking-tight text-neutral-950 md:text-[1.375rem] md:leading-none">
                          <RichText text={metric.value} />
                          <SourceLink url={metric.sourceUrl} />
                        </span>
                        {metric.trend ? (
                          <span
                            className={`inline-flex w-fit max-w-full shrink-0 rounded-xl px-2 py-0.5 text-[11px] font-semibold leading-tight ${
                              metric.trend.includes("down") || metric.trend.includes("-")
                                ? "bg-[#FDECEA] text-[#B3261E] ring-1 ring-[#E0301E]/15"
                                : "bg-[#FFF5EB] text-[#C45E05] ring-1 ring-[#DC6900]/18"
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
            </div>
            <div className="grid gap-5 p-4 md:grid-cols-2 md:gap-6 md:p-5 lg:p-6">
              <div className="min-w-0 md:col-span-2 lg:col-span-1 lg:row-span-2">
                <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Overview</h3>
                <p className="text-[0.875rem] leading-snug text-neutral-800">
                  <RichText text={report.companySnapshot.description} />
                </p>
              </div>
              <div className="min-w-0 border-t border-neutral-200/60 pt-4 md:border-t-0 md:pt-0 lg:border-t lg:border-neutral-200/60 lg:pt-4">
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
        </section>

        {/* 3. Peer Landscape */}
        <section className="relative z-10 scroll-mt-20">
          <ReportSectionHeading index={3} title="Peer Landscape" />

          {report.peerComparison && report.peerComparison.metrics.length > 0 && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-neutral-200/60 bg-gradient-to-b from-white to-neutral-50/60 px-4 py-3 md:px-5">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    {report.companyName} vs peer average
                  </div>
                  {report.peerComparison.peerSetSummary && (
                    <p className="mt-1 max-w-none text-[11px] leading-snug text-neutral-600">
                      <RichText text={report.peerComparison.peerSetSummary} />
                    </p>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/90">
                      <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:px-4">
                        Metric
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:px-4">
                        {report.companyName}
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:px-4">
                        Peer average
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:px-4">
                        Δ vs peers
                      </th>
                      <th className="hidden whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:table-cell md:px-4">
                        Read
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/80">
                    {report.peerComparison.metrics.map((m, i) => {
                      const deltaTone = (() => {
                        if (!m.delta) return "text-neutral-500";
                        const lower = m.delta.toLowerCase();
                        if (lower.includes("better") || lower.includes("ahead")) return "text-emerald-700";
                        if (lower.includes("worse") || lower.includes("behind")) return "text-[#E0301E]";
                        return "text-neutral-700";
                      })();
                      return (
                        <tr key={i} className="transition-colors hover:bg-neutral-50/70">
                          <td className="align-top px-3 py-2 text-[13px] font-semibold text-neutral-900 md:px-4">
                            <div>{m.label}</div>
                            {m.unit && (
                              <div className="text-[10px] font-normal text-neutral-500">{m.unit}</div>
                            )}
                          </td>
                          <td className="align-top px-3 py-2 text-right text-[13px] font-semibold tabular-nums text-neutral-900 md:px-4">
                            <RichText text={m.companyValue} />
                          </td>
                          <td className="align-top px-3 py-2 text-right text-[13px] font-medium tabular-nums text-neutral-700 md:px-4">
                            <RichText text={m.peerAverage} />
                          </td>
                          <td className={`align-top px-3 py-2 text-right text-[13px] font-medium tabular-nums md:px-4 ${deltaTone}`}>
                            {m.delta ? <RichText text={m.delta} /> : "—"}
                          </td>
                          <td className="hidden align-top px-3 py-2 text-[12px] leading-snug text-neutral-600 md:table-cell md:px-4">
                            {m.interpretation ? <RichText text={m.interpretation} /> : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-neutral-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/90">
                    <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:px-4">
                      Peer
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:px-4">
                      Rationale
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:px-4">
                      Growth
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:px-4">
                      Margin
                    </th>
                    <th className="min-w-[12rem] whitespace-nowrap py-2 pl-3 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 md:pl-4">
                      Key strength
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/80">
                  {report.peers.map((peer, i) => (
                    <tr key={i} className="transition-colors hover:bg-neutral-50/70">
                      <td className="align-top px-3 py-2.5 text-[13px] font-semibold text-neutral-900 md:px-4">
                        <span className="inline-flex items-center gap-1">
                          {peer.name}
                          <SourceLink url={peer.sourceUrl} />
                        </span>
                      </td>
                             <td className="align-top px-3 py-2.5 pr-3 text-[13px] leading-snug text-neutral-600 md:px-4">
                        <RichText text={peer.rationale} />
                      </td>
                      <td className="align-top px-3 py-2.5 text-right text-[13px] font-medium tabular-nums text-neutral-900 md:px-4">
                        {peer.revenueGrowth ? <RichText text={peer.revenueGrowth} /> : "—"}
                      </td>
                      <td className="align-top px-3 py-2.5 text-right text-[13px] font-medium tabular-nums text-neutral-900 md:px-4">
                        {peer.margin ? <RichText text={peer.margin} /> : "—"}
                      </td>
                      <td className="align-top py-2.5 pl-3 pr-4 text-[13px] leading-snug text-neutral-600 md:pl-4 md:pr-4">
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
          <section className="relative z-10 scroll-mt-20">
            <ReportSectionHeading index={4} title="Strategic Findings" />
            <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-2 xl:gap-5 print:grid-cols-1 print:gap-5">
              {report.topicFindings.map((finding, i) => (
                <div
                  key={i}
                  className="group rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow-md md:p-5"
                >
                  <h3 className="text-[1.05rem] font-semibold text-[#DC6900] transition-colors group-hover:text-[#C45E05]">
                    <span className="inline-flex items-center gap-1.5">
                      {finding.topic}
                      <SourceLink url={finding.sourceUrl} />
                    </span>
                  </h3>
                  <p className="mt-2 text-[0.875rem] leading-snug text-neutral-800">
                    <RichText text={finding.summary} />
                  </p>
                  <div className="mt-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3.5">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      <span className="inline-block h-1 w-8 rounded-full bg-gradient-to-r from-[#FFB600] to-[#DC6900]" aria-hidden />
                      Market signals
                    </div>
                    <ul className="space-y-1.5">
                      {finding.signals.map((signal, j) => (
                        <li key={j} className="flex items-start gap-2 text-[13px] leading-snug text-neutral-600">
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
        <section className="relative z-10 scroll-mt-20">
          <ReportSectionHeading index={5} title="Operational Pain Points" />
          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-1 print:gap-4">
            {report.painPoints.map((pain, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-[#E0301E]/[0.22] bg-white p-4 shadow-[0_1px_3px_rgba(224,48,30,0.06)] md:p-5"
              >
                <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#F25544] to-[#E0301E]" />
                <div className="relative flex justify-between gap-4">
                  <h3 className="pr-2 text-[1.05rem] font-semibold leading-snug text-neutral-900">{pain.title}</h3>
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#E0301E]/90" />
                </div>
                <div className="relative mt-4 flex flex-wrap gap-2">
                  <span className="rounded-xl border border-neutral-200/80 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                    {pain.businessFunction}
                  </span>
                  <span className="rounded-xl border border-neutral-200/80 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                    {pain.persona}
                  </span>
                </div>
                <p className="relative mt-3 text-[0.875rem] leading-snug text-neutral-800">
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
        <section className="relative z-10 scroll-mt-20">
          <ReportSectionHeading index={6} title="Technology Intervention" />
          <div className="space-y-4 md:space-y-5 print:space-y-4">
            {report.mapping.map((map, i) => {
              const solution = report.solutions.find((s) => s.name === map.solution);
              const isKb = solution?.source === "knowledge_base";
              const pain = report.painPoints.find((p) => p.title === map.painPoint);

              return (
                <div
                  key={i}
                  className="flex flex-col overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:flex-row print:flex-col"
                >
                  <div className="border-b border-neutral-200/60 bg-neutral-50/80 p-4 md:w-[34%] md:border-b-0 md:border-r md:border-neutral-200/60 print:w-full print:border-r-0 print:border-b print:border-neutral-200/60">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      <AlertTriangle className="h-3.5 w-3.5 text-neutral-400" />
                      Identified challenge
                    </div>
                    <div className="font-semibold leading-snug text-neutral-900">{map.painPoint}</div>
                    {pain && (pain.persona || pain.businessFunction) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {pain.businessFunction && (
                          <span className="rounded-xl border border-neutral-200/80 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                            {pain.businessFunction}
                          </span>
                        )}
                        {pain.persona && (
                          <span className="rounded-xl border border-neutral-200/80 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
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
                  <div className="flex-1 bg-white p-4 md:p-5">
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

                    <div className="mt-5 flex gap-4 rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-neutral-50/90 to-white p-5">
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

                    {solution?.roiCalculation && (
                      <div className="mt-5 overflow-hidden rounded-2xl border border-[#DC6900]/20 bg-gradient-to-br from-[#FFF8EF] to-white">
                        <div className="flex items-center gap-2 border-b border-[#DC6900]/15 bg-[#FFF5EB]/60 px-5 py-3">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-[#DC6900]/10 text-[#DC6900]" aria-hidden>
                            <TrendingUp className="h-3.5 w-3.5" />
                          </span>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#DC6900]">
                            Potential impact — worked ROI
                          </div>
                          <div className="ml-auto truncate text-[13px] font-semibold text-neutral-900">
                            <RichText text={solution.roiCalculation.annualValue} />
                          </div>
                        </div>
                        <dl className="grid gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-[140px_1fr]">
                          <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Baseline</dt>
                          <dd className="leading-relaxed text-neutral-800">
                            <RichText text={solution.roiCalculation.baseline} />
                          </dd>

                          <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">AI uplift</dt>
                          <dd className="leading-relaxed text-neutral-800">
                            <RichText text={solution.roiCalculation.uplift} />
                          </dd>

                          <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Calculation</dt>
                          <dd className="rounded-xl bg-white/80 px-3 py-2 font-mono text-[13px] leading-relaxed text-neutral-900 ring-1 ring-neutral-200/70">
                            <RichText text={solution.roiCalculation.formula} />
                          </dd>

                          {solution.roiCalculation.paybackPeriod && (
                            <>
                              <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Payback</dt>
                              <dd className="leading-relaxed text-neutral-800">
                                <RichText text={solution.roiCalculation.paybackPeriod} />
                              </dd>
                            </>
                          )}
                        </dl>

                        {solution.roiCalculation.assumptions && solution.roiCalculation.assumptions.length > 0 && (
                          <div className="border-t border-[#DC6900]/15 bg-white/60 px-5 py-3">
                            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                              Assumptions & sources
                            </div>
                            <ul className="space-y-1 text-[12px] leading-relaxed text-neutral-700">
                              {solution.roiCalculation.assumptions.map((a, j) => (
                                <li key={j} className="flex gap-2">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#DC6900]/50" aria-hidden />
                                  <span>
                                    <RichText text={a} />
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. Assumptions */}
        {report.assumptions && report.assumptions.length > 0 && (
          <section className="no-print relative z-10 scroll-mt-20 rounded-3xl border border-neutral-200/50 bg-white/70 px-6 py-7 shadow-[0_2px_12px_-4px_rgba(45,45,45,0.06)] backdrop-blur-sm md:px-8">
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
