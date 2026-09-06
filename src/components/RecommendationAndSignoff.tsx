import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  AlertOctagon,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Lightbulb,
  FileSpreadsheet,
  Printer,
  XCircle,
  Info,
  FileText,
  Lock,
  Unlock,
  Building2,
  DollarSign,
  Briefcase,
  Mail,
  Send,
  ExternalLink,
  Eye,
  QrCode,
  Shield,
  Check,
  Copy,
} from "lucide-react";
import {
  RecommendationResult,
  SignOffRecord,
  UserRole,
  MultiTierSignoff,
  VendorBinaryGateMap,
  VendorScores,
} from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";
import { StatusBadge } from "./StatusBadge";
import { AppLanguage, TRANSLATIONS } from "../translations";
import { generateAuditProof } from "../cryptoAudit";

interface Props {
  onGenerate: () => void;
  isGenerating: boolean;
  recommendation: RecommendationResult | null;
  error: string | null;
  signoff: SignOffRecord | null;
  multiTierSignoff?: MultiTierSignoff;
  onApproveTier?: (tier: "tier1Tech" | "tier2Finance" | "tier3Executive", signee: string, comments?: string) => void;
  onResetMultiTier?: () => void;
  onApprove: () => void;
  onOverride: (vendorKey: string, reason: string, user: string) => void;
  onResetSignoff: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportWord?: () => void;
  onExportPPT?: () => void;
  onOpenOutlookMail?: () => void;
  onOpenExportPreview?: (format?: "pdf" | "word" | "ppt" | "csv") => void;
  userRole?: UserRole;
  binaryGates?: VendorBinaryGateMap;
  scores?: VendorScores;
  lang?: AppLanguage;
}

