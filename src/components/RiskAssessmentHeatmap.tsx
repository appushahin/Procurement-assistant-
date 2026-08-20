import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  Zap,
  HelpCircle,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  AlertOctagon,
  ArrowRight
} from "lucide-react";
import { StructuredVendorData, VendorMetrics } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";
import { StatusBadge } from "./StatusBadge";

interface RiskAssessmentHeatmapProps {
  data: StructuredVendorData;
}

export type RiskLevel = "low" | "medium" | "high";

export interface RiskThresholds {
  targetPriceUSD: number;
  maxLeadTimeWeeks: number;
  minWarrantyYears: number;
  requirePreCertification: boolean;
}

export interface MetricRiskResult {
  metricName: string;
  valueDisplay: string;
  riskLevel: RiskLevel;
  benchmarkDisplay: string;
  varianceText: string;
  riskDescription: string;
}

const PRESET_THRESHOLDS: Record<string, { label: string; thresholds: RiskThresholds }> = {
  standard: {
    label: "Standard Enterprise Baseline",
    thresholds: {
      targetPriceUSD: 75000,
      maxLeadTimeWeeks: 10,
      minWarrantyYears: 4,
      requirePreCertification: true,
    },
  },
  aggressive_timeline: {
    label: "Aggressive Schedule (< 8 Wks)",
    thresholds: {
      targetPriceUSD: 80000,
      maxLeadTimeWeeks: 8,
      minWarrantyYears: 3,
      requirePreCertification: true,
    },
  },
  strict_compliance: {
    label: "High Reliability & Compliance",
    thresholds: {
      targetPriceUSD: 85000,
      maxLeadTimeWeeks: 12,
      minWarrantyYears: 5,
      requirePreCertification: true,
    },
  },
  budget_constrained: {
    label: "Budget Ceiling ($65,000)",
    thresholds: {
      targetPriceUSD: 65000,
      maxLeadTimeWeeks: 14,
      minWarrantyYears: 3,
      requirePreCertification: false,
    },
  },
};

