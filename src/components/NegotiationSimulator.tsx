import React, { useState, useMemo } from "react";
import {
  SlidersHorizontal,
  TrendingUp,
  Percent,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  FileCheck2,
} from "lucide-react";
import {
  StructuredVendorData,
  DecisionWeights,
  VendorScores,
  VendorBinaryGateMap,
  VendorNegotiationSim,
  NegotiationSimMap,
  VendorMetrics,
  CurrencyCode,
} from "../types";
import { VENDOR_NAMES } from "../data";
import { calculateVendorScores } from "../utils";
import { LanternLogo } from "./LanternLogo";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface Props {
  baseData: StructuredVendorData;
  weights: DecisionWeights;
  baseScores: VendorScores;
  baseGates: VendorBinaryGateMap;
  currency: CurrencyCode;
  formatCurrency: (priceUSD: number, targetCurrency: CurrencyCode) => string;
  onApplySimulatedData: (simulatedData: StructuredVendorData, simulatedGates: VendorBinaryGateMap) => void;
  onOpenLetterGenerator?: (vendorKey: string) => void;
  lang?: AppLanguage;
}

const DEFAULT_SIMULATION: NegotiationSimMap = {
  meridian: {
    priceDiscountPercent: 0,
    leadTimeExpediteWeeks: 0,
    warrantyExtensionYears: 0,
    failoverVerified: true,
    complianceCertified: true,
  },
  ironclad: {
    priceDiscountPercent: 5,
    leadTimeExpediteWeeks: 4,
    warrantyExtensionYears: 1,
    failoverVerified: false,
    complianceCertified: true,
  },
  vantage: {
    priceDiscountPercent: 8,
    leadTimeExpediteWeeks: 3,
    warrantyExtensionYears: 1,
    failoverVerified: false,
    complianceCertified: true,
  },
};

