import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  FileCheck2,
  BarChart2,
  Layers,
  FileSpreadsheet,
  Printer,
  User,
  FileText,
  Sparkles,
  Crown,
  Eye,
  BadgeCheck,
  Palette,
  Flame,
  Moon,
  Sun,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sliders,
  DollarSign,
  Briefcase,
  TrendingDown,
  Scale,
} from "lucide-react";
import {
  VendorRawQuotes,
  StructuredVendorData,
  DecisionWeights,
  RecommendationResult,
  SignOffRecord,
  VendorMetrics,
  UserRole,
  BackgroundTheme,
  VendorBinaryGateMap,
  MultiTierSignoff,
  CurrencyCode,
  ExchangeRates,
} from "./types";
import {
  INITIAL_QUOTES,
  INITIAL_WEIGHTS,
  VENDOR_NAMES,
  FALLBACK_STRUCTURED_DATA,
  DEFAULT_BINARY_GATES,
  RFQ_SCENARIOS,
} from "./data";
import {
  calculateVendorScores,
  calculateVendorTco,
  generateFallbackRecommendation,
} from "./utils";
import {
  exportToCSV,
  exportToPDF,
  exportToMaadenWord,
  exportToMaadenPowerPoint,
} from "./exportUtils";

import { QuoteInputSection } from "./components/QuoteInputSection";
import { StandardizedLedgerTable } from "./components/StandardizedLedgerTable";
import { RiskAssessmentHeatmap } from "./components/RiskAssessmentHeatmap";
import { SaudiComplianceEngine } from "./components/SaudiComplianceEngine";
import { ScoreChartAndWeights } from "./components/ScoreChartAndWeights";
import { RadarComparisonChart } from "./components/RadarComparisonChart";
import { TcoLifecycleAnalysis } from "./components/TcoLifecycleAnalysis";
import { NegotiationSimulator } from "./components/NegotiationSimulator";
import { NegotiationLetterGenerator } from "./components/NegotiationLetterGenerator";
import { RecommendationAndSignoff } from "./components/RecommendationAndSignoff";
import { RfqScenarioSwitcher } from "./components/RfqScenarioSwitcher";
import { ProcurementChatAssistant } from "./components/ProcurementChatAssistant";
import { LanternLogo } from "./components/LanternLogo";

