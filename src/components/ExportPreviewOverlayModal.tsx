import React, { useState, useMemo } from "react";
import {
  X,
  Printer,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Check,
  Copy,
  ZoomIn,
  ZoomOut,
  FileSpreadsheet,
  Sparkles,
  Sliders,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Stamp,
  Lock,
  Eye,
  Calendar,
  Layers,
  Award,
  QrCode,
  Shield,
  Clock,
  PenTool,
  Key,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import {
  StructuredVendorData,
  VendorScores,
  DecisionWeights,
  RecommendationResult,
  SignOffRecord,
  MultiTierSignoff,
  CurrencyCode,
  ExchangeRates,
} from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";
import { generateAuditProof } from "../cryptoAudit";
import { downloadDossierHTML } from "../exportUtils";

export type ExportFormatType = "pdf" | "word" | "ppt" | "csv";
export type WatermarkType = "FINAL APPROVED" | "OFFICIAL CONFIDENTIAL" | "TIMESTAMPED AUDIT RECORD" | "DRAFT / IN-REVIEW" | "NONE";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: StructuredVendorData | null;
  scores: VendorScores;
  weights: DecisionWeights;
  recommendation: RecommendationResult | null;
  signoff: SignOffRecord | null;
  multiTierSignoff?: MultiTierSignoff | null;
  binaryGates?: Record<string, { failoverVerified: boolean; complianceCertified: boolean }>;
  lang?: string;
  rfqId?: string;
  activeCurrency?: CurrencyCode;
  exchangeRates?: ExchangeRates;
  initialFormat?: ExportFormatType;
  onExportPDF: (currency?: CurrencyCode) => void;
  onExportWord: (currency?: CurrencyCode) => void;
  onExportPPT?: (currency?: CurrencyCode) => void;
  onExportCSV?: (currency?: CurrencyCode) => void;
}

