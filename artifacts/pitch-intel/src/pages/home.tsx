import { useState, useEffect } from "react";
import { ResearchForm } from "@/components/research-form";
import { ReportView } from "@/components/report-view";
import { ResearchReport } from "@workspace/api-client-react";
import {
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
  Building2,
  LineChart,
  Library,
} from "lucide-react";

export default function Home() {
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Scroll to top when report changes
  useEffect(() => {
    if (report) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [report]);

  const showCollapseToggle = !!report;

  return (
    <div className="relative flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden print:!h-auto print:!max-h-none print:!min-h-0 print:!overflow-visible">
      {/* Left Panel: Input Brief */}
      <div
        className={`relative bg-white transition-all duration-500 ease-in-out z-10 shadow-[1px_0_0_rgb(235,235,235),12px_0_48px_rgba(45,45,45,0.04)] print:hidden ${
          report
            ? collapsed
              ? 'w-full lg:w-0 lg:shrink-0 overflow-hidden border-r-0'
              : 'w-full lg:w-[400px] xl:w-[450px] shrink-0 border-r border-[#E5E5E5] overflow-y-auto'
            : 'w-full lg:w-1/2 max-w-2xl mx-auto overflow-y-auto'
        }`}
        aria-hidden={collapsed}
      >
        <div className="relative p-8 md:p-10 lg:p-12">
          {!report && (
            <header className="relative mb-12 pb-12 border-b border-[#EBEBEB]">
              <div className="absolute left-0 top-2 bottom-14 w-[3px] rounded-full bg-gradient-to-b from-[#DC6900] via-[#EB8C00] to-[#DC6900]/30 hidden sm:block" aria-hidden />

              <div className="sm:pl-5 space-y-6">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="inline-flex items-center rounded-full bg-[#FFF8F0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B4510] ring-1 ring-[#DC6900]/15">
                    Strategic briefing
                  </span>
                  <span className="text-xs text-[#969696]" aria-hidden>
                    ·
                  </span>
                  <span className="text-[13px] text-[#696969]">
                    Guided inputs · GenAI-enhanced synthesis
                  </span>
                </div>

                <div className="space-y-4 max-w-xl">
                  <h1 className="text-[1.875rem] sm:text-[2rem] lg:text-[2.125rem] font-semibold text-[#1F1F1F] tracking-[-0.02em] leading-[1.15]">
                    Client Intelligence
                  </h1>
                  <p className="text-[15px] sm:text-base text-[#5C5C5C] leading-relaxed font-normal">
                    Synthesize market context, peer benchmarks, and proprietary PwC perspective into an
                    executive-ready narrative built for stakeholder conversations.
                  </p>
                </div>

                <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-2 list-none">
                  {[
                    { icon: Building2, label: "Company & region" },
                    { icon: LineChart, label: "Benchmarks & topics" },
                    { icon: Library, label: "Your solution catalog" },
                  ].map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]/80 px-3 py-2 text-[13px] text-[#474747]"
                    >
                      <Icon className="h-[15px] w-[15px] shrink-0 text-[#DC6900]" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </header>
          )}

          <ResearchForm onSuccess={setReport} />
        </div>
      </div>

      {/* Collapse / Expand toggle */}
      {showCollapseToggle && (
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand input panel' : 'Collapse input panel'}
          aria-expanded={!collapsed}
          className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 items-center justify-center h-12 w-6 bg-white border border-[#E5E5E5] border-l-0 rounded-r-md shadow-sm hover:bg-[#FAFAFA] transition-all duration-500 ease-in-out print:hidden ${
            collapsed ? 'left-0' : 'left-[400px] xl:left-[450px]'
          }`}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-[#696969]" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-[#696969]" />
          )}
        </button>
      )}

      {/* Right Panel: Report Canvas */}
      <div className={`flex-1 bg-[#FAFAFA] overflow-y-auto transition-all duration-500 ease-in-out ${report ? 'opacity-100 block' : 'opacity-0 hidden lg:block lg:opacity-100'} print:!block print:!opacity-100 print:!w-full print:!overflow-visible`}>
        {report ? (
          <div className="p-6 md:p-10 lg:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700 print:p-0">
            <ReportView report={report} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-12 text-center relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#FFB600]/5 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#DC6900]/5 blur-3xl" />

            <div className="relative z-10 max-w-md bg-white/60 backdrop-blur-sm p-10 border border-[#E5E5E5]">
              <div className="mx-auto w-16 h-16 bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center mb-6">
                <FileText className="h-8 w-8 text-[#DC6900]" />
              </div>
              <h3 className="text-xl font-bold text-[#2D2D2D] mb-3">Ready to Synthesize</h3>
              <p className="text-[#696969] leading-relaxed mb-6">
                Enter target company details and upload proprietary solutions to generate a customized, boardroom-ready consulting deliverable.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#DC6900] uppercase tracking-wider bg-[#FFF5EB] px-3 py-1.5 border border-[#DC6900]/20">
                <Info className="h-4 w-4" /> PwC GenAI Standards Applied
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
