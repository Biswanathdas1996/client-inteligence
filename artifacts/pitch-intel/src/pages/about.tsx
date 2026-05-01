export default function About() {
  return (
    <div className="flex-1 overflow-auto bg-[#FAFAFA] p-8 md:p-12">
      <div className="max-w-3xl mx-auto bg-white border border-[#E5E5E5] p-10 md:p-16 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-[#2D2D2D] mb-6">Methodology & Standards</h1>
        
        <div className="prose prose-sm md:prose-base prose-neutral max-w-none text-[#2D2D2D]">
          <p className="lead text-lg text-[#696969] mb-8">
            The PwC Client Intelligence platform leverages advanced generative AI to synthesize market data, peer benchmarks, and proprietary knowledge base solutions into executive-ready strategic reports.
          </p>

          <h2 className="text-xl font-bold text-[#DC6900] mt-8 mb-4 border-b border-[#E5E5E5] pb-2">Our AI Principles</h2>
          <ul className="space-y-4 mb-8 list-none pl-0">
            <li className="pl-4 border-l-2 border-[#FFB600]">
              <strong>Accuracy & Verification:</strong> All generated insights must be cross-referenced with verified financial disclosures and market reports. The tool highlights assumptions where explicit data is unavailable.
            </li>
            <li className="pl-4 border-l-2 border-[#DC6900]">
              <strong>Security & Confidentiality:</strong> Client data, including uploaded Knowledge Base files, are processed securely and are never used to train foundational public models.
            </li>
            <li className="pl-4 border-l-2 border-[#E45C2B]">
              <strong>Actionable Intelligence:</strong> AI outputs are structured to directly map identified business pain points to concrete, value-driving technological solutions.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-[#DC6900] mt-8 mb-4 border-b border-[#E5E5E5] pb-2">Knowledge Base Integration</h2>
          <p className="mb-4">
            Consultants can enhance the intelligence report by providing a proprietary CSV or Excel (.xlsx) file containing curated solutions. 
            The system intelligently matches the client's generated pain points with these provided solutions before falling back on general market solutions.
          </p>
          <p className="mb-8">
            This ensures that PwC recommendations are always tailored, proprietary, and directly aligned with the firm's strategic capabilities.
          </p>

          <h2 className="text-xl font-bold text-[#DC6900] mt-8 mb-4 border-b border-[#E5E5E5] pb-2">Report Structure</h2>
          <p className="mb-4">Generated reports follow a strict, boardroom-ready structure:</p>
          <ol className="space-y-2 mb-8 text-[#696969] list-decimal pl-5">
            <li><strong>Executive Summary:</strong> High-level strategic overview tailored to the selected persona.</li>
            <li><strong>Company Snapshot:</strong> Financial metrics, revenue streams, and strategic initiatives.</li>
            <li><strong>Peer Landscape:</strong> Direct comparison against key competitors.</li>
            <li><strong>Topic Findings:</strong> Deep dives into selected areas of interest (e.g., Risk, Supply Chain).</li>
            <li><strong>Business Pain Points:</strong> Verified operational and strategic challenges.</li>
            <li><strong>AI Solutions:</strong> Recommended interventions mapped to pain points.</li>
            <li><strong>Value Mapping:</strong> Explicit linkage between problem, solution, and business impact.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