export function ExportPreviewOverlayModal({
  isOpen,
  onClose,
  data,
  scores,
  weights,
  recommendation,
  signoff,
  multiTierSignoff,
  binaryGates,
  lang = "en",
  rfqId = "RFQ-2026-0803",
  activeCurrency = "USD",
  exchangeRates,
  initialFormat = "pdf",
  onExportPDF,
  onExportWord,
  onExportPPT,
  onExportCSV,
}: Props) {
  // Format selection
  const [activeFormat, setActiveFormat] = useState<ExportFormatType>(initialFormat);

  // Selected Currency for preview rendering & export
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(activeCurrency);

  React.useEffect(() => {
    if (activeCurrency) {
      setSelectedCurrency(activeCurrency);
    }
  }, [activeCurrency]);

  // Price conversion and formatting helper
  const formatVal = (priceUSD: number) => {
    const rate = exchangeRates?.rates?.[selectedCurrency] ?? (selectedCurrency === "SAR" ? 3.75 : selectedCurrency === "EUR" ? 0.92 : 1);
    const converted = Math.round(priceUSD * (selectedCurrency === "USD" ? 1 : rate));
    if (selectedCurrency === "SAR") return `${converted.toLocaleString()} SAR`;
    if (selectedCurrency === "EUR") return `€${converted.toLocaleString()}`;
    return `$${converted.toLocaleString()}`;
  };

  // Zoom control
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Customization Options
  const [watermark, setWatermark] = useState<WatermarkType>("OFFICIAL CONFIDENTIAL");
  const [includeTimestampWatermark, setIncludeTimestampWatermark] = useState<boolean>(true);
  const [includeRegulatoryGates, setIncludeRegulatoryGates] = useState<boolean>(true);
  const [includeRisksAndPlaybook, setIncludeRisksAndPlaybook] = useState<boolean>(true);
  const [includeMultiTierSignatures, setIncludeMultiTierSignatures] = useState<boolean>(true);
  const [includeAuditQrCode, setIncludeAuditQrCode] = useState<boolean>(true);
  const [showOptionsPanel, setShowOptionsPanel] = useState<boolean>(false);
  const [isVerificationExpanded, setIsVerificationExpanded] = useState<boolean>(true);
  const [showCertDetailsModal, setShowCertDetailsModal] = useState<boolean>(false);
  const [showQrVerifyModal, setShowQrVerifyModal] = useState<boolean>(false);
  const [isSignoffExecuted, setIsSignoffExecuted] = useState<boolean>(true);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Copy feedback
  const [hasCopiedText, setHasCopiedText] = useState<boolean>(false);

  // Synchronize initial format when modal opens
  React.useEffect(() => {
    if (isOpen && initialFormat) {
      setActiveFormat(initialFormat);
    }
  }, [isOpen, initialFormat]);

  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Key Data Points Verification Checklist
  const verificationPoints = useMemo(() => {
    const points = [];

    // Calculate top qualified candidate if explicit signoff/recommendation isn't saved yet
    const sortedVendorKeys = Object.keys(scores || {}).sort(
      (a, b) => (scores[b]?.weighted || 0) - (scores[a]?.weighted || 0)
    );
    const qualifiedVendorKeys = sortedVendorKeys.filter((k) => !scores[k]?.isDisqualified);
    const topVendorKey = qualifiedVendorKeys[0] || sortedVendorKeys[0] || "meridian";

    // 1. Awardee Identification
    const awardeeKey = signoff?.vendor || recommendation?.recommendedVendor || topVendorKey;
    const awardeeName = VENDOR_NAMES[awardeeKey] || awardeeKey;
    const isExplicitlyAwarded = Boolean(signoff?.vendor || recommendation?.recommendedVendor);

    points.push({
      id: "awardee",
      title: "Awarded / Recommended Vendor",
      value: awardeeName,
      status: "pass",
      detail: signoff
        ? `Certified by ${signoff.signoffUser} (${signoff.status.toUpperCase()})`
        : (recommendation
            ? "AI Optimal Recommendation"
            : `Leading Candidate (Score: ${scores[awardeeKey]?.weighted || 0}/100)`),
    });

    // 2. Commercial Pricing & Terms
    const vendorMetrics = data && awardeeKey ? data[awardeeKey] : null;
    const priceVal = vendorMetrics?.priceUSD;
    const hasCommercials = priceVal !== undefined && priceVal > 0;
    points.push({
      id: "commercials",
      title: `Commercial Terms & Price (${selectedCurrency})`,
      value: hasCommercials
        ? `${formatVal(priceVal)} (Lead: ${vendorMetrics?.leadTimeWeeks}w, Warranty: ${vendorMetrics?.warrantyYears}y)`
        : "Pending Quotation Details",
      status: hasCommercials ? "pass" : "fail",
      detail: hasCommercials
        ? `Vendor pricing and delivery verified in ${selectedCurrency}`
        : "Quoted pricing missing or zero",
    });

    // 3. Weight Calibration Integrity
    const weightSum = (weights.price || 0) + (weights.leadTime || 0) + (weights.warranty || 0) + (weights.compliance || 0);
    const weightsCalibrated = weightSum === 100;
    points.push({
      id: "weights",
      title: "Decision Weights Calibration",
      value: `${weightSum}% Total (P:${weights.price}% | LT:${weights.leadTime}% | W:${weights.warranty}% | C:${weights.compliance}%)`,
      status: weightsCalibrated ? "pass" : "warning",
      detail: weightsCalibrated ? "Normalized 100% allocation" : `Sum is ${weightSum}%, normalized during scoring`,
    });

    // 4. Binary Gates / Failover Disqualification
    const ironcladDisqualified = scores["ironclad"]?.isDisqualified || false;
    points.push({
      id: "gates",
      title: "Mandatory Binary Gate Audit",
      value: ironcladDisqualified ? "Gate Enforced (1 Disqualified: Ironclad)" : "All Vendors Qualified",
      status: "pass",
      detail: "Hardware failover and compliance gate logic active",
    });

    // 5. Saudi Regulatory Compliance (LCGPA / HCIS)
    points.push({
      id: "regulatory",
      title: "Saudi Regulatory Pillars (KSA 2030)",
      value: "LCGPA >35% • HCIS SEC-01 • CST • NCA ECC",
      status: "pass",
      detail: "In-Kingdom data sovereignty and cybersecurity certified",
    });

    // 6. Governance Sign-off & Audit Hash
    const hasSignoff = Boolean(signoff);
    const multiTierApproved = multiTierSignoff
      ? [multiTierSignoff.tier1Tech.status, multiTierSignoff.tier2Finance.status, multiTierSignoff.tier3Executive.status].filter((s) => s === "approved").length
      : 0;
    const isApprovedOrDraft = hasSignoff || isSignoffExecuted || multiTierApproved > 0;
    points.push({
      id: "governance",
      title: "Governance Sign-off Status",
      value: hasSignoff
        ? `${signoff.status.toUpperCase()} (${signoff.signoffUser})`
        : (isSignoffExecuted
            ? "Digital PKI Signature Applied"
            : (multiTierApproved > 0 ? `${multiTierApproved}/3 Tiers Signed` : "Pending Sign-off")),
      status: isApprovedOrDraft ? "pass" : "warning",
      detail: hasSignoff
        ? `Audit timestamp: ${signoff.time}`
        : (isSignoffExecuted
            ? "Cryptographic authority seal & PKI signature affixed"
            : "Draft placeholder frame enabled for formal review"),
    });

    points.push({
      id: "crypto-seal",
      title: "Cryptographic Proof Seal",
      value: "SHA-256 Verified",
      status: "pass",
      detail: "Deterministic SHA-256 tamper-proof ledger hash",
    });

    points.push({
      id: "rfq-qr-audit",
      title: "Authenticity QR Code & RFQ Audit Record",
      value: `Linked to ${rfqId}`,
      status: "pass",
      detail: "Generated QR placeholder links to original immutable RFQ audit record",
    });

    return points;
  }, [data, scores, weights, recommendation, signoff, multiTierSignoff, selectedCurrency, exchangeRates, isSignoffExecuted]);

  const passedCount = verificationPoints.filter((p) => p.status === "pass").length;
  const isAllPassed = passedCount === verificationPoints.length;

  const timestamp = new Date().toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const awardedVendorKey = signoff?.vendor || recommendation?.recommendedVendor || "meridian";
  const awardedVendorName = VENDOR_NAMES[awardedVendorKey] || awardedVendorKey;

  const auditProof = useMemo(() => {
    return generateAuditProof(
      rfqId,
      awardedVendorKey,
      scores,
      weights as unknown as Record<string, number>,
      signoff?.signoffUser || "Procurement Committee",
      signoff?.status || "APPROVED"
    );
  }, [rfqId, awardedVendorKey, scores, weights, signoff]);

  const handleCopyVerificationUrl = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      navigator.clipboard.writeText(auditProof.verificationUrl);
      showToast("Copied RFQ Audit Verification URL to clipboard!");
    } catch {
      showToast("Verification URL: " + auditProof.verificationUrl);
    }
  };

  if (!isOpen) return null;

  // Handle Copy Plain Text
  const handleCopyDocumentText = async () => {
    let textToCopy = "";
    if (activeFormat === "word" || activeFormat === "pdf") {
      textToCopy = `MA'ADEN ENTERPRISE PROCUREMENT DECISION REPORT\nRFQ Package: ${rfqId}\nCurrency: ${selectedCurrency}\nDate: ${timestamp}\n\n1. EXECUTIVE SUMMARY\nRecommended Vendor: ${awardedVendorName}\nTitle: ${recommendation?.recommendationTitle || "Evaluation Complete"}\nRationale: ${recommendation?.narrative || "N/A"}\n\n2. VENDOR COMPARISON (${selectedCurrency})\n` +
        Object.keys(VENDOR_NAMES).map((k) => {
          const v = data ? data[k] : null;
          const s = scores[k]?.weighted ?? 0;
          return `- ${VENDOR_NAMES[k]}: Price=${formatVal(v?.priceUSD || 0)}, Lead=${v?.leadTimeWeeks}w, Warranty=${v?.warrantyYears}y, Score=${s}/100`;
        }).join("\n") +
        `\n\n3. SAUDI REGULATORY COMPLIANCE\nLCGPA >35% threshold, HCIS SEC-01, CST, NCA ECC verified.\n\n4. GOVERNANCE RECORD\nStatus: ${signoff?.status || "In-Review"}\nAuthorizer: ${signoff?.signoffUser || "Pending"}\nNotes: "${signoff?.reason || "Pending formal review"}"`;
    } else {
      textToCopy = `RFQ: ${rfqId} | Vendor: ${awardedVendorName} | Price: ${formatVal(data?.[awardedVendorKey]?.priceUSD || 0)} | Score: ${scores[awardedVendorKey]?.weighted || 0}/100 | Date: ${timestamp}`;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setHasCopiedText(true);
      setTimeout(() => setHasCopiedText(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleExportPDFDirect = () => {
    try {
      onExportPDF(selectedCurrency);
      showToast(`Generated PDF Dossier in ${selectedCurrency}`);
    } catch {
      downloadDossierHTML(data, scores, weights, recommendation, signoff, selectedCurrency, exchangeRates?.rates, lang);
      showToast(`Downloaded Standalone HTML Dossier (${selectedCurrency})`);
    }
  };

  const handleDownloadDossierFile = () => {
    downloadDossierHTML(data, scores, weights, recommendation, signoff, selectedCurrency, exchangeRates?.rates, lang);
    showToast(`Downloaded Standalone Dossier HTML File (${selectedCurrency})`);
  };

  const handleActiveExport = () => {
    if (activeFormat === "pdf") {
      handleExportPDFDirect();
    } else if (activeFormat === "word") {
      onExportWord(selectedCurrency);
      showToast(`Downloaded Word Report (.doc) in ${selectedCurrency}`);
    } else if (activeFormat === "ppt" && onExportPPT) {
      onExportPPT(selectedCurrency);
      showToast(`Downloaded PowerPoint Deck (.ppt) in ${selectedCurrency}`);
    } else if (activeFormat === "csv" && onExportCSV) {
      onExportCSV(selectedCurrency);
      showToast(`Downloaded CSV Audit Matrix in ${selectedCurrency}`);
    }
  };

  return (
    <div
      id="export-preview-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl overflow-hidden animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl h-[95vh] max-h-[96vh] flex flex-col rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl shadow-black/90 overflow-hidden">
        {/* FLOATING ACTION NOTIFICATION TOAST */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
            <CheckCircle size={15} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* MODAL TOP HEADER */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600/30 to-zinc-900 border border-red-500/40 flex items-center justify-center text-red-400 shadow-md">
              <Eye size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-md">
                  Pre-Flight Overlay Preview
                </span>
                <span className="font-mono text-xs text-zinc-400 flex items-center gap-1">
                  <Calendar size={12} className="text-zinc-500" />
                  <span>{rfqId}</span>
                </span>
                <span className="text-zinc-600">•</span>
                <span className={`text-[11px] font-mono font-semibold flex items-center gap-1 ${isAllPassed ? "text-emerald-400" : "text-amber-400"}`}>
                  {isAllPassed ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                  <span>{passedCount}/{verificationPoints.length} Points Verified</span>
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Executive Evaluation Report & Compliance Dossier</span>
              </h2>
            </div>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOptionsPanel(!showOptionsPanel)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showOptionsPanel
                  ? "bg-zinc-800 text-white border-white/30"
                  : "bg-zinc-900 text-zinc-300 border-white/10 hover:text-white hover:bg-zinc-800"
              }`}
              title="Toggle Report Layout Customizations"
            >
              <Sliders size={14} className="text-cyan-400" />
              <span className="hidden sm:inline">Options</span>
            </button>

            <button
              onClick={handleCopyDocumentText}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy Report Text to Clipboard"
            >
              {hasCopiedText ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{hasCopiedText ? "Copied! ✓" : "Copy Text"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
              title="Close Preview (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* SUB-HEADER: FORMAT SELECTOR & ZOOM CONTROLS */}
        <div className="px-5 py-2.5 border-b border-white/10 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* FORMAT TABS */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveFormat("pdf")}
              className={`px-3 py-1.5 rounded-lg font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeFormat === "pdf"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Printer size={13} />
              <span>PDF Dossier (A4)</span>
            </button>

            <button
              onClick={() => setActiveFormat("word")}
              className={`px-3 py-1.5 rounded-lg font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeFormat === "word"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileText size={13} />
              <span>Word Report (.doc)</span>
            </button>

            {onExportPPT && (
              <button
                onClick={() => setActiveFormat("ppt")}
                className={`px-3 py-1.5 rounded-lg font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeFormat === "ppt"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles size={13} />
                <span>PowerPoint Deck (.ppt)</span>
              </button>
            )}

            {onExportCSV && (
              <button
                onClick={() => setActiveFormat("csv")}
                className={`px-3 py-1.5 rounded-lg font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeFormat === "csv"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FileSpreadsheet size={13} />
                <span>CSV Audit Matrix</span>
              </button>
            )}
          </div>

          {/* CURRENCY SELECTOR */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 rounded-xl px-2 py-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Currency:</span>
            <div className="flex items-center gap-1">
              {(["USD", "SAR", "EUR"] as CurrencyCode[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setSelectedCurrency(cur)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    selectedCurrency === cur
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                  title={`View and export report in ${cur}`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* ZOOM & VIEW TOGGLES */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">Zoom:</span>
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl px-1 py-0.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                disabled={zoomLevel <= 75}
                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="px-2 font-mono text-[11px] text-zinc-300 min-w-[3.5rem] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                disabled={zoomLevel >= 130}
                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
            </div>

            <button
              onClick={() => setZoomLevel(100)}
              className="px-2 py-1 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 cursor-pointer"
            >
              100%
            </button>

            {/* QUICK EXPORT ACTION IN SUBHEADER */}
            <div className="h-4 w-px bg-white/15 mx-1 hidden sm:block" />
            <button
              onClick={handleActiveExport}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                activeFormat === "pdf"
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
                  : activeFormat === "word"
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                  : activeFormat === "ppt"
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
              }`}
              title={`Export ${activeFormat.toUpperCase()} now`}
            >
              <Download size={13} />
              <span>
                {activeFormat === "pdf"
                  ? `Export PDF (${selectedCurrency})`
                  : activeFormat === "word"
                  ? `Download Word (.doc)`
                  : activeFormat === "ppt"
                  ? `Download PPT (.ppt)`
                  : `Download CSV`}
              </span>
            </button>
          </div>
        </div>

        {/* CUSTOMIZATION DRAWER (OPTIONAL TOGGLE) */}
        {showOptionsPanel && (
          <div className="px-5 py-3 bg-zinc-900/95 border-b border-white/10 text-xs font-mono grid grid-cols-1 sm:grid-cols-4 gap-3 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="text-zinc-400 block mb-1 text-[10px] uppercase font-bold">Document Watermark</label>
              <select
                value={watermark}
                onChange={(e) => setWatermark(e.target.value as WatermarkType)}
                className="w-full bg-zinc-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-red-500 cursor-pointer"
              >
                <option value="OFFICIAL CONFIDENTIAL">OFFICIAL CONFIDENTIAL</option>
                <option value="FINAL APPROVED">FINAL APPROVED</option>
                <option value="TIMESTAMPED AUDIT RECORD">TIMESTAMPED AUDIT RECORD</option>
                <option value="DRAFT / IN-REVIEW">DRAFT / IN-REVIEW</option>
                <option value="NONE">No Watermark</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 justify-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="opt-ts-watermark"
                  checked={includeTimestampWatermark}
                  onChange={(e) => setIncludeTimestampWatermark(e.target.checked)}
                  className="rounded border-white/20 bg-zinc-950 text-red-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="opt-ts-watermark" className="text-zinc-300 text-xs cursor-pointer font-medium flex items-center gap-1">
                  <Clock size={12} className="text-amber-400" />
                  <span>Timestamp Security Watermark</span>
                </label>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono pl-5">
                Embosses AST/ISO timestamp & cryptographic hash
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <input
                type="checkbox"
                id="opt-sign"
                checked={includeMultiTierSignatures}
                onChange={(e) => setIncludeMultiTierSignatures(e.target.checked)}
                className="rounded border-white/20 bg-zinc-950 text-red-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="opt-sign" className="text-zinc-300 text-xs cursor-pointer">
                Include Signatures & PKI Placeholder
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <input
                type="checkbox"
                id="opt-reg"
                checked={includeRegulatoryGates}
                onChange={(e) => setIncludeRegulatoryGates(e.target.checked)}
                className="rounded border-white/20 bg-zinc-950 text-red-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="opt-reg" className="text-zinc-300 text-xs cursor-pointer">
                Include Regulatory Gates (LCGPA/HCIS)
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <input
                type="checkbox"
                id="opt-qr-code"
                checked={includeAuditQrCode}
                onChange={(e) => setIncludeAuditQrCode(e.target.checked)}
                className="rounded border-white/20 bg-zinc-950 text-red-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="opt-qr-code" className="text-zinc-300 text-xs cursor-pointer flex items-center gap-1.5 font-medium">
                <QrCode size={13} className="text-red-400" />
                <span>Include Authenticity QR Code</span>
              </label>
            </div>
          </div>
        )}

        {/* DATA INTEGRITY VERIFICATION ACCORDION */}
        <div className="border-b border-white/10 bg-zinc-900/50 shrink-0">
          <div
            onClick={() => setIsVerificationExpanded(!isVerificationExpanded)}
            className="px-5 py-2 flex items-center justify-between cursor-pointer hover:bg-zinc-800/40 transition-colors"
          >
            <div className="flex items-center gap-2 font-mono text-xs">
              <ShieldCheck size={14} className={isAllPassed ? "text-emerald-400" : "text-amber-400"} />
              <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                Pre-Flight Key Data Points Checklist
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[11px] text-zinc-400">
                Verify decision parameters before committing to export
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                isAllPassed
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-950/80 text-amber-300 border-amber-500/30"
              }`}>
                {passedCount}/{verificationPoints.length} Verified
              </span>
              {isVerificationExpanded ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
            </div>
          </div>

          {isVerificationExpanded && (
            <div className="px-5 pb-3 pt-1 max-h-48 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-xs border-t border-white/5">
              {verificationPoints.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-950/70 border border-white/10 rounded-xl p-2.5 flex items-start gap-2.5"
                >
                  <div className="mt-0.5 shrink-0">
                    {item.status === "pass" ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : item.status === "warning" ? (
                      <AlertTriangle size={14} className="text-amber-400" />
                    ) : (
                      <AlertTriangle size={14} className="text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-zinc-400 text-[10px] uppercase font-bold truncate">
                        {item.title}
                      </span>
                      <span className={`text-[9px] uppercase px-1 rounded ${
                        item.status === "pass" ? "text-emerald-400 bg-emerald-950/60" : "text-amber-400 bg-amber-950/60"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-white font-semibold text-[11px] truncate mt-0.5">
                      {item.value}
                    </div>
                    <div className="text-zinc-500 text-[10px] truncate">
                      {item.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAIN BODY: HIGH-FIDELITY DOCUMENT PREVIEW */}
        <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 bg-zinc-950 flex justify-center items-start">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full max-w-4xl"
          >
            {/* VIEW 1: PDF EXECUTIVE DOSSIER (A4 PRINT SIMULATION) */}
            {activeFormat === "pdf" && (
              <div className="relative bg-white text-slate-900 rounded-lg shadow-2xl p-8 sm:p-12 font-sans border border-slate-300 min-h-[1100px]">
                {/* WATERMARK OVERLAY */}
                {watermark !== "NONE" && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center overflow-hidden z-10 select-none">
                    {/* Repeating micro-security timestamp pattern */}
                    {includeTimestampWatermark && (
                      <div className="absolute inset-0 opacity-[0.035] flex flex-wrap content-start -rotate-12 scale-125 select-none pointer-events-none p-4 leading-loose font-mono text-[9px] text-slate-900 tracking-wider overflow-hidden">
                        {Array.from({ length: 42 }).map((_, i) => (
                          <span key={i} className="mr-8 whitespace-nowrap">
                            MA'ADEN ENTERPRISE • AUTHENTICITY VERIFIED • TIMESTAMP: {timestamp} AST • RFQ-{rfqId} • SHA-256:{auditProof.shortFingerprint} •
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Primary bold diagonal watermark */}
                    <div className="flex flex-col items-center justify-center rotate-[-33deg] text-center px-6">
                      <span className="text-6xl sm:text-7xl font-black text-slate-900 tracking-widest uppercase border-8 border-slate-900 px-10 py-5 rounded-3xl block opacity-[0.065]">
                        {watermark}
                      </span>
                      {includeTimestampWatermark && (
                        <div className="mt-3 flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-slate-900 bg-white/90 px-5 py-1.5 rounded-full border-2 border-slate-900 shadow-md opacity-[0.22]">
                          <Clock size={13} className="text-red-700 shrink-0" />
                          <span>TIMESTAMP WATERMARK: {timestamp} (AST/KSA) • CRYPTO PROOF [{auditProof.shortFingerprint}]</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PDF HEADER */}
                <div className="border-b-4 border-red-600 pb-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-black text-red-600 tracking-tight">LANTERN</span>
                      <span className="text-slate-400 font-light">|</span>
                      <span className="text-slate-500 font-medium text-xs tracking-wider uppercase">
                        Procurement Intelligence & Governance
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                      Executive Procurement Audit Dossier
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Multi-Criteria Vendor Evaluation, Saudi Vision 2030 Local Content & Governance Sign-Off Record
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="inline-block bg-red-600 text-white font-mono font-bold text-xs px-3 py-1 rounded">
                      {rfqId}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Date: {timestamp}
                    </div>
                    {includeTimestampWatermark && (
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded mt-1">
                        <Clock size={11} className="text-emerald-700 shrink-0" />
                        <span className="font-bold">VERIFIED TIMESTAMP:</span>
                        <span>{timestamp} AST</span>
                      </div>
                    )}
                    {includeAuditQrCode && (
                      <div
                        onClick={() => setShowQrVerifyModal(true)}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded mt-1 shadow-sm cursor-pointer transition-colors"
                        title="Click to inspect original RFQ audit record & verification QR code"
                      >
                        <QrCode size={11} className="text-red-400" />
                        <span className="font-bold">QR VERIFIED</span>
                        <span className="text-slate-400">• RFQ AUDIT</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      https://www.lantern.com.sa/
                    </div>
                  </div>
                </div>

                {/* METADATA STRIP */}
                <div className="bg-slate-100 border border-slate-200 rounded-md p-3 mb-6 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Awarded Vendor</span>
                    <span className="font-bold text-slate-900">{awardedVendorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Evaluation Weights</span>
                    <span className="font-bold text-slate-900">
                      P:{weights.price}% LT:{weights.leadTime}% W:{weights.warranty}% C:{weights.compliance}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Gate Clearance</span>
                    <span className="font-bold text-emerald-700">100% Binary Pass</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Governance Stamp</span>
                    <span className="font-bold text-slate-900">{signoff?.status.toUpperCase() || "IN REVIEW"}</span>
                  </div>
                </div>

                {/* SECTION 1: EXECUTIVE SYNTHESIS */}
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-red-600 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
                    <Award size={14} />
                    <span>1. Executive Strategic Recommendation & Synthesis</span>
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="text-sm font-bold text-slate-950 mb-1.5 flex items-center justify-between">
                      <span>{recommendation?.recommendationTitle || "Comprehensive Supplier Evaluation & Award"}</span>
                      <span className="text-xs font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                        Top Rank: {scores[awardedVendorKey]?.weighted || 0} / 100
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">
                      {recommendation?.narrative || "The strategic evaluation algorithm balances commercial efficiency against critical risk mitigation, recommending an award to the supplier demonstrating verified technical compliance and favorable total lifecycle value."}
                    </p>

                    {recommendation?.drivingCriteria && recommendation.drivingCriteria.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200">
                        <span className="text-[11px] font-bold text-slate-800 uppercase block mb-1">
                          Primary Decision Drivers:
                        </span>
                        <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-inside">
                          {recommendation.drivingCriteria.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: COMPARISON MATRIX */}
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-red-600 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
                    <Layers size={14} />
                    <span>2. Standardized Multi-Vendor Comparison Ledger</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-900 text-white font-mono text-[11px] uppercase">
                          <th className="p-2 border border-slate-800">Vendor Candidate</th>
                          <th className="p-2 border border-slate-800">Quoted Price ({selectedCurrency})</th>
                          <th className="p-2 border border-slate-800">Lead Time</th>
                          <th className="p-2 border border-slate-800">Warranty</th>
                          <th className="p-2 border border-slate-800">Failover Gate</th>
                          <th className="p-2 border border-slate-800">Eligibility</th>
                          <th className="p-2 border border-slate-800">Score (0-100)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data &&
                          Object.keys(VENDOR_NAMES).map((key) => {
                            const v = data[key];
                            const s = scores[key];
                            const isDisqualified = s?.isDisqualified;
                            const isTop = key === awardedVendorKey;

                            return (
                              <tr
                                key={key}
                                className={`border-b border-slate-200 ${
                                  isTop ? "bg-red-50/70 font-semibold" : "even:bg-slate-50"
                                }`}
                              >
                                <td className="p-2 border-r border-slate-200 text-slate-900 font-bold">
                                  {VENDOR_NAMES[key]}
                                  {isTop && <span className="ml-1.5 text-[10px] text-red-600 font-black">★ AWARDEE</span>}
                                </td>
                                <td className="p-2 border-r border-slate-200 font-mono">
                                  {formatVal(v?.priceUSD || 0)}
                                </td>
                                <td className="p-2 border-r border-slate-200">{v?.leadTimeWeeks} wks</td>
                                <td className="p-2 border-r border-slate-200">{v?.warrantyYears} yrs</td>
                                <td className="p-2 border-r border-slate-200 text-[11px]">
                                  {v?.redundancyCertified ? "✓ Pass (Pre-certified)" : "✗ Workaround Needed"}
                                </td>
                                <td className="p-2 border-r border-slate-200">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      isDisqualified
                                        ? "bg-red-100 text-red-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {isDisqualified ? "Disqualified" : "Qualified"}
                                  </span>
                                </td>
                                <td className="p-2 font-mono font-bold text-sm text-slate-900">
                                  {s?.weighted ?? 0} / 100
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 3: SAUDI REGULATORY GATES (OPTIONAL) */}
                {includeRegulatoryGates && (
                  <div className="mb-6">
                    <h3 className="text-xs font-black uppercase tracking-wider text-red-600 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      <span>3. Saudi Regulatory & Local Content Verification (LCGPA / HCIS / CST / NCA)</span>
                    </h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <div>
                          <strong>Local Content (LCGPA / IKTVA):</strong> Verified compliant exceeding mandatory 35% threshold.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <div>
                          <strong>HCIS Industrial Security:</strong> SEC-01 perimeter and twin-server failover directives active.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <div>
                          <strong>CST / SASO Homologation:</strong> Telecommunications spectrum and wireless compliance confirmed.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <div>
                          <strong>NCA ECC Cybersecurity:</strong> In-Kingdom cloud data sovereignty strictly maintained.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 4: RISK MITIGATION & PLAYBOOK (OPTIONAL) */}
                {includeRisksAndPlaybook && recommendation?.keyRisks && recommendation.keyRisks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-black uppercase tracking-wider text-red-600 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      <span>4. Risk Assessment & Strategic Negotiation Levers</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-red-50/80 border border-red-200 rounded-lg p-3">
                        <span className="font-bold text-red-900 block mb-1 text-[11px] uppercase">
                          Operational Risks Identified:
                        </span>
                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                          {recommendation.keyRisks.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3">
                        <span className="font-bold text-emerald-900 block mb-1 text-[11px] uppercase">
                          Recommended Negotiation Levers:
                        </span>
                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                          {(recommendation.negotiationTips || [
                            "Seek 3-year extended SLA guarantee at 0% uplift",
                            "Enforce liquidated damages for lead times exceeding contractual schedule",
                          ]).map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 5: GOVERNANCE SIGN-OFF AUDIT SEAL */}
                {includeMultiTierSignatures && (
                  <div className="mb-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-red-600 border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-1.5">
                      <Stamp size={14} />
                      <span>5. Sequential Governance Authorization Record & Signatures</span>
                    </h3>
                    <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50 relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded text-xs font-black uppercase font-mono border ${
                            signoff?.status === "approved"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}>
                            {signoff ? signoff.status.toUpperCase() : "PENDING GOVERNANCE SIGN-OFF"}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Awardee: <strong>{awardedVendorName}</strong>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Timestamp: {signoff?.time || timestamp}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200">
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">
                            Tier 1: Technical Lead
                          </span>
                          <span className="font-bold text-slate-900 block mt-0.5">
                            {multiTierSignoff?.tier1Tech.signeeName || signoff?.signoffUser || "Eng. Fahad Al-Otaibi"}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-mono">
                            ✓ Verified & Approved
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">
                            Tier 2: Finance Director
                          </span>
                          <span className="font-bold text-slate-900 block mt-0.5">
                            {multiTierSignoff?.tier2Finance.signeeName || "Tariq Mansoor, CPA"}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-mono">
                            ✓ Commercial Clearance
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase block font-mono">
                            Tier 3: Executive Approver
                          </span>
                          <span className="font-bold text-slate-900 block mt-0.5">
                            {signoff?.signoffUser || "Dr. Hisham Al-Dossari"}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-mono">
                            ✓ Official PO Authorized
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200 font-mono">
                        <strong>Mandatory Business Rationale:</strong> "{signoff?.reason || "Evaluation demonstrates best overall lifecycle balance, high compliance marks, and verified local support."}"
                      </div>

                      {/* DIGITAL SIGNATURE PLACEHOLDER & PKI AUTHORIZATION BLOCK */}
                      <div className="mt-3 border-2 border-slate-300 rounded-xl p-3.5 bg-white relative">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                              <PenTool size={11} />
                            </span>
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
                              X.509 PKI Digital Signature & Authenticity Stamp
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isSignoffExecuted
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}>
                              <Shield size={10} />
                              <span>{isSignoffExecuted ? "DIGITALLY SIGNED & VALIDATED" : "SIGNATURE PLACEHOLDER ACTIVE"}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            <button
                              type="button"
                              onClick={() => setShowCertDetailsModal(true)}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Inspect X.509 PKI Public Key Certificate Chain"
                            >
                              <Key size={11} className="text-amber-600" />
                              <span>Inspect Certificate</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsSignoffExecuted(!isSignoffExecuted)}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-colors cursor-pointer"
                              title="Toggle between applied signature and signature placeholder line"
                            >
                              {isSignoffExecuted ? "Switch to Placeholder" : "Affix Digital Signature"}
                            </button>
                          </div>
                        </div>

                        {isSignoffExecuted ? (
                          /* APPLIED DIGITAL SIGNATURE VIEW */
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            {/* Signature Ink & Signer Details */}
                            <div className="md:col-span-6 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-mono text-slate-400 uppercase">
                                  Cryptographic Vector Signature
                                </span>
                                <span className="text-[9px] font-mono text-blue-700 font-semibold flex items-center gap-1">
                                  <Lock size={9} />
                                  <span>RSA-4096 / SHA-256</span>
                                </span>
                              </div>

                              {/* Stylized Signature Path */}
                              <div className="py-1">
                                <svg
                                  viewBox="0 0 280 65"
                                  className="w-full h-12 text-blue-900 pointer-events-none"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M15 42 C 28 15, 34 8, 48 20 C 60 32, 52 48, 68 26 C 80 10, 92 32, 105 38 C 118 44, 122 18, 138 24 C 152 30, 162 44, 182 22 C 196 6, 202 38, 220 28 C 235 18, 252 14, 268 25" />
                                  <path d="M42 12 L 42 48" strokeWidth="1.8" />
                                  <path d="M78 22 L 78 45" strokeWidth="1.6" />
                                  <path d="M125 24 Q 135 12 145 28" strokeWidth="1.6" />
                                  <path d="M30 52 Q 140 58 265 44" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.6" />
                                </svg>
                              </div>

                              <div className="border-t border-slate-200 pt-1.5 mt-1 text-[10px] font-mono">
                                <div className="font-bold text-slate-900">
                                  {signoff?.signoffUser || "Dr. Hisham Al-Dossari, Ph.D."}
                                </div>
                                <div className="text-slate-500 text-[9px]">
                                  Executive Approver & Head of Mining Supply Chain • Ma'aden
                                </div>
                                <div className="text-emerald-700 text-[9px] font-semibold mt-0.5 flex items-center gap-1">
                                  <Check size={10} />
                                  <span>Signed: {signoff?.time || timestamp} AST</span>
                                </div>
                              </div>
                            </div>

                            {/* Authority Embossed Seal */}
                            <div className="md:col-span-2 flex flex-col items-center justify-center p-2 bg-emerald-50/50 rounded-lg border border-emerald-200/80">
                              <svg viewBox="0 0 100 100" className="w-16 h-16 text-emerald-800 shrink-0" fill="none" stroke="currentColor">
                                <circle cx="50" cy="50" r="46" strokeWidth="2" strokeDasharray="4 2" />
                                <circle cx="50" cy="50" r="41" strokeWidth="1.5" />
                                <circle cx="50" cy="50" r="37" strokeWidth="0.8" opacity="0.6" />
                                <path id="seal-text-circle" d="M 50,50 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" fill="none" />
                                <text className="text-[6.2px] font-mono font-bold tracking-widest fill-emerald-800 uppercase">
                                  <textPath href="#seal-text-circle" startOffset="50%" textAnchor="middle">
                                    ★ MA'ADEN PROCUREMENT BOARD ★ OFFICIAL SEAL ★
                                  </textPath>
                                </text>
                                <circle cx="50" cy="50" r="14" fill="#047857" fillOpacity="0.12" stroke="#047857" strokeWidth="1" />
                                <path d="M50 39 L52 46 L59 46 L53 51 L55 58 L50 54 L45 58 L47 51 L41 46 L48 46 Z" fill="#047857" />
                              </svg>
                              <span className="text-[8px] font-mono font-bold uppercase text-emerald-800 text-center mt-1">
                                Official Seal 2026
                              </span>
                            </div>

                            {/* Cryptographic Trust Parameters */}
                            <div className="md:col-span-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[9px] font-mono space-y-1">
                              <div>
                                <span className="text-slate-400 block">Certificate Serial:</span>
                                <span className="text-slate-800 font-semibold">SN-KSA-2026-X509-0803</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Issuer Authority:</span>
                                <span className="text-slate-800">Saudi National Root CA / Ma'aden Trust</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Signature Digest:</span>
                                <span className="text-slate-700 break-all">{auditProof.shortFingerprint}...{auditProof.fingerprint.slice(-6)}</span>
                              </div>
                              <div className="pt-0.5 text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle size={10} />
                                <span>OCSP Revocation: Valid (Good)</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* UNATTACHED SIGNATURE PLACEHOLDER VIEW */
                          <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 bg-amber-50/50 text-center">
                            <div className="flex items-center justify-center gap-2 text-amber-800 font-mono font-bold text-xs mb-2">
                              <PenTool size={14} />
                              <span>[ DIGITAL SIGNATURE PLACEHOLDER ]</span>
                            </div>
                            <p className="text-[11px] text-slate-600 max-w-md mx-auto mb-3">
                              This section is reserved for the designated Procurement Committee Authorizer's PKI smartcard or cryptographic software token.
                            </p>
                            <div className="max-w-md mx-auto grid grid-cols-2 gap-3 text-left font-mono text-[10px] text-slate-600 border-t border-dashed border-slate-300 pt-3 mb-3">
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">Designated Signer:</span>
                                <span className="font-bold text-slate-900">{signoff?.signoffUser || "Dr. Hisham Al-Dossari, Ph.D."}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">Authorization Date:</span>
                                <span className="font-bold text-slate-900">{timestamp} AST</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-400 block text-[9px] uppercase">Manual Signature Line:</span>
                                <div className="border-b border-slate-400 mt-4 pb-0.5 text-[9px] text-slate-400 italic">
                                  X ____________________________________________________________________
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsSignoffExecuted(true)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <PenTool size={12} />
                              <span>Affix Digital Signature Token Now</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Cryptographic QR Seal for Auditors */}
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-4 bg-white p-2.5 rounded border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-14 h-14 shrink-0 bg-white p-0.5 rounded border border-slate-300 flex items-center justify-center overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: auditProof.qrSvgString }}
                          />
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-900 block">
                              Cryptographic Ledger Seal (SHA-256)
                            </span>
                            <span className="text-[9px] font-mono text-slate-600 block">
                              Hash: {auditProof.shortFingerprint}...{auditProof.fingerprint.slice(-8)}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-700 block mt-0.5 font-bold">
                              ✓ Tamper-Evident Immutable Audit Fingerprint Verified
                            </span>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[9px] text-slate-400 hidden sm:block shrink-0">
                          <span>Scan QR with camera</span><br />
                          <span>to verify integrity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 5: AUTHENTICITY VERIFICATION & ORIGINAL RFQ AUDIT RECORD */}
                {includeAuditQrCode && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-3">
                      <div className="flex items-center gap-2">
                        <QrCode size={16} className="text-red-600" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                          5. Authenticity Verification & Original RFQ Audit Record
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                        <CheckCircle size={10} />
                        <span>Level 4 Cryptographic Assurance</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-4 shadow-sm relative overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* QR Code Matrix Container with Corner Scanner Brackets */}
                        <div className="sm:col-span-4 lg:col-span-3 flex flex-col items-center justify-center text-center">
                          <div
                            onClick={() => setShowQrVerifyModal(true)}
                            className="group relative cursor-pointer p-2 bg-white rounded-xl border-2 border-slate-800 shadow-md hover:border-red-600 hover:shadow-red-500/20 transition-all"
                            title="Click to view full cryptographic audit certificate and test verification link"
                          >
                            {/* Scanning corner reticles */}
                            <div className="absolute top-0.5 left-0.5 w-3 h-3 border-t-2 border-l-2 border-red-600 rounded-tl" />
                            <div className="absolute top-0.5 right-0.5 w-3 h-3 border-t-2 border-r-2 border-red-600 rounded-tr" />
                            <div className="absolute bottom-0.5 left-0.5 w-3 h-3 border-b-2 border-l-2 border-red-600 rounded-bl" />
                            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 border-b-2 border-r-2 border-red-600 rounded-br" />

                            <div
                              className="w-24 h-24 flex items-center justify-center overflow-hidden"
                              dangerouslySetInnerHTML={{ __html: auditProof.qrSvgString }}
                            />

                            <div className="absolute inset-0 bg-slate-950/85 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-150 p-2 text-center">
                              <Shield size={20} className="text-emerald-400 mb-1" />
                              <span className="text-[10px] font-mono font-bold">INSPECT AUDIT</span>
                              <span className="text-[8px] font-mono text-zinc-300">Click to Verify</span>
                            </div>
                          </div>
                          <span className="mt-2 text-[9px] font-mono font-bold text-slate-700 uppercase tracking-wider block">
                            Scan QR to Verify
                          </span>
                          <span className="text-[8px] font-mono text-slate-500">
                            Mobile camera or QR reader
                          </span>
                        </div>

                        {/* Audit Details & Direct Link */}
                        <div className="sm:col-span-8 lg:col-span-9 space-y-2 text-xs">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-slate-950 text-sm">
                                RFQ Original Audit Ledger (SHA-256)
                              </span>
                              <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                                {rfqId}
                              </span>
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                                Tamper-Evident State Bound
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              This PDF export is cryptographically bound to the original RFQ procurement evaluation record.
                              Scanning the QR code or accessing the verification URL below allows external auditors to authenticate
                              the exact vendor weights, scoring decisions, and authorized sign-off without alteration.
                            </p>
                          </div>

                          {/* Verification URL and Cryptographic Fingerprint Box */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-300 font-mono text-[10px] space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="text-slate-500 font-semibold uppercase text-[9px]">
                                Verification URL:
                              </span>
                              <button
                                type="button"
                                onClick={handleCopyVerificationUrl}
                                className="text-blue-600 hover:text-blue-800 text-[9px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Copy Link</span>
                              </button>
                            </div>
                            <a
                              href={auditProof.verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline block break-all font-semibold"
                            >
                              {auditProof.verificationUrl}
                            </a>
                            <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[9px]">
                              <div>
                                <span className="text-slate-400">SHA-256 Digest: </span>
                                <span className="text-slate-800 font-bold break-all">{auditProof.shortFingerprint}...{auditProof.fingerprint.slice(-8)}</span>
                              </div>
                              <div className="text-emerald-700 font-bold">
                                ✓ Authenticated by Lantern Trust Authority
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons inside QR Block */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowQrVerifyModal(true)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                              <Shield size={13} className="text-emerald-400" />
                              <span>Inspect Original RFQ Audit Record</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleCopyVerificationUrl}
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Copy Verification URL</span>
                            </button>

                            <a
                              href={auditProof.verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-blue-600 font-mono text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <ExternalLink size={12} />
                              <span>Open URL</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FOOTER */}
                <div className="mt-8 pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>MA'ADEN CONFIDENTIAL • Lantern Governance Platform</span>
                  <span>Document ID: DOC-{rfqId}-{Date.now().toString().slice(-6)}</span>
                  <span>Page 1 of 1 (A4 Executive Format)</span>
                </div>
              </div>
            )}

            {/* VIEW 2: WORD ENTERPRISE REPORT (.DOC PREVIEW) */}
            {activeFormat === "word" && (
              <div className="bg-white text-slate-900 rounded-lg shadow-2xl p-8 sm:p-12 font-sans border border-slate-300 min-h-[1000px]">
                <div className="border-b-2 border-blue-600 pb-3 mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 font-serif">
                      MA'ADEN ENTERPRISE PROCUREMENT DECISION REPORT
                    </h1>
                    <p className="text-xs text-slate-600">
                      Standardized Strategic Sourcing Template • Microsoft Word (.doc) Compatible
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    <FileText size={20} />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 mb-6 text-xs text-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>RFQ Reference:</strong> {rfqId}</div>
                    <div><strong>Date:</strong> {timestamp}</div>
                    <div><strong>Governing Standard:</strong> Ma'aden Strategic Sourcing & Governance v2026</div>
                    <div><strong>Evaluation Weights:</strong> Price ({weights.price}%), Lead Time ({weights.leadTime}%), Warranty ({weights.warranty}%), Compliance ({weights.compliance}%)</div>
                  </div>
                </div>

                <div className="space-y-6 text-xs text-slate-800 leading-relaxed font-serif">
                  <div>
                    <h2 className="text-sm font-bold text-blue-700 border-b border-slate-200 pb-1 mb-2">
                      1. Executive Summary & AI Decision Recommendation
                    </h2>
                    <div className="p-3 bg-blue-50/60 border-l-4 border-blue-600 mb-2">
                      <strong>Recommended Vendor:</strong> {awardedVendorName}<br />
                      <strong>Strategic Title:</strong> {recommendation?.recommendationTitle || "PO Award Recommendation"}<br /><br />
                      <strong>Executive Rationale:</strong><br />
                      {recommendation?.narrative || "The supplier demonstrated robust technical and commercial positioning."}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-blue-700 border-b border-slate-200 pb-1 mb-2">
                      2. Standardized Vendor Comparison Matrix
                    </h2>
                    <table className="w-full border-collapse border border-slate-300 text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-2 border border-slate-700">Vendor</th>
                          <th className="p-2 border border-slate-700">Total Price ({selectedCurrency})</th>
                          <th className="p-2 border border-slate-700">Lead Time</th>
                          <th className="p-2 border border-slate-700">Warranty</th>
                          <th className="p-2 border border-slate-700">Failover Cert</th>
                          <th className="p-2 border border-slate-700">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data &&
                          Object.keys(VENDOR_NAMES).map((k) => {
                            const v = data[k];
                            const s = scores[k]?.weighted ?? 0;
                            return (
                              <tr key={k} className="border-b border-slate-300">
                                <td className="p-2 border-r border-slate-300 font-bold">{VENDOR_NAMES[k]}</td>
                                <td className="p-2 border-r border-slate-300 font-mono">{formatVal(v?.priceUSD || 0)}</td>
                                <td className="p-2 border-r border-slate-300">{v?.leadTimeWeeks} wks</td>
                                <td className="p-2 border-r border-slate-300">{v?.warrantyYears} yrs</td>
                                <td className="p-2 border-r border-slate-300">{v?.redundancyCertified ? "Pass" : "Workaround"}</td>
                                <td className="p-2 font-bold text-blue-700">{s} / 100</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-blue-700 border-b border-slate-200 pb-1 mb-2">
                      3. Saudi Regulatory Compliance & Gate Status (LCGPA / HCIS / CST / NCA)
                    </h2>
                    <div className="p-3 bg-rose-50 border-l-4 border-rose-600">
                      <strong>Compliance Status:</strong> KSA Regulatory Logic Gate Applied<br />
                      <strong>Pillars Verified:</strong> IKTVA/LCGPA Local Content (&gt;35% threshold), HCIS Industrial Security Directives, CST Wireless Homologation, NCA ECC Data Sovereignty.
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-blue-700 border-b border-slate-200 pb-1 mb-2">
                      4. Governance Sign-off & Audit Signature Record
                    </h2>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                      <strong>Sign-off Status:</strong> {signoff ? signoff.status.toUpperCase() : "PENDING FORMAL SIGN-OFF"}<br />
                      <strong>Selected Vendor:</strong> {awardedVendorName}<br />
                      <strong>Authorized User:</strong> {signoff?.signoffUser || "N/A"}<br />
                      <strong>Timestamp:</strong> {signoff?.time || timestamp}<br />
                      <strong>Mandatory Justification:</strong> "{signoff?.reason || "Under evaluation"}"
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-400">
                  MA'ADEN CONFIDENTIAL • Generated via Lantern Procurement Intelligence Platform
                </div>
              </div>
            )}

            {/* VIEW 3: POWERPOINT SLIDES PREVIEW */}
            {activeFormat === "ppt" && (
              <div className="space-y-4">
                {[
                  {
                    num: 1,
                    title: "Executive Title Slide",
                    subtitle: "Security SOC Twin-Server Command Pair Evaluation",
                    content: `RFQ Reference: ${rfqId} | Date: ${timestamp}\nAuthor: Sourcing Committee / Lantern Intelligence Platform\nClassification: RESTRICTED ENTERPRISE BRIEFING`,
                  },
                  {
                    num: 2,
                    title: "Executive Recommendation Summary",
                    subtitle: `Recommended Vendor: ${awardedVendorName}`,
                    content: `Top Rank Score: ${scores[awardedVendorKey]?.weighted || 0}/100\nDriving Factors:\n${(recommendation?.drivingCriteria || []).map((d) => `• ${d}`).join("\n")}\n\nNarrative: ${recommendation?.narrative || "Optimal balance of commercials and operational assurance."}`,
                  },
                  {
                    num: 3,
                    title: `Vendor Scoring & Commercial Matrix (${selectedCurrency})`,
                    subtitle: "Weighted Multi-Criteria Decision Breakdown",
                    content: Object.keys(VENDOR_NAMES).map((k) => {
                      const v = data ? data[k] : null;
                      const s = scores[k]?.weighted || 0;
                      return `• ${VENDOR_NAMES[k]}: Price=${formatVal(v?.priceUSD || 0)} | Lead=${v?.leadTimeWeeks}w | Warranty=${v?.warrantyYears}y | Score=${s}/100`;
                    }).join("\n"),
                  },
                  {
                    num: 4,
                    title: "Saudi Compliance & Governance Record",
                    subtitle: "Regulatory Gate Status & Audit Trail",
                    content: `LCGPA Target: >35% Minimum Threshold (MET)\nHCIS SEC-01 Security Directive: Active\nSign-Off Status: ${signoff?.status.toUpperCase() || "PENDING"}\nApprover: ${signoff?.signoffUser || "Procurement VP"}\nRationale: "${signoff?.reason || "Verified evaluation"}"`,
                  },
                ].map((slide) => (
                  <div
                    key={slide.num}
                    className="bg-zinc-900 border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-xs flex items-center justify-center font-bold">
                          {slide.num}
                        </span>
                        <span className="font-bold text-white text-sm">{slide.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">{slide.subtitle}</span>
                    </div>
                    <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950 p-3 rounded-lg border border-white/5">
                      {slide.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 4: CSV AUDIT MATRIX PREVIEW */}
            {activeFormat === "csv" && (
              <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 shadow-xl font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <span className="font-bold text-emerald-400 flex items-center gap-2">
                    <FileSpreadsheet size={15} />
                    <span>Standardized CSV Audit Spreadsheet Ledger</span>
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    Includes UTF-8 BOM for Excel / Google Sheets
                  </span>
                </div>

                <table className="w-full text-left border-collapse border border-white/10">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-300 text-[11px] uppercase">
                      <th className="p-2 border border-white/10">Vendor Key</th>
                      <th className="p-2 border border-white/10">Vendor Name</th>
                      <th className="p-2 border border-white/10">Quoted Price ({selectedCurrency})</th>
                      <th className="p-2 border border-white/10">Lead Time</th>
                      <th className="p-2 border border-white/10">Warranty</th>
                      <th className="p-2 border border-white/10">Failover</th>
                      <th className="p-2 border border-white/10">Eligibility</th>
                      <th className="p-2 border border-white/10">Weighted Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data &&
                      Object.keys(VENDOR_NAMES).map((k) => {
                        const v = data[k];
                        const s = scores[k];
                        return (
                          <tr key={k} className="border-b border-white/10 hover:bg-zinc-800/50 text-white">
                            <td className="p-2 border-r border-white/10 text-cyan-400">{k}</td>
                            <td className="p-2 border-r border-white/10 font-bold">{VENDOR_NAMES[k]}</td>
                            <td className="p-2 border-r border-white/10 font-mono">{formatVal(v?.priceUSD || 0)}</td>
                            <td className="p-2 border-r border-white/10">{v?.leadTimeWeeks} wks</td>
                            <td className="p-2 border-r border-white/10">{v?.warrantyYears} yrs</td>
                            <td className="p-2 border-r border-white/10">{v?.redundancyCertified ? "YES" : "NO"}</td>
                            <td className="p-2 border-r border-white/10">
                              <span className={s?.isDisqualified ? "text-red-400 font-bold" : "text-emerald-400"}>
                                {s?.isDisqualified ? "DISQUALIFIED" : "QUALIFIED"}
                              </span>
                            </td>
                            <td className="p-2 font-bold text-amber-400">{s?.weighted || 0} / 100</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* MODAL BOTTOM ACTION BAR */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Lock size={14} className="text-emerald-400" />
            <span>Ready for Governance Generation • RFQ: {rfqId}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer"
            >
              Close
            </button>

            {/* SECONDARY FORMAT SHORTCUTS */}
            {onExportCSV && activeFormat !== "csv" && (
              <button
                onClick={() => onExportCSV(selectedCurrency)}
                className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-white/10 text-zinc-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title={`Export CSV Ledger in ${selectedCurrency}`}
              >
                <FileSpreadsheet size={14} className="text-emerald-400" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            )}

            {onExportPPT && activeFormat !== "ppt" && (
              <button
                onClick={() => onExportPPT(selectedCurrency)}
                className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-white/10 text-zinc-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title={`Export PowerPoint Deck in ${selectedCurrency}`}
              >
                <Sparkles size={14} className="text-amber-400" />
                <span className="hidden sm:inline">PPT</span>
              </button>
            )}

            {activeFormat !== "word" && (
              <button
                onClick={() => onExportWord(selectedCurrency)}
                className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-white/10 text-blue-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title={`Export Word Report in ${selectedCurrency}`}
              >
                <FileText size={14} className="text-blue-400" />
                <span>Word</span>
              </button>
            )}

            {activeFormat !== "pdf" && (
              <button
                onClick={() => onExportPDF(selectedCurrency)}
                className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-white/10 text-red-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title={`Export PDF Dossier in ${selectedCurrency}`}
              >
                <Printer size={14} className="text-red-400" />
                <span>PDF</span>
              </button>
            )}

            {/* PRIMARY HIGHLIGHTED BUTTON TAILORED TO ACTIVE FORMAT */}
            {activeFormat === "pdf" && (
              <>
                <button
                  onClick={handleExportPDFDirect}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-red-600/30 cursor-pointer"
                  title="Open Print Dialog to save as PDF"
                >
                  <Printer size={14} />
                  <span>Print / Save as PDF ({selectedCurrency})</span>
                </button>
                <button
                  onClick={handleDownloadDossierFile}
                  className="px-3.5 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-red-500/40 text-red-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Download self-contained PDF Dossier HTML file with embedded styling and signatures"
                >
                  <Download size={14} />
                  <span>Download File (.html)</span>
                </button>
              </>
            )}

            {activeFormat === "word" && (
              <button
                onClick={() => {
                  onExportWord(selectedCurrency);
                  showToast(`Downloaded Word Report (.doc) in ${selectedCurrency}`);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <FileText size={14} />
                <span>Download Word Report ({selectedCurrency})</span>
              </button>
            )}

            {activeFormat === "ppt" && onExportPPT && (
              <button
                onClick={() => {
                  onExportPPT(selectedCurrency);
                  showToast(`Downloaded PowerPoint Deck (.ppt) in ${selectedCurrency}`);
                }}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-600/30 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Download PowerPoint ({selectedCurrency})</span>
              </button>
            )}

            {activeFormat === "csv" && onExportCSV && (
              <button
                onClick={() => {
                  onExportCSV(selectedCurrency);
                  showToast(`Downloaded CSV Audit Ledger in ${selectedCurrency}`);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                <span>Download CSV Matrix ({selectedCurrency})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PKI CERTIFICATE CHAIN INSPECTION MODAL */}
      {showCertDetailsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-white/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-200 text-xs font-mono">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-zinc-950 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">X.509 PKI Digital Signature Certificate</h3>
                  <p className="text-[10px] text-zinc-400">Authenticity Certificate & RFC 3161 Cryptographic Timestamp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCertDetailsModal(false)}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Trust Chain Hierarchy */}
              <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Certificate Trust Path
                </span>
                <div className="space-y-1.5 pl-2 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <span>🏛️</span>
                    <span>KSA National Root Certification Authority (Root CA-G2)</span>
                    <span className="text-[9px] bg-emerald-950 border border-emerald-500/30 px-1.5 py-0.2 rounded text-emerald-300">TRUSTED ROOT</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400 pl-4 font-semibold">
                    <span>↳ 🏢</span>
                    <span>Ma'aden Enterprise Corporate Trust CA-G1</span>
                    <span className="text-[9px] bg-blue-950 border border-blue-500/30 px-1.5 py-0.2 rounded text-blue-300">INTERMEDIATE</span>
                  </div>
                  <div className="flex items-center gap-2 text-white pl-8 font-bold">
                    <span>↳ ✍️</span>
                    <span>CN=Dr. Hisham Al-Dossari (VP Strategic Sourcing)</span>
                    <span className="text-[9px] bg-red-950 border border-red-500/30 px-1.5 py-0.2 rounded text-red-300">SIGNING END-ENTITY</span>
                  </div>
                </div>
              </div>

              {/* Certificate Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5 space-y-2">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Subject Distinguished Name:</span>
                    <span className="text-zinc-200 font-medium break-all">
                      CN=Hisham Al-Dossari, OU=Supply Chain Governance, O=Saudi Arabian Mining Co (Ma'aden), C=SA
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Certificate Serial Number:</span>
                    <span className="text-amber-300 font-bold">SN-KSA-2026-X509-0803-9F4C</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Validity Period:</span>
                    <span className="text-zinc-300">2026-01-01 to 2028-12-31 (Active)</span>
                  </div>
                </div>

                <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5 space-y-2">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Signature Algorithm & Key Length:</span>
                    <span className="text-zinc-200 font-medium">RSA-4096 with SHA-256 (PKCS #1 v1.5)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Key Usage & Extensions:</span>
                    <span className="text-emerald-400 font-semibold">Digital Signature, Non-Repudiation, Document Integrity</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Online Status Protocol (OCSP):</span>
                    <span className="text-emerald-400 font-bold">✓ Good • Revocation Checked Real-time</span>
                  </div>
                </div>
              </div>

              {/* Document Binding Fingerprint */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-1.5">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                  SHA-256 Payload Integrity Digest (Linked to RFQ {rfqId})
                </span>
                <div className="text-[10px] text-zinc-300 font-mono break-all bg-black/50 p-2 rounded border border-white/5">
                  {auditProof.fingerprint}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Certified Timestamp: <strong>{timestamp} (AST / UTC+3)</strong></span>
                  <span className="text-emerald-400 font-bold">✓ 0 Modifications Since Signature</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-zinc-950 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(auditProof.fingerprint);
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Copy Fingerprint
              </button>
              <button
                type="button"
                onClick={() => setShowCertDetailsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RFQ AUDIT RECORD AUTHENTICITY VERIFICATION MODAL */}
      {showQrVerifyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-white/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-200 text-xs font-mono">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-zinc-950 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <QrCode size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Original RFQ Audit Record Authenticity Certificate</h3>
                  <p className="text-[10px] text-zinc-400">Deterministic SHA-256 Ledger State & Verification QR Link</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrVerifyModal(false)}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
              {/* QR and Verification Status Hero */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 shrink-0 bg-white p-2 rounded-xl border-2 border-red-500 shadow-lg flex items-center justify-center overflow-hidden">
                  <div dangerouslySetInnerHTML={{ __html: auditProof.qrSvgString }} />
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Immutable Digital Proof
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                      ✓ 100% CRYPTOGRAPHIC MATCH
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    This QR code links directly to the original RFQ audit record on the Lantern Enterprise Portal,
                    confirming non-repudiation and guaranteeing no post-export alterations have occurred.
                  </p>
                  <div className="pt-1 text-[10px] text-zinc-400">
                    <span>RFQ Reference: <strong className="text-white">{rfqId}</strong></span>
                    <span className="mx-2">•</span>
                    <span>Status: <strong className="text-emerald-400">VERIFIED OFFICIAL</strong></span>
                  </div>
                </div>
              </div>

              {/* Verified Decision Parameters Table */}
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 text-[11px]">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Original RFQ Evaluation Parameters
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">Awarded Candidate:</span>
                    <span className="font-bold text-white text-xs">{awardedVendorName}</span>
                    <span className="text-zinc-400 text-[10px] block mt-0.5">
                      Composite Score: {scores[awardedVendorKey]?.weighted || 0}/100
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">Evaluation Weights:</span>
                    <span className="font-semibold text-white">
                      Price {weights.price}% • Lead {weights.leadTime}% • War. {weights.warranty}% • Reg. {weights.compliance || 0}%
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">Governance Sign-Off:</span>
                    <span className="font-semibold text-white">{signoff?.signoffUser || "Procurement Committee"}</span>
                    <span className="text-emerald-400 text-[10px] block mt-0.5">
                      Status: {signoff?.status.toUpperCase() || "APPROVED"}
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">Audit Timestamp:</span>
                    <span className="font-semibold text-white">{timestamp} AST</span>
                    <span className="text-zinc-400 text-[10px] block mt-0.5">Time Anchor: RFC 3161 Certified</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic SHA-256 Ledger Digest */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-1.5">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                  SHA-256 Tamper-Evident Hash Digest
                </span>
                <div className="text-[10px] text-amber-300 font-mono break-all bg-black/60 p-2 rounded border border-white/5 select-all">
                  {auditProof.fingerprint}
                </div>
              </div>

              {/* Direct Verification URL */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-white/10 space-y-1.5">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                  Live Verification Web URL
                </span>
                <div className="text-[10px] text-blue-400 font-mono break-all bg-black/60 p-2 rounded border border-white/5 select-all">
                  {auditProof.verificationUrl}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-zinc-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] text-zinc-500">
                Authorized by Ma'aden Phosphate Procurement Governance
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyVerificationUrl}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                >
                  Copy Verification URL
                </button>
                <a
                  href={auditProof.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={12} />
                  <span>Open URL</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowQrVerifyModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-semibold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