export function RecommendationAndSignoff({
  onGenerate,
  isGenerating,
  recommendation,
  error,
  signoff,
  multiTierSignoff,
  onApproveTier,
  onResetMultiTier,
  onApprove,
  onOverride,
  onResetSignoff,
  onExportCSV,
  onExportPDF,
  onExportWord,
  onExportPPT,
  onOpenOutlookMail,
  onOpenExportPreview,
  userRole = "Procurement Officer",
  binaryGates = {},
  scores = {},
  lang = "en",
}: Props) {
  const isAr = lang === "ar";
  const t = TRANSLATIONS[lang];
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedOverrideVendor, setSelectedOverrideVendor] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [userName, setUserName] = useState("Senior Procurement Officer");
  const [activeTierComment, setActiveTierComment] = useState<string>("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [hasCopiedHash, setHasCopiedHash] = useState(false);

  const isReasonValid = overrideReason.trim().length >= 5;
  const isClientViewer = userRole === "Client Viewer";

  const targetVendorKey =
    signoff?.vendor ||
    multiTierSignoff?.awardedVendorKey ||
    recommendation?.recommendedVendor ||
    "meridian";

  const isTargetVendorGatedOut =
    binaryGates[targetVendorKey]?.failoverVerified === false ||
    binaryGates[targetVendorKey]?.complianceCertified === false;

  const auditProof = React.useMemo(() => {
    return generateAuditProof(
      "RFQ-2026-0803",
      targetVendorKey,
      scores,
      { price: 40, leadTime: 25, warranty: 20 },
      signoff?.signoffUser || "Dr. Tariq Al-Ghamdi (VP Sourcing)",
      signoff?.status || "APPROVED"
    );
  }, [targetVendorKey, scores, signoff]);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(auditProof.fingerprint);
    setHasCopiedHash(true);
    setTimeout(() => setHasCopiedHash(false), 2000);
  };

  const handleConfirmOverride = () => {
    if (!selectedOverrideVendor || !isReasonValid) return;
    onOverride(selectedOverrideVendor, overrideReason.trim(), userName.trim() || "Procurement Officer");
    setShowOverrideModal(false);
  };

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Header & Primary Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              Executive Synthesis & Multi-Tier Governance
            </span>
            <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
          </div>
          <h3 className="font-sans text-xl font-bold text-white tracking-tight mt-0.5">
            AI Recommendation & Multi-Tier Sign-Off Matrix
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Synthesize key decision factors, analyze excluded vendor reasons, and log formal 3-tier approval or justified overrides.
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

      {/* Mandatory Gate Blocker Alert if winning candidate has failed gates */}
      {isTargetVendorGatedOut && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border-2 border-red-500/50 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertOctagon size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-sans font-bold text-red-200 text-sm">
                Mandatory Gate Disqualification: {VENDOR_NAMES[targetVendorKey]}
              </h4>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                This vendor failed the <strong>Strict Binary Gatekeeper</strong> check (Failover: NO / Compliance: NO). Standard PO generation is blocked. To proceed with this vendor, an Executive Override with formal risk rationale must be submitted.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Structured Recommendation Output */}
      {recommendation ? (
        <div className="glass-card-interactive border border-white/10 rounded-2xl p-5 mb-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge
                  status={isTargetVendorGatedOut ? "high" : "low"}
                  label={isTargetVendorGatedOut ? "Gate Blocked" : "Recommended Choice"}
                  size="sm"
                />
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

          <div className="grid md:grid-cols-2 gap-4 pt-1">
            {/* Driving Decision Criteria */}
            <div className="bg-zinc-950/80 border border-cyan-500/30 rounded-xl p-4 shadow-inner">
              <div className="flex items-center gap-2 mb-2.5 text-xs font-mono font-bold text-cyan-300">
                <CheckCircle2 size={15} className="text-cyan-400" />
                <span>Primary Decision Drivers</span>
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

      {/* MULTI-TIER SEQUENTIAL SIGN-OFF HIERARCHY */}
      {multiTierSignoff && onApproveTier && (
        <div className="pt-4 border-t border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-cyan-400" />
                <h4 className="font-sans font-bold text-base text-white">
                  3-Tier Sequential Sign-Off Governance Hierarchy
                </h4>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Requires sequential verification: Technical Lead &rarr; Finance Director &rarr; VP of Procurement.
              </p>
            </div>

            {onResetMultiTier && !isClientViewer && (
              <button
                onClick={onResetMultiTier}
                className="text-xs font-mono text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Reset Approval Pipeline
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Tier 1: Technical Lead */}
            <div className={`p-4 rounded-xl border ${
              multiTierSignoff.tier1Tech.status === "approved"
                ? "bg-emerald-950/30 border-emerald-500/50"
                : "bg-zinc-950/70 border-white/10"
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono uppercase font-bold text-cyan-300">
                  Tier 1: Technical Lead
                </span>
                {multiTierSignoff.tier1Tech.status === "approved" ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    APPROVED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 mb-3">
                Certifies failover clustering, 24/7 continuous availability, and technical spec compliance.
              </p>
              {multiTierSignoff.tier1Tech.status === "approved" ? (
                <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
                  <div>Signed by: <strong className="text-white">{multiTierSignoff.tier1Tech.signeeName}</strong></div>
                  <div className="text-[10px] text-zinc-500">{multiTierSignoff.tier1Tech.timestamp}</div>
                </div>
              ) : (
                !isClientViewer && (
                  <button
                    onClick={() => onApproveTier("tier1Tech", "Lead Systems Architect")}
                    className="w-full py-2 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
                  >
                    Sign Technical Approval
                  </button>
                )
              )}
            </div>

            {/* Tier 2: Finance Director */}
            <div className={`p-4 rounded-xl border ${
              multiTierSignoff.tier2Finance.status === "approved"
                ? "bg-emerald-950/30 border-emerald-500/50"
                : multiTierSignoff.tier1Tech.status !== "approved"
                ? "bg-zinc-950/40 border-white/5 opacity-60"
                : "bg-zinc-950/70 border-white/10"
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono uppercase font-bold text-amber-300">
                  Tier 2: Finance Director
                </span>
                {multiTierSignoff.tier2Finance.status === "approved" ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    APPROVED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 mb-3">
                Validates CAPEX allocation, 5-Year TCO budget commitment, and payment milestones.
              </p>
              {multiTierSignoff.tier2Finance.status === "approved" ? (
                <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
                  <div>Signed by: <strong className="text-white">{multiTierSignoff.tier2Finance.signeeName}</strong></div>
                  <div className="text-[10px] text-zinc-500">{multiTierSignoff.tier2Finance.timestamp}</div>
                </div>
              ) : (
                !isClientViewer && (
                  <button
                    onClick={() => onApproveTier("tier2Finance", "Director of Financial Planning")}
                    disabled={multiTierSignoff.tier1Tech.status !== "approved"}
                    className="w-full py-2 rounded-xl text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-amber-600/30 cursor-pointer"
                  >
                    Sign Finance Approval
                  </button>
                )
              )}
            </div>

            {/* Tier 3: VP of Procurement */}
            <div className={`p-4 rounded-xl border ${
              multiTierSignoff.tier3Executive.status === "approved"
                ? "bg-emerald-950/30 border-emerald-500/50"
                : multiTierSignoff.tier2Finance.status !== "approved"
                ? "bg-zinc-950/40 border-white/5 opacity-60"
                : "bg-zinc-950/70 border-white/10"
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono uppercase font-bold text-purple-300">
                  Tier 3: VP of Procurement
                </span>
                {multiTierSignoff.tier3Executive.status === "approved" ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    AWARDED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 mb-3">
                Authorizes binding Purchase Order contract issuance and vendor onboarding.
              </p>
              {multiTierSignoff.tier3Executive.status === "approved" ? (
                <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
                  <div>Signed by: <strong className="text-white">{multiTierSignoff.tier3Executive.signeeName}</strong></div>
                  <div className="text-[10px] text-zinc-500">{multiTierSignoff.tier3Executive.timestamp}</div>
                </div>
              ) : (
                !isClientViewer && (
                  <button
                    onClick={() => onApproveTier("tier3Executive", "VP of Strategic Sourcing")}
                    disabled={multiTierSignoff.tier2Finance.status !== "approved"}
                    className="w-full py-2 rounded-xl text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                  >
                    Execute Final Award PO
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Human Sign-Off / Approval Control Fallback / Override Options */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-cyan-400" />
              <h4 className="font-sans font-bold text-base text-white">
                Human Governance & Override Authorization
              </h4>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Override AI selection or log an exception with mandatory justification.
            </p>
          </div>

          {!signoff ? (
            !isClientViewer ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={onApprove}
                  disabled={!recommendation}
                  className={`font-sans flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md ${
                    recommendation
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-600/30"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>Quick Approve</span>
                </button>

                <button
                  onClick={() => setShowOverrideModal(true)}
                  disabled={!recommendation}
                  className={`font-sans flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition-all ${
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

            {onOpenOutlookMail && (
              <button
                onClick={onOpenOutlookMail}
                className="self-stretch sm:self-auto font-sans flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transition-all shadow-lg shadow-blue-600/30 cursor-pointer shrink-0"
                title="Send official award notice via Outlook Mail"
              >
                <Mail size={15} />
                <span>Send via Outlook Mail</span>
              </button>
            )}
          </div>
        )}

        {/* Cryptographic Audit Proof & Verification QR Seal Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-zinc-950/90 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Cryptographic Audit Proof & Verification Seal
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  SHA-256
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-zinc-400 text-[11px] font-mono">
                <span>Fingerprint: <strong className="text-cyan-300">{auditProof.shortFingerprint}</strong></span>
                <button
                  onClick={handleCopyHash}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  title="Copy full 64-character SHA-256 hash"
                >
                  {hasCopiedHash ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{hasCopiedHash ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="self-start sm:self-auto font-sans flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 transition-all cursor-pointer shrink-0"
          >
            <QrCode size={14} className="text-cyan-400" />
            <span>Inspect QR Seal</span>
          </button>
        </div>

        {/* Audit Trail & Enterprise Template Export Action Section */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
              Enterprise Deliverables & Outlook Gateway
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">
              Send approval notifications via Outlook Mail, generate Ma'aden Word & PPT packages, or download CSV/PDF audit logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenExportPreview && (
              <button
                onClick={() => onOpenExportPreview("pdf")}
                className="font-sans flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600/30 via-zinc-900 to-zinc-900 hover:from-red-600/50 border border-red-500/40 text-white transition-all shadow-md hover:border-red-400 cursor-pointer"
                title="Open Pre-Flight Overlay Preview to verify layout and key data points before final generation"
              >
                <Eye size={14} className="text-red-400" />
                <span>Verify & Preview</span>
              </button>
            )}

            {onOpenOutlookMail && (
              <button
                onClick={onOpenOutlookMail}
                className="font-sans flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                title="Send formal approval notification via connected Outlook Mail"
              >
                <Mail size={14} className="text-blue-200" />
                <span>Outlook Mail Dispatch</span>
              </button>
            )}

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

      {/* Override Modal */}
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

      {/* Cryptographic Proof & QR Seal Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-cyan-500/40 bg-zinc-950 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-bold text-white">Cryptographic Audit Seal</h4>
                  <span className="text-[10px] font-mono text-cyan-400">Deterministic SHA-256 Ledger Stamp</span>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* QR Code SVG Display */}
            <div className="my-5 flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-900/90 border border-white/10">
              <div
                className="w-48 h-48 rounded-lg overflow-hidden p-2 bg-white flex items-center justify-center shadow-inner"
                dangerouslySetInnerHTML={{ __html: auditProof.qrSvgString }}
              />
              <span className="text-[10px] font-mono text-zinc-400 mt-2">
                Scan with mobile or auditor terminal to verify integrity
              </span>
            </div>

            {/* Proof Metadata */}
            <div className="space-y-2 text-xs font-mono bg-zinc-900/60 p-3 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Tender RFQ:</span>
                <span className="text-zinc-200 font-bold">{auditProof.rfqId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Authorized Vendor:</span>
                <span className="text-cyan-300 font-bold">{VENDOR_NAMES[auditProof.recommendedVendor] || auditProof.recommendedVendor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Sign-Off Status:</span>
                <span className="text-emerald-400 font-bold">{auditProof.signoffStatus}</span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <div className="text-[10px] text-zinc-500 mb-1 flex items-center justify-between">
                  <span>SHA-256 Fingerprint:</span>
                  <button
                    onClick={handleCopyHash}
                    className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {hasCopiedHash ? <Check size={10} /> : <Copy size={10} />}
                    <span>{hasCopiedHash ? "Copied" : "Copy Hash"}</span>
                  </button>
                </div>
                <div className="p-2 rounded bg-black/60 border border-white/5 text-[10px] text-zinc-300 break-all leading-tight">
                  {auditProof.fingerprint}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