export function NegotiationSimulator({
  baseData,
  weights,
  baseScores,
  baseGates,
  currency,
  formatCurrency,
  onApplySimulatedData,
  onOpenLetterGenerator,
  lang = "en",
}: Props) {
  const isAr = lang === "ar";
  const t = TRANSLATIONS[lang];
  const vendorKeys = Object.keys(VENDOR_NAMES);
  const [simParams, setSimParams] = useState<NegotiationSimMap>(DEFAULT_SIMULATION);
  const [activeVendorTab, setActiveVendorTab] = useState<string>("vantage");

  // Calculate simulated data based on current baseline + sliders
  const simulatedData: StructuredVendorData = useMemo(() => {
    const res: StructuredVendorData = {};
    vendorKeys.forEach((key) => {
      const base = baseData[key] || {
        priceUSD: 70000,
        leadTimeWeeks: 10,
        warrantyYears: 3,
        supportSLA: "",
        redundancyCertified: false,
        certifications: [],
        specsSummary: "",
      };
      const sim = simParams[key] || {
        priceDiscountPercent: 0,
        leadTimeExpediteWeeks: 0,
        warrantyExtensionYears: 0,
        failoverVerified: baseGates[key]?.failoverVerified ?? base.redundancyCertified,
        complianceCertified: baseGates[key]?.complianceCertified ?? true,
      };

      const discountedPrice = Math.round(base.priceUSD * (1 - sim.priceDiscountPercent / 100));
      const expeditedLead = Math.max(1, base.leadTimeWeeks - sim.leadTimeExpediteWeeks);
      const extendedWarranty = base.warrantyYears + sim.warrantyExtensionYears;

      res[key] = {
        ...base,
        priceUSD: discountedPrice,
        leadTimeWeeks: expeditedLead,
        warrantyYears: extendedWarranty,
        redundancyCertified: sim.failoverVerified,
      };
    });
    return res;
  }, [baseData, simParams, baseGates, vendorKeys]);

  const simulatedGates: VendorBinaryGateMap = useMemo(() => {
    const res: VendorBinaryGateMap = {};
    vendorKeys.forEach((key) => {
      res[key] = {
        failoverVerified: simParams[key]?.failoverVerified ?? baseGates[key]?.failoverVerified ?? false,
        complianceCertified: simParams[key]?.complianceCertified ?? baseGates[key]?.complianceCertified ?? true,
      };
    });
    return res;
  }, [simParams, baseGates, vendorKeys]);

  // Simulated scores
  const simulatedScores = useMemo(() => {
    return calculateVendorScores(simulatedData, weights, simulatedGates);
  }, [simulatedData, weights, simulatedGates]);

  // Identify baseline winner vs simulated winner
  const baseWinner = useMemo(() => {
    const qualified = vendorKeys.filter((k) => !baseScores[k]?.isDisqualified);
    if (qualified.length === 0) return vendorKeys[0];
    return qualified.sort((a, b) => (baseScores[b]?.weighted || 0) - (baseScores[a]?.weighted || 0))[0];
  }, [baseScores, vendorKeys]);

  const simWinner = useMemo(() => {
    const qualified = vendorKeys.filter((k) => !simulatedScores[k]?.isDisqualified);
    if (qualified.length === 0) return vendorKeys[0];
    return qualified.sort((a, b) => (simulatedScores[b]?.weighted || 0) - (simulatedScores[a]?.weighted || 0))[0];
  }, [simulatedScores, vendorKeys]);

  const handleSimChange = (vendorKey: string, field: keyof VendorNegotiationSim, value: any) => {
    setSimParams((prev) => ({
      ...prev,
      [vendorKey]: {
        ...(prev[vendorKey] || {
          priceDiscountPercent: 0,
          leadTimeExpediteWeeks: 0,
          warrantyExtensionYears: 0,
          failoverVerified: baseGates[vendorKey]?.failoverVerified ?? false,
          complianceCertified: baseGates[vendorKey]?.complianceCertified ?? true,
        }),
        [field]: value,
      },
    }));
  };

  const handleReset = () => {
    setSimParams(DEFAULT_SIMULATION);
  };

  const activeSim = simParams[activeVendorTab] || {
    priceDiscountPercent: 0,
    leadTimeExpediteWeeks: 0,
    warrantyExtensionYears: 0,
    failoverVerified: false,
    complianceCertified: true,
  };

  const activeBase = baseData[activeVendorTab];
  const activeSimData = simulatedData[activeVendorTab];
  const activeBaseScore = baseScores[activeVendorTab];
  const activeSimScore = simulatedScores[activeVendorTab];

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              "What-If" Sensitivity & BAFO Negotiation Simulator
            </span>
            <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
          </div>
          <h3 className="font-sans text-xl font-bold text-white tracking-tight">
            Best and Final Offer (BAFO) Sensitivity Modeling
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Simulate vendor price discounts, schedule expedites, warranty additions, and failover pre-certification concessions in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset Sliders</span>
          </button>
          <button
            onClick={() => onApplySimulatedData(simulatedData, simulatedGates)}
            className="px-4 py-2 rounded-xl text-xs font-sans font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>Apply BAFO to Ledger</span>
          </button>
        </div>
      </div>

      {/* Vendor Selector Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3 overflow-x-auto">
        {vendorKeys.map((key) => {
          const isSelected = activeVendorTab === key;
          const scoreDelta = (simulatedScores[key]?.weighted || 0) - (baseScores[key]?.weighted || 0);
          const isGated = simulatedScores[key]?.isDisqualified;

          return (
            <button
              key={key}
              onClick={() => setActiveVendorTab(key)}
              className={`px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-bold"
                  : "bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-white/5"
              }`}
            >
              <span>{VENDOR_NAMES[key]}</span>
              {scoreDelta !== 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    scoreDelta > 0 ? "bg-emerald-500/20 text-emerald-300 font-bold" : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {scoreDelta > 0 ? `+${scoreDelta.toFixed(1)}` : scoreDelta.toFixed(1)}
                </span>
              )}
              {isGated && (
                <span className="w-2 h-2 rounded-full bg-red-400" title="Gated out at Mandatory Binary Gate"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Sliders Control Box */}
        <div className="lg:col-span-7 bg-zinc-950/70 p-5 rounded-xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-mono text-zinc-300 font-semibold uppercase tracking-wider">
              Negotiation Levers for {VENDOR_NAMES[activeVendorTab]}
            </span>
            {onOpenLetterGenerator && (
              <button
                onClick={() => onOpenLetterGenerator(activeVendorTab)}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Draft Counter-Offer Letter</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>

          {/* Price Discount Slider */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Percent size={13} className="text-cyan-400" />
                Simulate Price Discount
              </span>
              <span className="text-cyan-300 font-bold text-sm">
                -{activeSim.priceDiscountPercent}% (
                {formatCurrency(activeSimData?.priceUSD || 0, currency)})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={activeSim.priceDiscountPercent}
              onChange={(e) => handleSimChange(activeVendorTab, "priceDiscountPercent", Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
              <span>0% (Base Price)</span>
              <span>10% (Standard Counter)</span>
              <span>25% (Aggressive BAFO)</span>
            </div>
          </div>

          {/* Lead Time Expedite Slider */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Clock size={13} className="text-cyan-400" />
                Simulate Schedule Expedite
              </span>
              <span className="text-cyan-300 font-bold text-sm">
                -{activeSim.leadTimeExpediteWeeks} Wks ({activeSimData?.leadTimeWeeks} Wks total)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="1"
              value={activeSim.leadTimeExpediteWeeks}
              onChange={(e) => handleSimChange(activeVendorTab, "leadTimeExpediteWeeks", Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
              <span>0 Wks (Standard)</span>
              <span>-3 Wks (Expedited Freight)</span>
              <span>-6 Wks (Fast-Track PO)</span>
            </div>
          </div>

          {/* Warranty Extension Slider */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-cyan-400" />
                Simulate Warranty Extension
              </span>
              <span className="text-cyan-300 font-bold text-sm">
                +{activeSim.warrantyExtensionYears} Yrs ({activeSimData?.warrantyYears} Yrs total)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={activeSim.warrantyExtensionYears}
              onChange={(e) => handleSimChange(activeVendorTab, "warrantyExtensionYears", Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Strict Binary Gate Simulation */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-semibold text-zinc-200 block">
                Simulate Vendor Redundancy Pre-Certification
              </span>
              <span className="text-[11px] text-zinc-400">
                Assume vendor agrees to factory pre-certify continuous-availability clustering.
              </span>
            </div>
            <button
              onClick={() => handleSimChange(activeVendorTab, "failoverVerified", !activeSim.failoverVerified)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                activeSim.failoverVerified
                  ? "bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20"
                  : "bg-red-950/70 border-red-500 text-red-300"
              }`}
            >
              {activeSim.failoverVerified ? "Failover: YES (Passed)" : "Failover: NO (Disqualified)"}
            </button>
          </div>
        </div>

        {/* Real-Time Outcome Comparison Panel */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block mb-2">
              Round 1 Baseline vs Simulated BAFO
            </span>

            <div className="grid grid-cols-2 gap-3 py-2 border-y border-white/5 text-xs font-mono">
              <div>
                <span className="text-zinc-500 block text-[11px]">Round 1 Base Score</span>
                <span className="text-lg font-bold text-zinc-300">
                  {activeBaseScore?.weighted || 0} / 100
                </span>
                {activeBaseScore?.isDisqualified && (
                  <span className="block text-[10px] text-red-400">Gated Out (Base)</span>
                )}
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Simulated BAFO Score</span>
                <span className="text-lg font-bold text-cyan-300">
                  {activeSimScore?.weighted || 0} / 100
                </span>
                {activeSimScore?.isDisqualified ? (
                  <span className="block text-[10px] text-red-400">Still Gated Out</span>
                ) : (
                  <span className="block text-[10px] text-emerald-400">Gate Qualified</span>
                )}
              </div>
            </div>

            {/* Ranking shift summary */}
            <div className="mt-3 p-3 rounded-lg bg-zinc-900/90 text-xs font-sans">
              <span className="font-semibold text-white block mb-1">Impact on Award Status:</span>
              {simWinner === activeVendorTab && baseWinner !== activeVendorTab ? (
                <p className="text-emerald-300 text-[11px] leading-relaxed">
                  🚀 <strong>Winner Shift:</strong> With these negotiated concessions and failover certification,{" "}
                  <strong>{VENDOR_NAMES[activeVendorTab]}</strong> overtakes {VENDOR_NAMES[baseWinner]} as the #1 Recommended Awardee!
                </p>
              ) : activeSimScore?.isDisqualified ? (
                <p className="text-amber-300 text-[11px] leading-relaxed">
                  ⚠️ <strong>Mandatory Gate Block:</strong> Despite pricing or lead time concessions, this vendor remains <strong>Disqualified</strong> until failover pre-certification is locked in.
                </p>
              ) : (
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Current recommended choice remains <strong>{VENDOR_NAMES[simWinner]}</strong>. Score delta improved by{" "}
                  <strong>+{((activeSimScore?.weighted || 0) - (activeBaseScore?.weighted || 0)).toFixed(1)} pts</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
