import React, { useState } from "react";
import { CheckCircle2, FileText, RefreshCw, AlertTriangle, ChevronDown, Award, ShieldCheck, Upload, HardDrive, Mail, FileCheck2, Sparkles } from "lucide-react";
import { VendorRawQuotes, VendorMetrics } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";
import { DocumentParserModal } from "./DocumentParserModal";

interface Props {
  quotes: VendorRawQuotes;
  setQuotes: React.Dispatch<React.SetStateAction<VendorRawQuotes>>;
  onStandardize: () => void;
  isStandardizing: boolean;
  error: string | null;
  onApplyParsedProposal?: (vendorKey: string, metrics: VendorMetrics, rawQuoteText: string) => void;
}

export function QuoteInputSection({ quotes, setQuotes, onStandardize, isStandardizing, error, onApplyParsedProposal }: Props) {
  const [activeTab, setActiveTab] = useState<string>("meridian");
  const [isParserOpen, setIsParserOpen] = useState<boolean>(false);
  const [lastParsedInfo, setLastParsedInfo] = useState<{ vendorName: string; time: string } | null>(null);

  const handleApplyProposalFromModal = (vendorKey: string, metrics: VendorMetrics, rawQuoteText: string) => {
    // 1. Update raw quote text state
    setQuotes((prev) => ({
      ...prev,
      [vendorKey]: rawQuoteText,
    }));

    // 2. Update structured ledger data if callback provided
    if (onApplyParsedProposal) {
      onApplyParsedProposal(vendorKey, metrics, rawQuoteText);
    }

    // 3. Set last parsed banner info
    const vendorDisplayName = VENDOR_NAMES[vendorKey] || vendorKey;
    setLastParsedInfo({
      vendorName: vendorDisplayName,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    });
  };

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Decorative glass glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-red-400 font-semibold bg-red-950/50 border border-red-500/30 px-2.5 py-0.5 rounded-full">
              Step 1: Input & Parse Quotations
            </span>
            <span className="font-mono text-[10px] bg-zinc-900 text-zinc-300 border border-white/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <HardDrive size={11} className="text-red-400" />
              <span>PC System Integration</span>
            </span>
            <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
          </div>
          <h2 className="font-sans text-xl font-bold text-white tracking-tight">
            Vendor Proposals, PDF Files & Email Parser
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Upload PDF proposals or email files directly from your PC system, or edit raw quotation texts below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsParserOpen(true)}
            className="font-sans flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-zinc-900 hover:bg-zinc-800 border border-red-500/40 hover:border-red-400 transition-all shadow-md shadow-red-950/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Upload size={15} className="text-red-400" />
            <span>Upload PDF / Email / Manual Input</span>
          </button>

          <button
            onClick={onStandardize}
            disabled={isStandardizing}
            className="font-sans flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-600 to-rose-600 border border-red-500/30 cursor-pointer"
          >
            {isStandardizing ? (
              <>
                <RefreshCw size={15} className="animate-spin text-white" />
                <span>Extracting Data...</span>
              </>
            ) : (
              <>
                <RefreshCw size={15} />
                <span>Standardize Quotations</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success / Notification Banner when document is parsed */}
      {lastParsedInfo && (
        <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center justify-between font-mono backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Document Parsed:</strong> Successfully ingested proposal for <span className="underline">{lastParsedInfo.vendorName}</span> into the procurement ledger at {lastParsedInfo.time}.
            </span>
          </div>
          <button
            onClick={() => setLastParsedInfo(null)}
            className="text-xs text-emerald-400 hover:text-white cursor-pointer ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 text-red-200 rounded-xl text-xs flex items-center gap-2 font-mono backdrop-blur-md">
          <AlertTriangle size={16} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Action Badges Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-white/10">
        <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider mr-1">
          Inspiration Sources:
        </span>
        <button
          onClick={() => setIsParserOpen(true)}
          className="text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <FileText size={12} className="text-red-400" />
          <span>Upload PDF Spec Sheet</span>
        </button>
        <button
          onClick={() => setIsParserOpen(true)}
          className="text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Mail size={12} className="text-rose-400" />
          <span>Paste Vendor Email (.eml)</span>
        </button>
        <button
          onClick={() => setIsParserOpen(true)}
          className="text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles size={12} className="text-emerald-400" />
          <span>Direct Manual Proposal Entry</span>
        </button>
      </div>

      {/* Tab Selectors for Mobile / Small Screens */}
      <div className="flex md:hidden border-b border-white/10 mb-3 bg-zinc-950/60 p-1 rounded-xl">
        {Object.keys(VENDOR_NAMES).map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-xs font-mono font-medium rounded-lg transition-all ${
              activeTab === key
                ? "bg-red-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {VENDOR_NAMES[key]}
          </button>
        ))}
      </div>

      {/* Grid view for Desktop, Tab view for Mobile */}
      <div className="grid md:grid-cols-3 gap-5">
        {Object.keys(VENDOR_NAMES).map((key) => {
          const isHiddenOnMobile = activeTab !== key;
          return (
            <div
              key={key}
              className={`flex flex-col ${isHiddenOnMobile ? "hidden md:flex" : "flex"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="font-sans font-semibold text-xs text-zinc-200 flex items-center gap-1.5">
                  <FileText size={14} className="text-red-500" />
                  <span>{VENDOR_NAMES[key]}</span>
                </label>
                <span className="font-mono text-[10px] text-zinc-400 uppercase bg-zinc-950/80 px-2 py-0.5 rounded-md font-medium border border-white/10">
                  {key}
                </span>
              </div>
              <textarea
                className="w-full h-52 p-3.5 rounded-xl border border-white/10 bg-zinc-950/70 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-500 focus:bg-zinc-900/90 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 transition-all resize-none shadow-inner"
                value={quotes[key as keyof VendorRawQuotes]}
                onChange={(e) =>
                  setQuotes((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                placeholder={`Paste raw quotation text for ${VENDOR_NAMES[key]}...`}
              />
            </div>
          );
        })}
      </div>

      {/* Document Parser Modal Component */}
      <DocumentParserModal
        isOpen={isParserOpen}
        onClose={() => setIsParserOpen(false)}
        onApplyProposal={handleApplyProposalFromModal}
        existingVendorKeys={Object.keys(VENDOR_NAMES)}
      />
    </div>
  );
}

