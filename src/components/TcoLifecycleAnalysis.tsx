import React, { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingDown,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Calculator,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from "recharts";
import { StructuredVendorData, VendorBinaryGateMap, CurrencyCode } from "../types";
import { VENDOR_NAMES } from "../data";
import { calculateVendorTco } from "../utils";
import { LanternLogo } from "./LanternLogo";

interface Props {
  data: StructuredVendorData;
  binaryGates: VendorBinaryGateMap;
  currency: CurrencyCode;
  convertPrice: (priceUSD: number, targetCurrency: CurrencyCode) => number;
  formatCurrency: (priceUSD: number, targetCurrency: CurrencyCode) => string;
}

export function TcoLifecycleAnalysis({
  data,
  binaryGates,
  currency,
  convertPrice,
  formatCurrency,
}: Props) {
  const [timeHorizon, setTimeHorizon] = useState<"3yr" | "5yr">("5yr");
  const [showDowntimeRisk, setShowDowntimeRisk] = useState<boolean>(true);

  const tcoMetrics = useMemo(() => {
    return calculateVendorTco(data, binaryGates, VENDOR_NAMES);
  }, [data, binaryGates]);

  const vendorKeys = Object.keys(VENDOR_NAMES);

  // Prepare chart dataset
  const chartData = vendorKeys.map((key) => {
    const tco = tcoMetrics[key];
    const isFiveYear = timeHorizon === "5yr";
    const capex = convertPrice(tco?.initialCapex || 0, currency);
    const integration = convertPrice(tco?.integrationWorkaroundCost || 0, currency);
    const opex = convertPrice((tco?.annualSlaOpex || 0) * (isFiveYear ? 5 : 3), currency);
    const risk = showDowntimeRisk
      ? convertPrice((tco?.contingencyRiskCost || 0) * (isFiveYear ? 1 : 0.5), currency)
      : 0;

    const total = isFiveYear ? tco?.total5Year || 0 : tco?.total3Year || 0;
    const totalConverted = convertPrice(total, currency);

    return {
      key,
      name: VENDOR_NAMES[key] || key,
      "Upfront CAPEX": Math.round(capex),
      "Integration & Setup": Math.round(integration),
      "Multi-Year OPEX (SLA)": Math.round(opex),
      "Downtime Risk Buffer": Math.round(risk),
      total: Math.round(totalConverted),
      isDisqualified: !binaryGates[key]?.failoverVerified || !binaryGates[key]?.complianceCertified,
    };
  });

  // Find lowest TCO vendor
  const validVendors = chartData.filter((v) => !v.isDisqualified);
  const lowestTcoVendor =
    validVendors.length > 0
      ? validVendors.reduce((prev, curr) => (prev.total < curr.total ? prev : curr))
      : chartData[0];

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              TCO & Multi-Year OPEX Lifecycle Model
            </span>
            <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
          </div>
          <h3 className="font-sans text-xl font-bold text-white tracking-tight">
            Total Cost of Ownership Analysis ({timeHorizon === "5yr" ? "5-Year Horizon" : "3-Year Horizon"})
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Calculates upfront CAPEX, vendor workaround engineering, annual 24/7 SLA maintenance, and failover risk contingency.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Horizon Selector */}
          <div className="bg-zinc-950/80 p-1 rounded-xl border border-white/10 flex items-center">
            <button
              onClick={() => setTimeHorizon("3yr")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                timeHorizon === "3yr"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              3-Year TCO
            </button>
            <button
              onClick={() => setTimeHorizon("5yr")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                timeHorizon === "5yr"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              5-Year TCO
            </button>
          </div>

          {/* Risk Toggle */}
          <button
            onClick={() => setShowDowntimeRisk(!showDowntimeRisk)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              showDowntimeRisk
                ? "bg-amber-950/60 border-amber-500/50 text-amber-300"
                : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
            }`}
            title="Toggle estimated downtime risk contingency for uncertified failover software"
          >
            <AlertTriangle size={13} />
            <span>Risk Contingency: {showDowntimeRisk ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Stacked Cost Chart */}
        <div className="lg:col-span-7 bg-zinc-950/70 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-300 font-semibold uppercase tracking-wider">
                Cost Breakdown by Category ({currency})
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Lowest TCO: <strong className="text-emerald-400">{lowestTcoVendor?.name}</strong>
              </span>
            </div>

            <div className="w-full h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#ffffff", fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} ${currency}`, name]}
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#ffffff",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="Upfront CAPEX" stackId="a" fill="#0284c7" />
                  <Bar dataKey="Integration & Setup" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Multi-Year OPEX (SLA)" stackId="a" fill="#10b981" />
                  {showDowntimeRisk && <Bar dataKey="Downtime Risk Buffer" stackId="a" fill="#ef4444" />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Info size={12} className="text-cyan-400" />
              Notice: Vendors with shorter warranties incur out-of-warranty replacement reserves in Years 4–5.
            </span>
          </div>
        </div>

        {/* Vendor TCO Scorecards */}
        <div className="lg:col-span-5 space-y-3">
          {vendorKeys.map((key) => {
            const v = data[key];
            const tco = tcoMetrics[key];
            const isFiveYear = timeHorizon === "5yr";
            const total = isFiveYear ? tco?.total5Year || 0 : tco?.total3Year || 0;
            const isLowest = lowestTcoVendor?.key === key;
            const isDisqualified = !binaryGates[key]?.failoverVerified || !binaryGates[key]?.complianceCertified;

            return (
              <div
                key={key}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isLowest && !isDisqualified
                    ? "bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/50"
                    : isDisqualified
                    ? "bg-zinc-950/60 border-red-500/30 opacity-85"
                    : "bg-zinc-950/60 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-sm text-white">{VENDOR_NAMES[key]}</span>
                    {isLowest && !isDisqualified && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                        Lowest TCO
                      </span>
                    )}
                    {isDisqualified && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold">
                        Gate Disqualified
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-base font-bold text-cyan-300">
                    {formatCurrency(total, currency)}
                  </span>
                </div>

                {/* Sub-breakdown rows */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                  <div>
                    <span className="text-zinc-500 block">Upfront CAPEX</span>
                    <span className="text-zinc-200 font-semibold">{formatCurrency(v?.priceUSD || 0, currency)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Annual OPEX</span>
                    <span className="text-emerald-400 font-semibold">
                      {formatCurrency(tco?.annualSlaOpex || 0, currency)}/yr
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Failover Risk</span>
                    <span className={binaryGates[key]?.failoverVerified ? "text-zinc-300" : "text-red-400 font-semibold"}>
                      {binaryGates[key]?.failoverVerified ? "None (Certified)" : "+$18.5k Risk"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