export function evaluateVendorMetricRisks(
  metrics: VendorMetrics,
  thresholds: RiskThresholds
): Record<string, MetricRiskResult> {
  const results: Record<string, MetricRiskResult> = {};

  // 1. Price Risk
  const price = metrics.priceUSD;
  const priceTarget = thresholds.targetPriceUSD;
  const priceDiff = price - priceTarget;
  const pricePct = ((priceDiff / priceTarget) * 100).toFixed(1);

  let priceLevel: RiskLevel = "low";
  let priceDesc = "Price is within target industry budget limits.";
  if (price > priceTarget * 1.15) {
    priceLevel = "high";
    priceDesc = `Price is ${Math.abs(priceDiff).toLocaleString()} (${pricePct}%) above budget target. Significant cost overrun risk.`;
  } else if (price > priceTarget) {
    priceLevel = "medium";
    priceDesc = `Price is ${Math.abs(priceDiff).toLocaleString()} (${pricePct}%) slightly over target budget.`;
  } else {
    priceDesc = `Price is ${Math.abs(priceDiff).toLocaleString()} below or equal to target budget ceiling.`;
  }

  results.price = {
    metricName: "Total Price (USD)",
    valueDisplay: `${price.toLocaleString()}`,
    riskLevel: priceLevel,
    benchmarkDisplay: `≤ ${priceTarget.toLocaleString()}`,
    varianceText: priceDiff > 0 ? `+${priceDiff.toLocaleString()} (+${pricePct}%)` : `-${Math.abs(priceDiff).toLocaleString()}`,
    riskDescription: priceDesc,
  };

  // 2. Lead Time Risk
  const lead = metrics.leadTimeWeeks;
  const maxLead = thresholds.maxLeadTimeWeeks;
  const leadDiff = lead - maxLead;

  let leadLevel: RiskLevel = "low";
  let leadDesc = "Lead time meets target deployment schedule.";
  if (lead > maxLead + 2) {
    leadLevel = "high";
    leadDesc = `${lead} weeks delivery exceeds ${maxLead}-week benchmark by ${leadDiff} weeks. Major project schedule delay risk.`;
  } else if (lead > maxLead) {
    leadLevel = "medium";
    leadDesc = `${lead} weeks lead time is slightly over the ${maxLead}-week baseline target.`;
  }

  results.leadTime = {
    metricName: "Delivery Lead Time",
    valueDisplay: `${lead} Wks`,
    riskLevel: leadLevel,
    benchmarkDisplay: `≤ ${maxLead} Wks`,
    varianceText: leadDiff > 0 ? `+${leadDiff} wks over target` : `${Math.abs(leadDiff)} wks buffer`,
    riskDescription: leadDesc,
  };

  // 3. Warranty Coverage Risk
  const warranty = metrics.warrantyYears;
  const minWarranty = thresholds.minWarrantyYears;
  const warrantyDiff = warranty - minWarranty;

  let warrantyLevel: RiskLevel = "low";
  let warrantyDesc = "Warranty coverage satisfies enterprise protection guidelines.";
  if (warranty < minWarranty - 1) {
    warrantyLevel = "high";
    warrantyDesc = `${warranty}-year warranty is below the ${minWarranty}-year requirement. High maintenance liability risk.`;
  } else if (warranty < minWarranty) {
    warrantyLevel = "medium";
    warrantyDesc = `${warranty}-year warranty is 1 year below the preferred ${minWarranty}-year target.`;
  }

  results.warranty = {
    metricName: "Warranty Protection",
    valueDisplay: `${warranty} Yrs`,
    riskLevel: warrantyLevel,
    benchmarkDisplay: `≥ ${minWarranty} Yrs`,
    varianceText: warrantyDiff < 0 ? `${warrantyDiff} yrs below target` : `+${warrantyDiff} yrs extended`,
    riskDescription: warrantyDesc,
  };

  // 4. Failover & Compliance Certification Risk
  const certified = metrics.redundancyCertified;
  let certLevel: RiskLevel = "low";
  let certDesc = "Factory pre-certified for continuous availability clustering.";
  if (!certified && thresholds.requirePreCertification) {
    certLevel = "high";
    certDesc = "Not factory pre-certified. Requires manual driver/workaround engineering; higher failover failure risk.";
  } else if (!certified) {
    certLevel = "medium";
    certDesc = "Requires workaround or custom setup for full failover support.";
  }

  results.compliance = {
    metricName: "Failover Certification",
    valueDisplay: certified ? "Pre-Certified" : "Uncertified",
    riskLevel: certLevel,
    benchmarkDisplay: thresholds.requirePreCertification ? "Pre-Certified Required" : "Optional",
    varianceText: certified ? "Fully Compliant" : "Workaround Needed",
    riskDescription: certDesc,
  };

  // 5. Support SLA Risk
  const slaText = (metrics.supportSLA || "").toLowerCase();
  let slaLevel: RiskLevel = "low";
  let slaDesc = "24/7 dedicated or rapid on-site response SLA.";

  if (slaText.includes("business-hours") || slaText.includes("add-on") || slaText.includes("email")) {
    slaLevel = "high";
    slaDesc = "Business-hours email or paid add-on required. Severe response delay risk for critical outages.";
  } else if (slaText.includes("8-hour")) {
    slaLevel = "medium";
    slaDesc = "8-hour response SLA provided. Moderate downtime window during emergency events.";
  }

  results.supportSLA = {
    metricName: "Support SLA Response",
    valueDisplay: metrics.supportSLA || "Standard",
    riskLevel: slaLevel,
    benchmarkDisplay: "24/7 4h On-Site",
    varianceText: slaLevel === "low" ? "Tier 1 SLA" : slaLevel === "medium" ? "8-Hour SLA" : "Limited SLA",
    riskDescription: slaDesc,
  };

  return results;
}