export default function App() {
  const [quotes, setQuotes] = useState<VendorRawQuotes>(INITIAL_QUOTES);
  const [structuredData, setStructuredData] = useState<StructuredVendorData | null>(FALLBACK_STRUCTURED_DATA);
  const [isStandardizing, setIsStandardizing] = useState<boolean>(false);
  const [standardizeError, setStandardizeError] = useState<string | null>(null);
  const [isSimulatedData, setIsSimulatedData] = useState<boolean>(false);

  // Binary Compliance & Failover Gates State (Strict YES / NO)
  const [binaryGates, setBinaryGates] = useState<VendorBinaryGateMap>(DEFAULT_BINARY_GATES);

  // Weights state
  const [weights, setWeights] = useState<DecisionWeights>(INITIAL_WEIGHTS);

  // Active RFQ Scenario
  const [activeScenarioId, setActiveScenarioId] = useState<string>("security-command-center");

  // Currency & Rate state
  const [currency, setCurrency] = useState<CurrencyCode>("SAR");
  const [ratesData, setRatesData] = useState<ExchangeRates>({
    base: "USD",
    rates: { USD: 1.0, SAR: 3.75, EUR: 0.918 },
    lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    source: "SAMA Peg / ECB Benchmark",
  });

  // Price conversion helper
  const convertPrice = (priceUSD: number, targetCurrency: CurrencyCode) => {
    const rate = ratesData.rates[targetCurrency] || 1.0;
    return priceUSD * rate;
  };

  const formatCurrency = (priceUSD: number, targetCurrency: CurrencyCode) => {
    const converted = convertPrice(priceUSD, targetCurrency);
    if (targetCurrency === "SAR") {
      return `${Math.round(converted).toLocaleString()} SAR`;
    } else if (targetCurrency === "EUR") {
      return `€${Math.round(converted).toLocaleString()}`;
    } else {
      return `$${Math.round(converted).toLocaleString()}`;
    }
  };

  // Negotiation Letter Modal state
  const [letterVendorKey, setLetterVendorKey] = useState<string | null>(null);

  // AI Recommendation State
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [isGeneratingRec, setIsGeneratingRec] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Single Signoff Fallback & Multi-Tier Signoff State
  const [signoff, setSignoff] = useState<SignOffRecord | null>(null);
  const [multiTierSignoff, setMultiTierSignoff] = useState<MultiTierSignoff>({
    tier1Tech: { status: "pending" },
    tier2Finance: { status: "pending" },
    tier3Executive: { status: "pending" },
    awardedVendorKey: null,
  });

  const [userRole, setUserRole] = useState<UserRole>("Procurement Officer");
  const [bgTheme, setBgTheme] = useState<BackgroundTheme>(() => {
    return (localStorage.getItem("lantern_bg_theme") as BackgroundTheme) || "glowing-red";
  });
  const [showRoleToast, setShowRoleToast] = useState<boolean>(false);
  const [roleToastMessage, setRoleToastMessage] = useState<string>("");

  // Persist background theme selection
  useEffect(() => {
    localStorage.setItem("lantern_bg_theme", bgTheme);
  }, [bgTheme]);

  // Handle role switch with smooth toast notification
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    if (newRole === "Approver") {
      setRoleToastMessage("Approver Mode Active: Final sign-off & override authorization unlocked.");
    } else if (newRole === "Procurement Officer") {
      setRoleToastMessage("Procurement Officer Mode: Full ledger editing & weight modeling enabled.");
    } else {
      setRoleToastMessage("Client Viewer Mode: Read-only governance & compliance audit mode.");
    }
    setShowRoleToast(true);
    setTimeout(() => setShowRoleToast(false), 3800);
  };

  // Toggle Binary Gate (Strict YES/NO)
  const handleToggleBinaryGate = (
    vendorKey: string,
    gateKey: "failoverVerified" | "complianceCertified"
  ) => {
    setBinaryGates((prev) => {
      const current = prev[vendorKey] || { failoverVerified: false, complianceCertified: true };
      return {
        ...prev,
        [vendorKey]: {
          ...current,
          [gateKey]: !current[gateKey],
        },
      };
    });
  };

  // Compute vendor scores whenever structuredData, weights, or binaryGates change
  const scores = useMemo(() => {
    if (!structuredData) return {};
    return calculateVendorScores(structuredData, weights, binaryGates);
  }, [structuredData, weights, binaryGates]);

  // Scenario Switcher Handler
  const handleSelectScenario = (scenario: (typeof RFQ_SCENARIOS)[0]) => {
    setActiveScenarioId(scenario.id);
    setQuotes(scenario.quotes);
    if (scenario.initialGates) {
      setBinaryGates(scenario.initialGates);
    }
    if (scenario.weights) {
      setWeights(scenario.weights);
    }
    setRecommendation(null);
    setSignoff(null);
    setMultiTierSignoff({
      tier1Tech: { status: "pending" },
      tier2Finance: { status: "pending" },
      tier3Executive: { status: "pending" },
      awardedVendorKey: null,
    });
    setRoleToastMessage(`Scenario loaded: ${scenario.name}`);
    setShowRoleToast(true);
    setTimeout(() => setShowRoleToast(false), 3000);
  };

  // Handle manual editing of vendor data
  const handleUpdateVendorData = (vendorKey: string, updatedMetrics: VendorMetrics) => {
    setStructuredData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [vendorKey]: updatedMetrics,
      };
    });
  };

  // Apply simulated data from NegotiationSimulator
  const handleApplySimulatedData = (
    simData: StructuredVendorData,
    simGates: VendorBinaryGateMap
  ) => {
    setStructuredData(simData);
    setBinaryGates(simGates);
    setRoleToastMessage("BAFO negotiated parameters applied to active ledger.");
    setShowRoleToast(true);
    setTimeout(() => setShowRoleToast(false), 3000);
  };

  // Multi-Tier Sequential Approval Handlers
  const handleApproveTier = (
    tier: "tier1Tech" | "tier2Finance" | "tier3Executive",
    signee: string,
    comments?: string
  ) => {
    const sortedVendors = Object.keys(scores).sort(
      (a, b) => (scores[b]?.weighted || 0) - (scores[a]?.weighted || 0)
    );
    const qualifiedVendors = sortedVendors.filter((k) => !scores[k]?.isDisqualified);
    const targetVendor = qualifiedVendors[0] || sortedVendors[0] || "meridian";

    setMultiTierSignoff((prev) => {
      const now = new Date().toLocaleString();
      const updated = {
        ...prev,
        [tier]: {
          status: "approved" as const,
          signeeName: signee,
          timestamp: now,
          comments: comments || "Verified and certified under governance compliance standards.",
        },
      };

      if (tier === "tier3Executive") {
        updated.awardedVendorKey = targetVendor;
        // Also update unified signoff record
        setSignoff({
          status: "approved",
          vendor: targetVendor,
          reason: "Awarded following successful 3-Tier Multi-Disciplinary sign-off.",
          signoffUser: signee,
          time: now,
        });
      }
      return updated;
    });
  };

  const handleResetMultiTier = () => {
    setMultiTierSignoff({
      tier1Tech: { status: "pending" },
      tier2Finance: { status: "pending" },
      tier3Executive: { status: "pending" },
      awardedVendorKey: null,
    });
    setSignoff(null);
  };

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(structuredData, scores, weights, recommendation, signoff);
  };

  const handleExportPDF = () => {
    exportToPDF(structuredData, scores, weights, recommendation, signoff);
  };

  const handleExportWord = () => {
    exportToMaadenWord(structuredData, scores, weights, recommendation, signoff);
  };

  const handleExportPPT = () => {
    exportToMaadenPowerPoint(structuredData, scores, weights, recommendation, signoff);
  };

  // Standardize Quotations Handler
  const handleStandardize = async () => {
    setIsStandardizing(true);
    setStandardizeError(null);
    setIsSimulatedData(false);

    try {
      const res = await fetch("/api/standardize-quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotes }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setStructuredData(data);
    } catch (err: any) {
      console.warn("API Call Failed, falling back to local extraction logic:", err);
      setStructuredData(FALLBACK_STRUCTURED_DATA);
      setIsSimulatedData(true);
    } finally {
      setIsStandardizing(false);
    }
  };

  // Generate Recommendation Handler
  const handleGenerateRecommendation = async () => {
    if (!structuredData) return;
    setIsGeneratingRec(true);
    setRecError(null);

    const vendorKeys = Object.keys(VENDOR_NAMES);
    const sortedVendors = [...vendorKeys].sort(
      (a, b) => (scores[b]?.weighted || 0) - (scores[a]?.weighted || 0)
    );
    const qualifiedVendors = sortedVendors.filter((k) => !scores[k]?.isDisqualified);
    const topVendor = qualifiedVendors[0] || sortedVendors[0] || "meridian";
    const secondVendor = qualifiedVendors[1] || sortedVendors[1] || "vantage";

    try {
      const res = await fetch("/api/generate-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredData,
          scores,
          weights,
          binaryGates,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const result = await res.json();
      setRecommendation(result);
    } catch (err: any) {
      console.warn("API Call Failed, falling back to local synthesis:", err);
      const fallback = generateFallbackRecommendation(
        structuredData,
        scores,
        topVendor,
        secondVendor,
        VENDOR_NAMES
      );
      setRecommendation(fallback);
    } finally {
      setIsGeneratingRec(false);
    }
  };

  // Approval Handlers
  const handleApprove = () => {
    if (!recommendation) return;
    setSignoff({
      status: "approved",
      vendor: recommendation.recommendedVendor,
      reason: "Approved as recommended by AI decision synthesis.",
      signoffUser: userRole === "Approver" ? "VP of Global Procurement" : "Senior Procurement Lead",
      time: new Date().toLocaleString(),
    });
  };

  const handleOverride = (vendorKey: string, reason: string, user: string) => {
    setSignoff({
      status: "overridden",
      vendor: vendorKey,
      reason,
      signoffUser: user,
      time: new Date().toLocaleString(),
    });
  };

  const handleResetSignoff = () => {
    setSignoff(null);
  };

  // Dynamic Theme Configuration based on userRole
  const roleTheme = useMemo(() => {
    if (userRole === "Approver") {
      return {
        key: "approver",
        headerBorder: "border-amber-400/50 shadow-lg shadow-amber-500/20",
        rolePillBg: "bg-amber-950/70 border-amber-400/50 text-amber-300 shadow-amber-500/20",
        roleIcon: <Crown size={14} className="text-amber-400 shrink-0" />,
        roleLabel: "Approver (VP Level)",
        actionBtn: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-amber-500/25",
        accentText: "text-amber-400",
        glowColor: "rgba(245, 158, 11, 0.25)",
        badgeBorder: "border-amber-400/40 text-amber-300",
        accessLevel: "Executive Governance & Final Sign-Off Authority",
      };
    }
    if (userRole === "Client Viewer") {
      return {
        key: "viewer",
        headerBorder: "border-emerald-500/40 shadow-lg shadow-emerald-500/15",
        rolePillBg: "bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-emerald-500/15",
        roleIcon: <Eye size={14} className="text-emerald-400 shrink-0" />,
        roleLabel: "Client Viewer (Read-Only)",
        actionBtn: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25",
        accentText: "text-emerald-400",
        glowColor: "rgba(16, 185, 129, 0.2)",
        badgeBorder: "border-emerald-500/40 text-emerald-300",
        accessLevel: "Read-Only Audit & Transparency Access",
      };
    }
    // Default: Procurement Officer
    return {
      key: "officer",
      headerBorder: "border-cyan-500/40 shadow-lg shadow-cyan-500/15",
      rolePillBg: "bg-zinc-950/70 border-cyan-500/40 text-cyan-300 shadow-cyan-500/15",
      roleIcon: <ShieldCheck size={14} className="text-cyan-400 shrink-0" />,
      roleLabel: "Procurement Officer",
      actionBtn: "bg-cyan-600/90 hover:bg-cyan-500 text-white shadow-cyan-600/25",
      accentText: "text-cyan-400",
      glowColor: "rgba(6, 182, 212, 0.2)",
      badgeBorder: "border-cyan-500/40 text-cyan-300",
      accessLevel: "Operational RFP Sourcing & Criteria Modeling",
    };
  }, [userRole]);

  // Background Canvas styles
  const bgCanvasClasses = useMemo(() => {
    switch (bgTheme) {
      case "dark-obsidian":
        return "bg-[#080a11] bg-[radial-gradient(ellipse_100%_90%_at_50%_-15%,rgba(30,58,138,0.25),rgba(15,23,42,0.4)_45%,rgba(8,10,17,1)_100%)] text-zinc-100";
      case "light-porcelain":
        return "bg-[#f8fafc] bg-[radial-gradient(ellipse_100%_90%_at_50%_-15%,rgba(226,232,240,0.9),rgba(241,245,249,0.7)_45%,rgba(248,250,252,1)_100%)] text-zinc-900";
      case "glowing-red":
      default:
        return "bg-[#0a0507] bg-[radial-gradient(ellipse_100%_90%_at_50%_-15%,rgba(225,29,72,0.28),rgba(153,27,27,0.12)_45%,rgba(10,5,7,1)_100%)] text-zinc-100";
    }
  }, [bgTheme]);

  const [showBgDropdown, setShowBgDropdown] = useState(false);

  return (
    <div
      className={`min-h-screen font-sans antialiased selection:bg-red-600 selection:text-white relative transition-all duration-700 ease-in-out ${bgCanvasClasses} theme-role-${roleTheme.key}`}
    >
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-700">
        {bgTheme === "glowing-red" && (
          <>
            <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-red-600/35 via-rose-600/20 to-transparent blur-[140px] rounded-full animate-pulse-glow"></div>
            <div className="absolute top-1/4 -left-28 w-[650px] h-[650px] bg-gradient-to-tr from-red-600/25 to-rose-500/15 blur-[160px] rounded-full"></div>
            <div className="absolute top-1/2 -right-28 w-[700px] h-[700px] bg-gradient-to-bl from-red-500/25 to-rose-700/20 blur-[170px] rounded-full"></div>
            <div className="absolute bottom-5 left-1/3 w-[600px] h-[450px] bg-red-700/20 blur-[150px] rounded-full"></div>
          </>
        )}
        {bgTheme === "dark-obsidian" && (
          <>
            <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-blue-600/30 via-indigo-600/20 to-transparent blur-[140px] rounded-full animate-pulse-glow"></div>
            <div className="absolute top-1/4 -left-28 w-[650px] h-[650px] bg-gradient-to-tr from-cyan-600/20 to-indigo-500/15 blur-[160px] rounded-full"></div>
            <div className="absolute top-1/2 -right-28 w-[700px] h-[700px] bg-gradient-to-bl from-blue-500/20 to-slate-700/20 blur-[170px] rounded-full"></div>
          </>
        )}
        {bgTheme === "light-porcelain" && (
          <>
            <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-rose-200/40 via-blue-100/30 to-transparent blur-[130px] rounded-full"></div>
            <div className="absolute top-1/3 -left-20 w-[550px] h-[450px] bg-indigo-100/40 blur-[130px] rounded-full"></div>
          </>
        )}
      </div>

      {/* Floating Animated Role Switch Toast Notification */}
      {showRoleToast && (
        <div
          className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl glass-header border shadow-2xl flex items-center gap-2 sm:gap-2.5 backdrop-blur-2xl text-xs font-medium animate-fadeIn transition-all duration-300 max-w-[92vw] sm:max-w-md w-auto"
          style={{
            borderColor:
              userRole === "Approver"
                ? "rgba(245, 158, 11, 0.6)"
                : userRole === "Client Viewer"
                ? "rgba(16, 185, 129, 0.6)"
                : "rgba(6, 182, 212, 0.6)",
            boxShadow: `0 10px 40px -10px ${roleTheme.glowColor}`,
          }}
        >
          {roleTheme.roleIcon}
          <span className="text-white font-bold whitespace-nowrap">{roleTheme.roleLabel}</span>
          <span className="text-zinc-500 hidden sm:inline">•</span>
          <span className="text-zinc-300 text-[11px] truncate sm:whitespace-normal">{roleToastMessage}</span>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {/* Header with Live Animated Lantern Company Logo */}
        <header
          className={`mb-6 sm:mb-8 glass-header p-4 sm:p-6 rounded-2xl relative overflow-hidden shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 transition-all duration-500 ease-in-out ${roleTheme.headerBorder}`}
        >
          <div className="absolute top-0 right-0 w-96 h-32 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-between sm:justify-start gap-3">
            <LanternLogo size="lg" showTagline={true} animated={true} className="max-w-[220px] sm:max-w-none" />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 justify-start sm:justify-end">
            {/* Active Governance Role Toggle with Dynamic Theming */}
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono backdrop-blur-md shadow-inner transition-all duration-500 ease-in-out ${roleTheme.rolePillBg}`}
            >
              <span className="transition-transform duration-300 transform scale-105">
                {roleTheme.roleIcon}
              </span>
              <span className="text-zinc-400 hidden sm:inline text-[11px]">Role:</span>
              <select
                value={userRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="Procurement Officer" className="bg-zinc-950 text-white">
                  Procurement Officer
                </option>
                <option value="Approver" className="bg-zinc-950 text-white">
                  Approver (VP Level)
                </option>
                <option value="Client Viewer" className="bg-zinc-950 text-white">
                  Client Viewer (Read-Only)
                </option>
              </select>
            </div>

            {/* Background & Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBgDropdown(!showBgDropdown)}
                className="font-sans text-xs px-3.5 py-2 rounded-xl bg-zinc-900/70 border border-white/12 text-zinc-300 hover:text-white hover:border-zinc-400 font-medium flex items-center gap-1.5 transition-all shadow-sm backdrop-blur-md hover:bg-zinc-800/80 cursor-pointer"
                title="Change Background Appearance"
              >
                <Palette size={14} className="text-rose-400" />
                <span className="hidden sm:inline">Theme</span>
              </button>

              {showBgDropdown && (
                <div
                  className="absolute right-0 mt-2 w-64 p-3 rounded-2xl glass-header border border-white/15 shadow-2xl backdrop-blur-3xl z-50 space-y-2 animate-fadeIn"
                  onMouseLeave={() => setShowBgDropdown(false)}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] font-mono text-zinc-400">
                    <span className="font-bold text-zinc-200">Background Canvas</span>
                    <button
                      onClick={() => {
                        setBgTheme("glowing-red");
                        setShowBgDropdown(false);
                      }}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                      title="Reset to default glowing red background"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <button
                      onClick={() => {
                        setBgTheme("glowing-red");
                        setShowBgDropdown(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                        bgTheme === "glowing-red"
                          ? "bg-red-500/20 border border-red-500/40 text-white font-bold"
                          : "hover:bg-white/5 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 border border-white/30"></span>
                        <span>Glowing Red (Default)</span>
                      </div>
                      {bgTheme === "glowing-red" && <CheckCircle2 size={13} className="text-red-400" />}
                    </button>

                    <button
                      onClick={() => {
                        setBgTheme("dark-obsidian");
                        setShowBgDropdown(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                        bgTheme === "dark-obsidian"
                          ? "bg-blue-500/20 border border-blue-500/40 text-white font-bold"
                          : "hover:bg-white/5 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-blue-600 to-slate-800 border border-white/30"></span>
                        <span>Midnight Obsidian</span>
                      </div>
                      {bgTheme === "dark-obsidian" && <CheckCircle2 size={13} className="text-blue-400" />}
                    </button>

                    <button
                      onClick={() => {
                        setBgTheme("light-porcelain");
                        setShowBgDropdown(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                        bgTheme === "light-porcelain"
                          ? "bg-zinc-700/40 border border-white/40 text-white font-bold"
                          : "hover:bg-white/5 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-zinc-100 to-zinc-300 border border-zinc-400"></span>
                        <span>Enterprise Porcelain</span>
                      </div>
                      {bgTheme === "light-porcelain" && <CheckCircle2 size={13} className="text-zinc-200" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              className="font-sans text-xs px-3.5 py-2 rounded-xl bg-zinc-900/70 border border-white/12 text-zinc-300 hover:text-white hover:border-zinc-500 font-medium flex items-center gap-1.5 transition-all shadow-sm backdrop-blur-md hover:bg-zinc-800/80 cursor-pointer"
              title="Download CSV Audit Log"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportPDF}
              className={`font-sans text-xs px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md cursor-pointer ${roleTheme.actionBtn}`}
              title="Print or Save PDF Executive Summary"
            >
              <Printer size={15} />
              <span>PDF Summary</span>
            </button>

            <span
              className={`font-mono text-xs px-3.5 py-2 rounded-xl bg-zinc-950/70 border font-medium flex items-center gap-1.5 shadow-inner backdrop-blur-md transition-all duration-500 ease-in-out ${roleTheme.badgeBorder}`}
            >
              <ShieldCheck size={15} className={roleTheme.accentText} />
              <span>RFQ-2026-0803</span>
            </span>
          </div>
        </header>

        {/* RFQ Scenario Switcher */}
        <RfqScenarioSwitcher
          activeScenarioId={activeScenarioId}
          onSelectScenario={handleSelectScenario}
        />

        {/* Component 1: Raw Quotes Input */}
        <QuoteInputSection
          quotes={quotes}
          setQuotes={setQuotes}
          onStandardize={handleStandardize}
          isStandardizing={isStandardizing}
          error={standardizeError}
          onApplyParsedProposal={handleUpdateVendorData}
        />

        {/* Component 2: Standardized Comparison Ledger */}
        {structuredData && (
          <StandardizedLedgerTable
            data={structuredData}
            scores={scores}
            isSimulated={isSimulatedData}
            onUpdateVendorData={handleUpdateVendorData}
            binaryGates={binaryGates}
            onToggleBinaryGate={handleToggleBinaryGate}
          />
        )}

        {/* Component 2.5: Risk Assessment & Outlier Heatmap */}
        {structuredData && (
          <RiskAssessmentHeatmap data={structuredData} />
        )}

        {/* Component 2.8: Saudi Compliance & Regulatory Logic Gate Engine */}
        {structuredData && (
          <SaudiComplianceEngine
            data={structuredData}
            onUpdateVendorData={handleUpdateVendorData}
          />
        )}

        {/* Component 3: Binary Gatekeeper & Evaluative Weights Matrix */}
        {structuredData && (
          <ScoreChartAndWeights
            weights={weights}
            setWeights={setWeights}
            scores={scores}
            binaryGates={binaryGates}
            onToggleBinaryGate={handleToggleBinaryGate}
          />
        )}

        {/* Component 3.2: Multi-Dimensional Radar Comparison Chart */}
        {structuredData && (
          <RadarComparisonChart
            data={structuredData}
            scores={scores}
            binaryGates={binaryGates}
          />
        )}

        {/* Component 3.5: 3-to-5 Year TCO Lifecycle & Financial Risk Analysis */}
        {structuredData && (
          <TcoLifecycleAnalysis
            data={structuredData}
            binaryGates={binaryGates}
            currency={currency}
            convertPrice={convertPrice}
            formatCurrency={formatCurrency}
          />
        )}

        {/* Component 3.8: BAFO Negotiation "What-If" Sensitivity Simulator */}
        {structuredData && (
          <NegotiationSimulator
            baseData={structuredData}
            weights={weights}
            baseScores={scores}
            baseGates={binaryGates}
            currency={currency}
            formatCurrency={formatCurrency}
            onApplySimulatedData={handleApplySimulatedData}
            onOpenLetterGenerator={(vKey) => setLetterVendorKey(vKey)}
          />
        )}

        {/* Component 4: Recommendation & Multi-Tier Signoff Governance */}
        {structuredData && (
          <RecommendationAndSignoff
            onGenerate={handleGenerateRecommendation}
            isGenerating={isGeneratingRec}
            recommendation={recommendation}
            error={recError}
            signoff={signoff}
            multiTierSignoff={multiTierSignoff}
            onApproveTier={handleApproveTier}
            onResetMultiTier={handleResetMultiTier}
            onApprove={handleApprove}
            onOverride={handleOverride}
            onResetSignoff={handleResetSignoff}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onExportWord={handleExportWord}
            onExportPPT={handleExportPPT}
            userRole={userRole}
            binaryGates={binaryGates}
            scores={scores}
          />
        )}

        {/* Footer */}
        <footer className="text-xs font-mono text-zinc-500 py-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LanternLogo size="sm" showTagline={false} animated={true} />
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Enterprise Procurement Governance & Binary Gate Verification</span>
          </div>
          <span className="text-zinc-600 text-[11px]">Lantern Intelligent Operations Suite — RFQ-2026</span>
        </footer>
      </div>

      {/* Floating Procurement Chat Assistant with dynamic theme alignment */}
      <ProcurementChatAssistant
        structuredData={structuredData}
        scores={scores}
        weights={weights}
        recommendation={recommendation}
        signoff={signoff}
        quotes={quotes}
        bgTheme={bgTheme}
        binaryGates={binaryGates}
      />

      {/* Formal Negotiation Letter Generator Modal */}
      {letterVendorKey && structuredData && (
        <NegotiationLetterGenerator
          vendorKey={letterVendorKey}
          data={structuredData}
          binaryGates={binaryGates}
          formatCurrency={formatCurrency}
          currency={currency}
          onClose={() => setLetterVendorKey(null)}
        />
      )}
    </div>
  );
}
