import React from "react";
import { Sparkles, RefreshCw, CheckCircle2, RotateCcw, AlertOctagon, UserCheck, ShieldAlert, ShieldCheck, Lightbulb, FileSpreadsheet, Printer, XCircle, Info, FileText } from "lucide-react";
import { RecommendationResult, SignOffRecord, UserRole } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";
import { StatusBadge } from "./StatusBadge";

interface Props {
  onGenerate: () => void;
  isGenerating: boolean;
  recommendation: RecommendationResult | null;
  error: string | null;
  signoff: SignOffRecord | null;
  onApprove: () => void;
  onOverride: (vendorKey: string, reason: string, user: string) => void;
  onResetSignoff: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportWord?: () => void;
  onExportPPT?: () => void;
  userRole?: UserRole;
}

export function RecommendationAndSignoff({
  onGenerate,
  isGenerating,
  recommendation,
  error,
  signoff,
  onApprove,
  onOverride,
  onResetSignoff,
  onExportCSV,
  onExportPDF,
  onExportWord,
  onExportPPT,
  userRole = "Procurement Officer",
}: Props) {
  const [showOverrideModal, setShowOverrideModal] = React.useState(false);
  const [selectedOverrideVendor, setSelectedOverrideVendor] = React.useState("");
  const [overrideReason, setOverrideReason] = React.useState("");
  const [userName, setUserName] = React.useState("Senior Procurement Lead");

  const isReasonValid = overrideReason.trim().length >= 5;
  const isClientViewer = userRole === "Client Viewer";

  const handleConfirmOverride = () => {
    if (!selectedOverrideVendor || !isReasonValid) return;
    onOverride(selectedOverrideVendor, overrideReason.trim(), userName.trim() || "Procurement Officer");
    setShowOverrideModal(false);
  };

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Header & Primary Action Button (Blue/Teal Accent) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              Step 5: Executive Synthesis & Governance
            </span>
            <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
          </div>
          <h3 className="font-sans text-xl font-bold text-white tracking-tight mt-0.5">
            AI Recommendation & Structured Reasoning
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Synthesize key decision factors, analyze excluded vendor reasons, and log formal approval or justified overrides.
          </p>
        </div>

        {!isClientViewer && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="self-start md:self-auto font-sans flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-cyan-600/20 bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-amber-300" />
                <span>Generate AI Recommendation</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-950/80 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center gap-2 font-mono shadow-md">
          <AlertOctagon size={16} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Structured Recommendation Output */}
      {recommendation ? (
        <div className="glass-card-interactive border border-white/10 rounded-2xl p-5 mb-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status="low" label="Recommended Choice" size="sm" />
                <span className="font-mono text-xs font-bold text-white">
                  {VENDOR_NAMES[recommendation.recommendedVendor] || recommendation.recommendedVendor}
                </span>
              </div>
              <h4 className="font-sans text-lg font-bold text-white mt-1">
                {recommendation.recommendationTitle}
              </h4>
            </div>
          </div>

          <p className="text-sm text-zinc-200 leading-relaxed font-sans bg-zinc-950/60 p-4 rounded-xl border border-white/5">
            {recommendation.narrative}
          </p>

          {/* Section 6 requirement: drivingCriteria and excludedVendors */}
          <div className="grid md:grid-cols-2 gap-4 pt-1">
            {/* Driving Decision Criteria */}
            <div className="bg-zinc-950/80 border border-cyan-500/30 rounded-xl p-4 shadow-inner">
              <div className="flex items-center gap-2 mb-2.5 text-xs font-mono font-bold text-cyan-300">
                <CheckCircle2 size={15} className="text-cyan-400" />
                <span>Primary Decision Drivers (2-3 Key Criteria)</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-200">
                {recommendation.drivingCriteria && recommendation.drivingCriteria.length > 0 ? (
                  recommendation.drivingCriteria.map((criterion, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                      <span className="text-cyan-400 font-bold font-mono">#{idx + 1}</span>
                      <span>{criterion}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-400 italic">Criteria drivers loaded automatically.</li>
                )}
              </ul>
            </div>

            {/* Excluded Vendors & Rationale */}
            <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-4 shadow-inner">
              <div className="flex items-center gap-2 mb-2.5 text-xs font-mono font-bold text-amber-300">
                <XCircle size={15} className="text-amber-400" />
                <span>Excluded / Trailing Vendors & Rationale</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-200">
                {recommendation.excludedVendors && recommendation.excludedVendors.length > 0 ? (
                  recommendation.excludedVendors.map((ex, idx) => (
                    <li key={idx} className="bg-amber-950/20 p-2 rounded-lg border border-amber-500/20">
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <StatusBadge status="review" label={ex.vendorName} size="sm" showIcon={false} />
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-1 font-sans">
                        {ex.reason}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-400 italic">Trailing vendors evaluated.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            {/* Key Risks */}
            {recommendation.keyRisks && recommendation.keyRisks.length > 0 && (
              <div className="bg-zinc-950/80 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-mono font-bold text-red-400">
                  <ShieldAlert size={15} />
                  <span>Flagged Review & Risk Points</span>
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {recommendation.keyRisks.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Negotiation Levers */}
            {recommendation.negotiationTips && recommendation.negotiationTips.length > 0 && (
              <div className="bg-zinc-950/80 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-mono font-bold text-amber-400">
                  <Lightbulb size={15} />
                  <span>Procurement Negotiation Levers</span>
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {recommendation.negotiationTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card border border-white/10 rounded-2xl p-8 text-center text-zinc-400 mb-6">
          <p className="text-sm font-sans">
            Click "Generate AI Recommendation" above to synthesize an automated executive narrative, driver list, and risk review.
          </p>
        </div>
      )}

      {/* Human Sign-Off / Approval Control */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-cyan-400" />
              <h4 className="font-sans font-bold text-base text-white">
                Human Governance & Approval Status
              </h4>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Formal procurement decisions require explicit human authorization before purchase order issuance.
            </p>
          </div>

          {!signoff ? (
            !isClientViewer ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={onApprove}
                  disabled={!recommendation}
                  className={`font-sans flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md ${
                    recommendation
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-600/30"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>Approve Recommendation</span>
                </button>

                <button
                  onClick={() => setShowOverrideModal(true)}
                  disabled={!recommendation}
                  className={`font-sans flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition-all ${
                    recommendation ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <RotateCcw size={16} />
                  <span>Override Decision</span>
                </button>
              </div>
            ) : (
              <span className="font-mono text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400">
                Read-Only (Client View)
              </span>
            )
          ) : (
            <div className="flex items-center gap-3">
              {!isClientViewer && (
                <button
                  onClick={onResetSignoff}
                  className="font-mono text-xs text-zinc-400 underline hover:text-white transition-colors"
                >
                  Reset Approval State
                </button>
              )}
            </div>
          )}
        </div>

        {/* Display Active Stamp if Signed Off */}
        {signoff && (
          <div
            className="mt-4 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/80 shadow-2xl"
            style={{
              borderColor: signoff.status === "approved" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
            }}
          >
            <div className="flex items-center gap-4">
              <StatusBadge
                status={signoff.status === "approved" ? "low" : "high"}
                label={signoff.status === "approved" ? "APPROVED" : "OVERRIDDEN"}
                size="md"
              />

              <div>
                <div className="text-sm font-bold text-white">
                  Selected Vendor: {VENDOR_NAMES[signoff.vendor] || signoff.vendor}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Authorized by <span className="font-semibold text-white">{signoff.signoffUser}</span> on {signoff.time}
                </div>
                <div className="text-xs text-zinc-300 italic mt-1 bg-zinc-900 p-2 rounded-lg border border-white/10">
                  "{signoff.reason}"
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Trail & Enterprise Template Export Action Section */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
              Enterprise Deliverables & Export
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">
              Generate Ma'aden reporting standard Word (.doc) and PowerPoint (.txt/.ppt) templates or download CSV/PDF audit packages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onExportWord && (
              <button
                onClick={onExportWord}
                className="font-sans flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-950 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 transition-all shadow-md cursor-pointer"
                title="Download Ma'aden Word Report (.doc)"
              >
                <FileText size={14} className="text-cyan-400" />
                <span>Word Deliverable</span>
              </button>
            )}

            {onExportPPT && (
              <button
                onClick={onExportPPT}
                className="font-sans flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-950 border border-amber-500/30 text-amber-300 hover:bg-amber-900 transition-all shadow-md cursor-pointer"
                title="Download Ma'aden PowerPoint Deck (.ppt)"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>PPT Slides</span>
              </button>
            )}

            <button
              onClick={onExportCSV}
              className="font-sans flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
              title="Download CSV Audit Log"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              <span>CSV Log</span>
            </button>

            <button
              onClick={onExportPDF}
              className="font-sans flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-all shadow-md cursor-pointer"
              title="Print or Save PDF Executive Summary"
            >
              <Printer size={14} />
              <span>PDF Executive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Override Modal with Requirement #4 Mandatory Reason */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="font-sans font-bold text-lg text-white mb-1">
              Override AI Recommendation
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              Select an alternative vendor and provide a mandatory business rationale for governance audit logging.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-zinc-300 mb-1">
                  Sign-Off Authority Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-white/10 bg-zinc-900 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Your Name / Role"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-zinc-300 mb-1">
                  Select Override Vendor
                </label>
                <select
                  value={selectedOverrideVendor}
                  onChange={(e) => setSelectedOverrideVendor(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-white/10 bg-zinc-900 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  <option value="">Choose a vendor...</option>
                  {Object.keys(VENDOR_NAMES).map((k) => (
                    <option key={k} value={k}>
                      {VENDOR_NAMES[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono font-medium text-zinc-300">
                    Business Rationale <span className="text-red-400 font-bold">*</span>
                  </label>
                  <span className={`text-[10px] font-mono ${isReasonValid ? "text-emerald-400" : "text-amber-400"}`}>
                    {isReasonValid ? "Justification Valid" : "Mandatory (Min 5 chars)"}
                  </span>
                </div>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className={`w-full h-24 p-2.5 text-xs font-mono rounded-xl border bg-zinc-900 text-white focus:ring-2 outline-none resize-none transition-colors ${
                    isReasonValid ? "border-emerald-500/50 focus:ring-emerald-500" : "border-red-500/50 focus:ring-red-500"
                  }`}
                  placeholder="e.g. Budget ceiling this quarter favors lower upfront cost, or existing maintenance framework agreement with vendor."
                />
                {!isReasonValid && (
                  <p className="text-[10px] font-mono text-red-400 mt-1 flex items-center gap-1">
                    <Info size={11} /> You must enter a text reason before this override can be submitted.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 text-xs font-mono rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={!selectedOverrideVendor || !isReasonValid}
                className="px-4 py-2 text-xs font-mono font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-600/30 cursor-pointer"
              >
                Submit Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