export function RiskAssessmentHeatmap({ data }: RiskAssessmentHeatmapProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("standard");
  const [thresholds, setThresholds] = useState<RiskThresholds>(PRESET_THRESHOLDS.standard.thresholds);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<"all" | "high" | "medium_high">("all");

  // Requirement #9: Outlier details drawer state
  const [activeOutlierDrawer, setActiveOutlierDrawer] = useState<{
    vendorKey: string;
    vendorName: string;
    metricKey: string;
    risk: MetricRiskResult;
  } | null>(null);

  const vendorKeys = Object.keys(VENDOR_NAMES);

  // Handle Preset Selection
  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (PRESET_THRESHOLDS[presetKey]) {
      setThresholds({ ...PRESET_THRESHOLDS[presetKey].thresholds });
    }
  };

  // Compute metric risks for all vendors
  const vendorRisks = useMemo(() => {
    const map: Record<string, Record<string, MetricRiskResult>> = {};
    if (!data) return map;
    vendorKeys.forEach((key) => {
      if (data[key]) {
        map[key] = evaluateVendorMetricRisks(data[key], thresholds);
      }
    });
    return map;
  }, [data, thresholds, vendorKeys]);

  // Aggregate Outliers across all vendors
  const allOutliers = useMemo(() => {
    const list: Array<{
      vendorKey: string;
      vendorName: string;
      metricKey: string;
      risk: MetricRiskResult;
    }> = [];

    Object.keys(vendorRisks).forEach((vk) => {
      const risks = vendorRisks[vk];
      if (!risks) return;
      Object.keys(risks).forEach((mk) => {
        const item = risks[mk];
        if (item.riskLevel === "high" || (filterSeverity === "medium_high" && item.riskLevel === "medium")) {
          list.push({
            vendorKey: vk,
            vendorName: VENDOR_NAMES[vk] || vk,
            metricKey: mk,
            risk: item,
          });
        }
      });
    });

    return list;
  }, [vendorRisks, filterSeverity]);

  // Total High Risk Count
  const highRiskCount = useMemo(() => {
    let count = 0;
    Object.values(vendorRisks).forEach((vr) => {
      (Object.values(vr) as MetricRiskResult[]).forEach((m) => {
        if (m.riskLevel === "high") count++;
      });
    });
    return count;
  }, [vendorRisks]);

  // Composite Risk Score for each vendor (0 = lowest risk, 100 = highest risk)
  const compositeVendorRisk = useMemo(() => {
    const scoresMap: Record<string, { score: number; label: string; color: string; status: "low" | "review" | "high" }> = {};
    Object.keys(vendorRisks).forEach((vk) => {
      const vr = vendorRisks[vk];
      if (!vr) return;
      let penalty = 0;
      (Object.values(vr) as MetricRiskResult[]).forEach((m) => {
        if (m.riskLevel === "high") penalty += 25;
        if (m.riskLevel === "medium") penalty += 10;
      });
      const finalScore = Math.min(100, penalty);
      let label = "LOW RISK";
      let status: "low" | "review" | "high" = "low";
      let color = "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
      if (finalScore >= 50) {
        label = "HIGH OUTLIER RISK";
        status = "high";
        color = "text-red-400 bg-red-950/80 border-red-500/50";
      } else if (finalScore >= 20) {
        label = "MODERATE RISK";
        status = "review";
        color = "text-amber-300 bg-amber-950/60 border-amber-500/40";
      }
      scoresMap[vk] = { score: finalScore, label, color, status };
    });
    return scoresMap;
  }, [vendorRisks]);

  const criteriaList = [
    { key: "price", label: "Total Price (USD)", icon: DollarSign },
    { key: "leadTime", label: "Lead Time (Weeks)", icon: Clock },
    { key: "warranty", label: "Warranty (Years)", icon: Shield },
    { key: "compliance", label: "Failover Certification", icon: Zap },
    { key: "supportSLA", label: "Support SLA Response", icon: CheckCircle2 },
  ];

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background ambient red glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Module Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              Step 3: Industry Threshold Risk Assessment
            </span>
            <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
          </div>
          <h3 className="font-sans text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Risk Heatmap & Outlier Detection</span>
            {highRiskCount > 0 && (
              <StatusBadge status="high" label={`${highRiskCount} Outliers Flagged`} size="sm" />
            )}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Evaluates vendor metrics against pre-defined industry benchmarks to instantly surface delivery bottlenecks, cost overruns, and compliance exceptions.
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-white/10 rounded-xl p-1 backdrop-blur-md">
            <span className="text-[11px] font-mono text-zinc-400 pl-2">Preset:</span>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="bg-zinc-900 text-xs font-mono font-semibold text-white px-2.5 py-1.5 rounded-lg border border-white/10 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              {Object.keys(PRESET_THRESHOLDS).map((k) => (
                <option key={k} value={k}>
                  {PRESET_THRESHOLDS[k].label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Threshold Tuning Button (Cyan Accent) */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`font-sans text-xs px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              showConfig
                ? "bg-cyan-600 text-white border border-cyan-400"
                : "bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <SlidersHorizontal size={14} className={showConfig ? "text-white" : "text-cyan-400"} />
            <span>Customize Thresholds</span>
            {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expandable Custom Threshold Tuning Panel */}
      {showConfig && (
        <div className="mb-6 p-4 rounded-2xl bg-zinc-950/90 border border-cyan-500/30 shadow-2xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-cyan-400" />
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Industry Benchmark & Threshold Configuration
              </h4>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 italic">
              Changes instantly update risk colors below
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* Price Target */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10">
              <label className="block text-zinc-300 mb-1 font-semibold flex items-center justify-between">
                <span>Price Target (Ceiling)</span>
                <span className="text-cyan-400 font-bold">${thresholds.targetPriceUSD.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="50000"
                max="100000"
                step="2500"
                value={thresholds.targetPriceUSD}
                onChange={(e) => setThresholds({ ...thresholds, targetPriceUSD: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500">
                High Risk threshold = &gt; ${Math.round(thresholds.targetPriceUSD * 1.15).toLocaleString()}
              </span>
            </div>

            {/* Max Lead Time */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10">
              <label className="block text-zinc-300 mb-1 font-semibold flex items-center justify-between">
                <span>Max Lead Time</span>
                <span className="text-cyan-400 font-bold">{thresholds.maxLeadTimeWeeks} Wks</span>
              </label>
              <input
                type="range"
                min="4"
                max="20"
                step="1"
                value={thresholds.maxLeadTimeWeeks}
                onChange={(e) => setThresholds({ ...thresholds, maxLeadTimeWeeks: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500">
                High Risk threshold = &gt; {thresholds.maxLeadTimeWeeks + 2} Wks
              </span>
            </div>

            {/* Min Warranty */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10">
              <label className="block text-zinc-300 mb-1 font-semibold flex items-center justify-between">
                <span>Min Warranty Coverage</span>
                <span className="text-cyan-400 font-bold">{thresholds.minWarrantyYears} Yrs</span>
              </label>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={thresholds.minWarrantyYears}
                onChange={(e) => setThresholds({ ...thresholds, minWarrantyYears: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500">
                High Risk threshold = &lt; {thresholds.minWarrantyYears - 1} Yrs
              </span>
            </div>

            {/* Failover Requirement */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex flex-col justify-between">
              <label className="block text-zinc-300 mb-1 font-semibold">
                Failover Certification
              </label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={thresholds.requirePreCertification}
                  onChange={(e) => setThresholds({ ...thresholds, requirePreCertification: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 bg-zinc-800 border-white/20 rounded focus:ring-cyan-500"
                />
                <span className="text-zinc-200 text-xs">
                  Strictly Require Pre-certified Redundancy
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Filter Severity Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Filter size={14} className="text-cyan-400" />
          <span>Filter Heatmap Display:</span>
          <div className="inline-flex rounded-lg bg-zinc-950/80 border border-white/10 p-1">
            <button
              onClick={() => setFilterSeverity("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                filterSeverity === "all" ? "bg-cyan-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              All Metrics
            </button>
            <button
              onClick={() => setFilterSeverity("high")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                filterSeverity === "high" ? "bg-cyan-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              High Risk / Outliers Only ({highRiskCount})
            </button>
            <button
              onClick={() => setFilterSeverity("medium_high")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                filterSeverity === "medium_high" ? "bg-cyan-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              Medium & High Risk
            </button>
          </div>
        </div>

        {/* Standard Legend via StatusBadge */}
        <div className="flex items-center gap-2">
          <StatusBadge status="low" label="Low Risk" size="sm" />
          <StatusBadge status="review" label="Needs Review" size="sm" />
          <StatusBadge status="high" label="High Risk" size="sm" />
        </div>
      </div>

      {/* Main Heatmap Matrix Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-2xl mb-6">
        <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-zinc-950/90 border-b border-white/10 text-zinc-400">
              <th className="py-3.5 px-4 font-bold uppercase tracking-wider w-1/4">
                Risk Metric Criteria
              </th>
              <th className="py-3.5 px-3 font-semibold text-zinc-400 uppercase tracking-wider w-1/6">
                Industry Target
              </th>
              {vendorKeys.map((vk) => {
                const comp = compositeVendorRisk[vk];
                return (
                  <th key={vk} className="py-3.5 px-4 font-bold text-white uppercase tracking-wider">
                    <div className="flex items-center justify-between gap-2">
                      <span>{VENDOR_NAMES[vk]}</span>
                      {comp && (
                        <StatusBadge status={comp.status} label={comp.label} size="sm" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-zinc-900/40">
            {criteriaList.map((crit) => {
              const CritIcon = crit.icon;
              return (
                <tr key={crit.key} className="hover:bg-white/5 transition-colors">
                  {/* Criteria Name */}
                  <td className="py-3.5 px-4 font-sans font-semibold text-zinc-200 flex items-center gap-2">
                    <CritIcon size={15} className="text-cyan-400 shrink-0" />
                    <span>{crit.label}</span>
                  </td>

                  {/* Benchmark Display */}
                  <td className="py-3.5 px-3 text-zinc-400 font-medium">
                    {vendorRisks[vendorKeys[0]]?.[crit.key]?.benchmarkDisplay || "—"}
                  </td>

                  {/* Vendor Cell Heatmap */}
                  {vendorKeys.map((vk) => {
                    const item = vendorRisks[vk]?.[crit.key];
                    if (!item) {
                      return <td key={vk} className="py-3.5 px-4 text-zinc-500">—</td>;
                    }

                    // Check if hidden by filter
                    const isHiddenByFilter =
                      (filterSeverity === "high" && item.riskLevel !== "high") ||
                      (filterSeverity === "medium_high" && item.riskLevel === "low");

                    let cellStyle = "bg-emerald-950/30 border-emerald-500/20 text-emerald-300";
                    let badgeStatus: "low" | "review" | "high" = "low";

                    if (item.riskLevel === "high") {
                      cellStyle = "bg-red-950/60 border-red-500/50 text-red-100 font-bold";
                      badgeStatus = "high";
                    } else if (item.riskLevel === "medium") {
                      cellStyle = "bg-amber-950/40 border-amber-500/30 text-amber-200";
                      badgeStatus = "review";
                    }

                    if (isHiddenByFilter) {
                      return (
                        <td key={vk} className="py-3.5 px-4 text-zinc-600 opacity-40 bg-zinc-950/20">
                          <span className="text-[11px] italic">{item.valueDisplay} (Filtered)</span>
                        </td>
                      );
                    }

                    return (
                      <td key={vk} className="py-3.5 px-4">
                        <div
                          onClick={() => {
                            if (item.riskLevel === "high" || item.riskLevel === "medium") {
                              setActiveOutlierDrawer({
                                vendorKey: vk,
                                vendorName: VENDOR_NAMES[vk] || vk,
                                metricKey: crit.key,
                                risk: item,
                              });
                            }
                          }}
                          className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] ${cellStyle}`}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="text-sm font-extrabold tracking-tight">
                              {item.valueDisplay}
                            </span>
                            <StatusBadge status={badgeStatus} label={item.riskLevel.toUpperCase()} size="sm" />
                          </div>

                          <div className="text-[10px] font-mono text-zinc-300 flex items-center justify-between border-t border-white/10 pt-1 mt-1">
                            <span>Variance:</span>
                            <span className="font-semibold">{item.varianceText}</span>
                          </div>

                          <p className="text-[10px] font-sans text-zinc-300/90 leading-tight mt-1.5">
                            {item.riskDescription}
                          </p>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Composite Risk Summary Row */}
            <tr className="bg-zinc-950/90 font-bold border-t-2 border-white/10">
              <td className="py-4 px-4 text-sm font-sans text-white flex items-center gap-2">
                <ShieldAlert size={16} className="text-cyan-400" />
                <span>Composite Risk Index</span>
              </td>
              <td className="py-4 px-3 text-xs text-zinc-400">Low &lt; 20%</td>
              {vendorKeys.map((vk) => {
                const comp = compositeVendorRisk[vk];
                return (
                  <td key={vk} className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-white">{comp?.score}%</span>
                      <StatusBadge status={comp?.status || "low"} label={comp?.label || "LOW"} size="sm" />
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Critical Outlier Alert Cards Section */}
      <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400 animate-pulse" />
            <h4 className="font-sans font-bold text-base text-white">
              Flagged Outliers & Key Operational Risks
            </h4>
          </div>
          <span className="font-mono text-xs px-3 py-1 rounded-full bg-red-950 border border-red-500/40 text-red-300 font-semibold">
            {allOutliers.length} Critical Points Highlighted (Click for Drawer)
          </span>
        </div>

        {allOutliers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allOutliers.map((outlier, idx) => (
              <div
                key={idx}
                onClick={() => setActiveOutlierDrawer(outlier)}
                className="p-3.5 rounded-xl border bg-red-950/30 border-red-500/30 text-zinc-200 shadow-md hover:border-red-500/80 hover:bg-red-950/50 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-red-300">
                      {outlier.vendorName}
                    </span>
                    <StatusBadge status="high" label={outlier.risk.riskLevel} size="sm" />
                  </div>
                  <h5 className="font-sans text-xs font-bold text-white mb-1 flex items-center justify-between">
                    <span>{outlier.risk.metricName}: {outlier.risk.valueDisplay}</span>
                    <ArrowRight size={13} className="text-zinc-500 group-hover:text-white transition-colors" />
                  </h5>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                    {outlier.risk.riskDescription}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>Target: {outlier.risk.benchmarkDisplay}</span>
                  <span className="text-red-400 font-semibold">{outlier.risk.varianceText}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs font-mono text-zinc-400 bg-zinc-900/40 rounded-xl border border-white/5">
            <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-400" />
            <span>No metrics exceed the active industry risk thresholds for the selected filter.</span>
          </div>
        )}
      </div>

      {/* Requirement #9: Outlier Details Drawer Modal */}
      {activeOutlierDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-end animate-fadeIn">
          <div className="w-full max-w-md h-full bg-zinc-950 border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <AlertOctagon size={20} className="text-red-400" />
                  <h3 className="font-sans font-bold text-lg text-white">
                    Risk Outlier Deep-Dive
                  </h3>
                </div>
                <button
                  onClick={() => setActiveOutlierDrawer(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Vendor & Metric Metadata */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 uppercase">Vendor Name</span>
                  <span className="text-sm font-mono font-bold text-white">{activeOutlierDrawer.vendorName}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase">Evaluated Metric</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">{activeOutlierDrawer.risk.metricName}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase">Current Value</span>
                  <span className="text-sm font-mono font-extrabold text-red-400">{activeOutlierDrawer.risk.valueDisplay}</span>
                </div>
              </div>

              {/* Benchmark Variance Comparison */}
              <div className="space-y-3 mb-6 font-mono text-xs">
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200">
                  <span className="text-[10px] text-red-400 font-bold uppercase block mb-1">
                    Industry Benchmark Target
                  </span>
                  <p className="text-sm font-bold">{activeOutlierDrawer.risk.benchmarkDisplay}</p>
                  <p className="text-xs text-red-300 mt-1">Variance: {activeOutlierDrawer.risk.varianceText}</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-white/10">
                  <span className="text-[10px] text-zinc-400 uppercase block mb-1">Operational Impact Analysis</span>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    {activeOutlierDrawer.risk.riskDescription}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1">
                    Recommended Procurement Counter-Strategy
                  </span>
                  <ul className="space-y-1.5 text-xs font-sans list-disc pl-4 text-zinc-200">
                    <li>Request a binding price-concession or extended SLA guarantee before shortlisting.</li>
                    <li>Require vendor to submit factory proof of KSA/HCIS certification or SASO homologation.</li>
                    <li>Incorporate penalty clauses for schedule delays exceeding target buffer.</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveOutlierDrawer(null)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold cursor-pointer transition-all shadow-lg shadow-cyan-600/30"
            >
              Close Details Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

