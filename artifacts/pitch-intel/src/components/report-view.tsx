import { Printer, Download, ArrowRight, Building, Users, AlertTriangle, Lightbulb, MapPin, Calendar, Briefcase, Zap, Shield, TrendingUp, CheckCircle, Database } from "lucide-react";
import { ResearchReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function ReportView({ report }: { report: ResearchReport }) {
  const handlePrint = () => window.print();

  return (
    <div className="bg-white mx-auto max-w-5xl border border-[#E5E5E5] shadow-sm mb-12">
      {/* Report Header */}
      <div className="border-b-4 border-[#DC6900] p-10 md:p-16 relative overflow-hidden bg-[#FAFAFA]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FAFAFA] border-l border-b border-[#E5E5E5] transform rotate-45 translate-x-32 -translate-y-32 no-print opacity-50" />
        
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="text-sm font-bold tracking-widest text-[#DC6900] uppercase mb-4">Strategic Intelligence Brief</div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#2D2D2D] leading-tight mb-2">{report.companyName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[#696969] mt-4">
              <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {report.country}</div>
              {report.persona && (
                <>
                  <div className="w-1 h-1 rounded-full bg-[#E5E5E5]" />
                  <div className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {report.persona}</div>
                </>
              )}
              <div className="w-1 h-1 rounded-full bg-[#E5E5E5]" />
              <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(report.generatedAt).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="no-print hidden sm:flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-none border-[#E5E5E5] text-[#2D2D2D] hover:bg-[#FAFAFA] hover:text-[#DC6900]">
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        </div>
      </div>

      <div className="p-10 md:p-16 space-y-16">
        {/* 1. Executive Summary */}
        <section className="scroll-mt-20">
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-2xl font-light text-[#E5E5E5]">01</div>
            <h2 className="text-2xl font-bold text-[#2D2D2D]">Executive Summary</h2>
          </div>
          <div className="prose prose-neutral max-w-none text-[#2D2D2D] text-lg leading-relaxed border-l-2 border-[#FFB600] pl-6 py-2">
            {report.executiveSummary}
          </div>
        </section>

        {/* 2. Company Snapshot */}
        <section className="scroll-mt-20">
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-2xl font-light text-[#E5E5E5]">02</div>
            <h2 className="text-2xl font-bold text-[#2D2D2D]">Company Snapshot</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#696969] uppercase tracking-wide mb-3">Overview</h3>
                <p className="text-[#2D2D2D] leading-relaxed">{report.companySnapshot.description}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-[#696969] uppercase tracking-wide mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#DC6900]"/> Revenue Streams</h3>
                  <ul className="space-y-2">
                    {report.companySnapshot.revenueStreams.map((stream, i) => (
                      <li key={i} className="text-[#2D2D2D] flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-[#E45C2B] rounded-full mt-2 shrink-0" />
                        <span>{stream}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#696969] uppercase tracking-wide mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[#DC6900]"/> Strategic Initiatives</h3>
                  <ul className="space-y-2">
                    {report.companySnapshot.strategicInitiatives.map((init, i) => (
                      <li key={i} className="text-[#2D2D2D] flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-[#FFB600] rounded-full mt-2 shrink-0" />
                        <span>{init}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-[#FAFAFA] p-6 border border-[#E5E5E5]">
              <h3 className="text-sm font-bold text-[#696969] uppercase tracking-wide mb-4">Financial Health</h3>
              <div className="space-y-4">
                {report.companySnapshot.financialMetrics.map((metric, i) => (
                  <div key={i} className="pb-4 border-b border-[#E5E5E5] last:border-0 last:pb-0">
                    <div className="text-sm text-[#696969] mb-1">{metric.label}</div>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl font-bold text-[#2D2D2D]">{metric.value}</div>
                      {metric.trend && (
                        <div className={`text-sm font-medium ${metric.trend.includes('down') || metric.trend.includes('-') ? 'text-[#E0301E]' : 'text-[#DC6900]'}`}>
                          {metric.trend}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Peer Landscape */}
        <section className="scroll-mt-20 page-break">
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-2xl font-light text-[#E5E5E5]">03</div>
            <h2 className="text-2xl font-bold text-[#2D2D2D]">Peer Landscape</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-[#2D2D2D]">
                  <th className="py-4 text-sm font-bold text-[#696969] uppercase tracking-wide">Peer</th>
                  <th className="py-4 text-sm font-bold text-[#696969] uppercase tracking-wide">Rationale</th>
                  <th className="py-4 text-sm font-bold text-[#696969] uppercase tracking-wide text-right">Growth</th>
                  <th className="py-4 text-sm font-bold text-[#696969] uppercase tracking-wide text-right">Margin</th>
                  <th className="py-4 text-sm font-bold text-[#696969] uppercase tracking-wide w-1/4 pl-4">Key Strength</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {report.peers.map((peer, i) => (
                  <tr key={i} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-4 font-bold text-[#2D2D2D] align-top">{peer.name}</td>
                    <td className="py-4 text-[#696969] text-sm align-top pr-4">{peer.rationale}</td>
                    <td className="py-4 text-[#2D2D2D] font-medium align-top text-right whitespace-nowrap">{peer.revenueGrowth || '—'}</td>
                    <td className="py-4 text-[#2D2D2D] font-medium align-top text-right whitespace-nowrap">{peer.margin || '—'}</td>
                    <td className="py-4 text-[#696969] text-sm align-top pl-4">{peer.strength || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Strategic Topic Findings */}
        {report.topicFindings.length > 0 && (
          <section className="scroll-mt-20">
            <div className="flex items-baseline gap-4 mb-6">
              <div className="text-2xl font-light text-[#E5E5E5]">04</div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">Strategic Findings</h2>
            </div>
            <div className="grid gap-6">
              {report.topicFindings.map((finding, i) => (
                <div key={i} className="border border-[#E5E5E5] bg-white p-6">
                  <h3 className="text-lg font-bold text-[#DC6900] mb-3">{finding.topic}</h3>
                  <p className="text-[#2D2D2D] mb-4 leading-relaxed">{finding.summary}</p>
                  <div className="bg-[#FAFAFA] p-4 text-sm border-l-2 border-[#E5E5E5]">
                    <div className="font-bold text-[#696969] mb-2 uppercase tracking-wider text-xs">Market Signals</div>
                    <ul className="space-y-1">
                      {finding.signals.map((signal, j) => (
                        <li key={j} className="text-[#696969] flex items-start gap-2">
                          <span className="text-[#DC6900] font-bold">›</span> {signal}
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
        <section className="scroll-mt-20 page-break">
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-2xl font-light text-[#E5E5E5]">05</div>
            <h2 className="text-2xl font-bold text-[#2D2D2D]">Operational Pain Points</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {report.painPoints.map((pain, i) => (
              <div key={i} className="border border-[#E0301E]/20 bg-white p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#E0301E]" />
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-[#2D2D2D] pr-4">{pain.title}</h3>
                  <AlertTriangle className="h-5 w-5 text-[#E0301E] shrink-0" />
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-bold text-[#696969] uppercase tracking-wide">
                    {pain.businessFunction}
                  </span>
                  <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-bold text-[#696969] uppercase tracking-wide">
                    {pain.persona}
                  </span>
                </div>
                <p className="text-[#2D2D2D] mb-4 text-sm leading-relaxed">{pain.description}</p>
                <div className="text-sm text-[#696969] border-t border-[#E5E5E5] pt-3">
                  <span className="font-bold text-[#2D2D2D]">Evidence: </span>
                  {pain.evidence}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. AI Solutions Mapping */}
        <section className="scroll-mt-20">
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-2xl font-light text-[#E5E5E5]">06</div>
            <h2 className="text-2xl font-bold text-[#2D2D2D]">Technology Intervention</h2>
          </div>
          
          <div className="space-y-8">
            {report.mapping.map((map, i) => {
              const solution = report.solutions.find(s => s.name === map.solution);
              const isKb = solution?.source === "knowledge_base";
              
              return (
                <div key={i} className="border border-[#E5E5E5] bg-white flex flex-col md:flex-row">
                  {/* Problem Side */}
                  <div className="md:w-1/3 bg-[#FAFAFA] p-6 border-b md:border-b-0 md:border-r border-[#E5E5E5]">
                    <div className="text-xs font-bold text-[#696969] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Identified Challenge
                    </div>
                    <div className="font-bold text-[#2D2D2D] mb-2">{map.painPoint}</div>
                  </div>
                  
                  {/* Solution Side */}
                  <div className="md:w-2/3 p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs font-bold text-[#DC6900] uppercase tracking-wide mb-1 flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" /> Proposed Solution
                        </div>
                        <div className="text-xl font-bold text-[#2D2D2D]">{map.solution}</div>
                      </div>
                      {isKb ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFF5EB] text-[#DC6900] text-xs font-bold border border-[#DC6900]/30 whitespace-nowrap">
                          <Database className="h-3 w-3" /> PwC Asset
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAFAFA] text-[#696969] text-xs font-bold border border-[#E5E5E5] whitespace-nowrap">
                          Market Solution
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[#2D2D2D] text-sm leading-relaxed mb-4">
                      {solution?.howAiHelps || "Strategic application of advanced analytics and generative models to optimize this operational workflow."}
                    </p>
                    
                    <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 flex gap-3">
                      <TrendingUp className="h-5 w-5 text-[#DC6900] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#696969] uppercase tracking-wide mb-1">Business Value</div>
                        <div className="text-sm font-medium text-[#2D2D2D]">{map.businessValue}</div>
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
          <section className="scroll-mt-20 pt-8 border-t border-[#E5E5E5] pb-8 no-print">
            <h3 className="text-sm font-bold text-[#696969] uppercase tracking-wide mb-4">Methodological Assumptions</h3>
            <ul className="text-xs text-[#696969] space-y-2 list-disc pl-4">
              {report.assumptions.map((assump, i) => (
                <li key={i}>{assump}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
      
      {/* Footer Print */}
      <div className="hidden print-only py-8 border-t border-[#E5E5E5] text-center text-xs text-[#696969] font-bold tracking-widest uppercase">
        CONFIDENTIAL - INTERNAL PWC USE ONLY
      </div>
    </div>
  );
}
