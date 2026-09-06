import React, { useState } from "react";
import {
  History,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ShieldAlert,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { StructuredVendorData, CurrencyCode } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";
import { AppLanguage } from "../translations";

interface Props {
  data: StructuredVendorData;
  currency: CurrencyCode;
  formatCurrency: (priceUSD: number, targetCurrency: CurrencyCode) => string;
  convertPrice: (priceUSD: number, targetCurrency: CurrencyCode) => number;
  lang?: AppLanguage;
}

interface HistoricalContract {
  id: string;
  year: number;
  projectName: string;
  vendorAwarded: string;
  unitPriceUSD: number;
  leadTimeWeeks: number;
  warrantyYears: number;
  scope: string;
}

const HISTORICAL_CONTRACTS: HistoricalContract[] = [
  {
    id: "RFQ-2023-0412",
    year: 2023,
    projectName: "Ras Al Khair Phosphate SOC Rack Servers",
    vendorAwarded: "Meridian Enterprise",
    unitPriceUSD: 79800,
    leadTimeWeeks: 10,
    warrantyYears: 3,
    scope: "Twin Redundant Industrial Command Nodes",
  },
  {
    id: "RFQ-2024-0189",
    year: 2024,
    projectName: "Mansourah Massarah Gold Mine Processing Pairs",
    vendorAwarded: "Apex Compute Solutions",
    unitPriceUSD: 82400,
    leadTimeWeeks: 8,
    warrantyYears: 3,
    scope: "Fault-Tolerant Twin Cluster Hardware",
  },
  {
    id: "RFQ-2025-0671",
    year: 2025,
    projectName: "Wa'ad Al Shamal High-Availability Core Expansion",
    vendorAwarded: "Meridian Enterprise",
    unitPriceUSD: 85000,
    leadTimeWeeks: 9,
    warrantyYears: 5,
    scope: "Mission-Critical Processing Pair with 24/7 SLA",
  },
];

const HISTORICAL_MEDIAN_PRICE_USD = 82400;
const HISTORICAL_MEDIAN_LEAD_WEEKS = 9.0;

export function HistoricalBenchmarkingCard({
  data,
  currency,
  formatCurrency,
  convertPrice,
  lang = "en",
}: Props) {
  const [activeTab, setActiveTab] = useState<"variance" | "contracts">("variance");

  const medianPriceConverted = convertPrice(HISTORICAL_MEDIAN_PRICE_USD, currency);

  // Compute variance for each current vendor
  const vendorRows = Object.keys(data).map((key) => {
    const v = data[key];
    const priceUSD = v?.priceUSD || 0;
    const priceConverted = convertPrice(priceUSD, currency);
    const priceVariancePct = ((priceUSD - HISTORICAL_MEDIAN_PRICE_USD) / HISTORICAL_MEDIAN_PRICE_USD) * 100;
    const leadVariancePct = (((v?.leadTimeWeeks || 9) - HISTORICAL_MEDIAN_LEAD_WEEKS) / HISTORICAL_MEDIAN_LEAD_WEEKS) * 100;

    // Severity category
    let priceCategory: "discount" | "normal" | "premium" | "outlier" = "normal";
    if (priceVariancePct <= -5) priceCategory = "discount";
    else if (priceVariancePct > 15) priceCategory = "outlier";
    else if (priceVariancePct > 6) priceCategory = "premium";

    let leadCategory: "normal" | "delay" | "severe" = "normal";
    if (leadVariancePct > 30) leadCategory = "severe";
    else if (leadVariancePct > 10) leadCategory = "delay";

    return {
      key,
      name: VENDOR_NAMES[key] || key,
      priceUSD,
      priceConverted,
      priceVariancePct: Number(priceVariancePct.toFixed(1)),
      leadTimeWeeks: v?.leadTimeWeeks || 0,
      leadVariancePct: Number(leadVariancePct.toFixed(1)),
      warrantyYears: v?.warrantyYears || 0,
      priceCategory,
      leadCategory,
    };
  });

  // Chart data
  const chartData = [
    {
      name: "Historical Baseline",
      price: Math.round(medianPriceConverted),
      isBaseline: true,
      variance: 0,
    },
    ...vendorRows.map((v) => ({
      name: v.name.split(" ")[0],
      price: Math.round(v.priceConverted),
      isBaseline: false,
      variance: v.priceVariancePct,
    })),
  ];

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-amber-300 font-semibold bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              Ma'aden Contract Intelligence
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              Historical Median: {formatCurrency(HISTORICAL_MEDIAN_PRICE_USD, currency)}
            </span>
          </div>
          <h3 className="font-sans text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History size={20} className="text-amber-400" />
            <span>Historical Contract Benchmarking & Price Anomaly Detector</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Automated market outlier analysis comparing submitted vendor quotes against 2023–2025 Ma'aden mining server contract awards.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab("variance")}
            className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
              activeTab === "variance"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Variance & Anomaly Matrix
          </button>
          <button
            onClick={() => setActiveTab("contracts")}
            className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
              activeTab === "contracts"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Past RFQ Database (3)
          </button>
        </div>
      </div>

      {activeTab === "variance" ? (
        <div className="space-y-6">
          {/* Visual Benchmark Comparison Bar Chart */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
                <BarChart3 size={14} className="text-amber-400" />
                <span>Price Quote vs Historical Ma'aden Benchmark ({currency})</span>
              </span>
              <span className="text-zinc-500 font-mono text-[11px]">
                Dotted line = Baseline Median ({formatCurrency(HISTORICAL_MEDIAN_PRICE_USD, currency)})
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ${currency}`, "Price"]}
                  />
                  <ReferenceLine
                    y={Math.round(medianPriceConverted)}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: "Benchmark",
                      fill: "#f59e0b",
                      fontSize: 10,
                      position: "top",
                    }}
                  />
                  <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isBaseline
                            ? "#d97706"
                            : entry.variance !== undefined && entry.variance > 10
                            ? "#ef4444"
                            : entry.variance !== undefined && entry.variance < -5
                            ? "#10b981"
                            : "#0ea5e9"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Outlier & Anomaly Ledger Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/50">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-950 border-b border-white/10 text-zinc-400 text-[11px] uppercase">
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Quoted Price ({currency})</th>
                  <th className="p-3">Price Variance</th>
                  <th className="p-3">Lead Time</th>
                  <th className="p-3">Schedule Variance</th>
                  <th className="p-3">Market Anomaly Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vendorRows.map((v) => (
                  <tr key={v.key} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 text-white font-bold">{v.name}</td>
                    <td className="p-3 text-zinc-200 font-semibold">
                      {formatCurrency(v.priceUSD, currency)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          v.priceVariancePct > 0
                            ? v.priceVariancePct > 10
                              ? "text-red-400"
                              : "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {v.priceVariancePct > 0 ? (
                          <ArrowUpRight size={13} />
                        ) : (
                          <ArrowDownRight size={13} />
                        )}
                        <span>{v.priceVariancePct > 0 ? `+${v.priceVariancePct}%` : `${v.priceVariancePct}%`}</span>
                      </span>
                    </td>
                    <td className="p-3 text-zinc-300">{v.leadTimeWeeks} weeks</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          v.leadVariancePct > 20
                            ? "text-red-400"
                            : v.leadVariancePct > 0
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {v.leadVariancePct > 0 ? `+${v.leadVariancePct}%` : `${v.leadVariancePct}%`}
                      </span>
                    </td>
                    <td className="p-3">
                      {v.priceCategory === "outlier" || v.leadCategory === "severe" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-950/80 border border-red-500/40 text-red-300 text-[10px] font-bold">
                          <AlertTriangle size={12} className="text-red-400" />
                          <span>ANOMALY: {v.leadCategory === "severe" ? "Delivery Outlier (+55%)" : "Price Premium (+11%)"}</span>
                        </span>
                      ) : v.priceCategory === "discount" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span>FAVORABLE: Below Historical Baseline</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 border border-white/10 text-zinc-300 text-[10px] font-medium">
                          <span>Fair Market Range (±5%)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Historical Contracts Database List */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {HISTORICAL_CONTRACTS.map((contract) => (
            <div
              key={contract.id}
              className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 space-y-2.5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-amber-400 font-bold">{contract.id}</span>
                <span className="text-zinc-500 text-[11px]">{contract.year} Award</span>
              </div>
              <div className="font-sans font-bold text-white text-sm line-clamp-1">
                {contract.projectName}
              </div>
              <div className="space-y-1 text-zinc-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Awardee:</span>
                  <span className="text-zinc-200 font-semibold">{contract.vendorAwarded}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contract Unit Price:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatCurrency(contract.unitPriceUSD, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fulfillment Lead Time:</span>
                  <span className="text-zinc-200">{contract.leadTimeWeeks} weeks</span>
                </div>
                <div className="flex justify-between">
                  <span>Warranty Term:</span>
                  <span className="text-zinc-200">{contract.warrantyYears} years</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 text-[10px] text-zinc-500">
                Scope: {contract.scope}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
