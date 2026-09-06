import React from "react";
import {
  Sliders,
  BarChart3,
  Info,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Lock,
  Unlock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { DecisionWeights, VendorScores, VendorBinaryGateMap } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface Props {
  weights: DecisionWeights;
  setWeights: React.Dispatch<React.SetStateAction<DecisionWeights>>;
  scores: VendorScores;
  binaryGates: VendorBinaryGateMap;
  onToggleBinaryGate: (vendorKey: string, gateKey: "failoverVerified" | "complianceCertified") => void;
  lang?: AppLanguage;
}

export function ScoreChartAndWeights({
  weights,
  setWeights,
  scores,
  binaryGates,
  onToggleBinaryGate,
  lang = "en",
}: Props) {
  const isAr = lang === "ar";
  const t = TRANSLATIONS[lang];
  const totalWeight = weights.price + weights.leadTime + weights.warranty || 1;

  const chartData = Object.keys(VENDOR_NAMES).map((key) => {
    const isDisqualified = scores[key]?.isDisqualified ?? false;
    return {
      key,
      name: VENDOR_NAMES[key],
      displayName: isDisqualified ? `${VENDOR_NAMES[key]} [GATED]` : VENDOR_NAMES[key],
      score: scores[key]?.weighted || 0,
      priceScore: scores[key]?.priceScore || 0,
      leadScore: scores[key]?.leadScore || 0,
      warrantyScore: scores[key]?.warrantyScore || 0,
      isDisqualified,
    };
  });

  // Find top score among QUALIFIED vendors only
  const qualifiedData = chartData.filter((d) => !d.isDisqualified);
  const highestQualifiedScore =
    qualifiedData.length > 0 ? Math.max(...qualifiedData.map((d) => d.score)) : -1;

  const handleWeightChange = (key: keyof DecisionWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6 mb-8">
      {/* MANDATORY BINARY GATEKEEPER PANEL (Strict YES / NO) */}
      <div className="glass-card p-6 rounded-2xl border-2 border-red-500/30 bg-zinc-950/90 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-red-400 font-bold bg-red-950/80 border border-red-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <AlertOctagon size={12} />
                {isAr ? "بوابة القبول الإلزامية الثنائية: تجاوز الأعطال والامتثال (نعم / لا)" : "Mandatory Binary Gatekeeper: Failover & Compliance (Strict YES / NO)"}
              </span>
              <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
            </div>
            <h3 className="font-sans text-xl font-bold text-white tracking-tight">
              {isAr ? "بوابات التحقق والتأهيل المسبق (قبول / استبعاد صارم)" : "Pre-Qualification Verification Gates (Zero-Tolerance Go / No-Go)"}
            </h3>
            <p className="text-xs text-zinc-300 mt-1 max-w-3xl">
              {isAr
                ? "الامتثال وتجاوز الأعطال هما بوابتان إلزاميتان (بدون تدرج). إذا كانت النتيجة لا لأي منهما، يتم استبعاد المورد تلقائياً بغض النظر عن السعر."
                : "Compliance and failover are strict binary gates (No sliding scale). If either check is NO, the vendor is automatically disqualified from purchase order award regardless of price."}
            </p>
          </div>
        </div>

        {/* Binary Gate Cards per Vendor */}
        <div className="grid md:grid-cols-3 gap-4">
          {Object.keys(VENDOR_NAMES).map((key) => {
            const gates = binaryGates[key] || { failoverVerified: false, complianceCertified: true };
            const isDisqualified = !gates.failoverVerified || !gates.complianceCertified;

            return (
              <div
                key={key}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isDisqualified
                    ? "bg-red-950/20 border-red-500/40 shadow-inner"
                    : "bg-emerald-950/20 border-emerald-500/40 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-sans font-bold text-sm text-white">{VENDOR_NAMES[key]}</span>
                  {isDisqualified ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/50 flex items-center gap-1">
                      <XCircle size={11} /> Gated Out
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Qualified
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {/* Failover Verification Binary Toggle */}
                  <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-zinc-300 block font-semibold">
                        Failover Verification
                      </span>
                      <span className="text-[10px] text-zinc-400">Continuous Availability</span>
                    </div>
                    <button
                      onClick={() => onToggleBinaryGate(key, "failoverVerified")}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                        gates.failoverVerified
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                          : "bg-red-600 hover:bg-red-500 text-white shadow-sm"
                      }`}
                    >
                      {gates.failoverVerified ? "YES" : "NO"}
                    </button>
                  </div>

                  {/* Compliance Verification Binary Toggle */}
                  <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-zinc-300 block font-semibold">
                        Regulatory Compliance
                      </span>
                      <span className="text-[10px] text-zinc-400">ISO / IEC & Standards</span>
                    </div>
                    <button
                      onClick={() => onToggleBinaryGate(key, "complianceCertified")}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                        gates.complianceCertified
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                          : "bg-red-600 hover:bg-red-500 text-white shadow-sm"
                      }`}
                    >
                      {gates.complianceCertified ? "YES" : "NO"}
                    </button>
                  </div>
                </div>

                {isDisqualified && (
                  <p className="text-[10px] font-mono text-red-300 mt-2.5 leading-tight">
                    * Blocked: Vendor fails critical gate requirement.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart & Evaluative Trade-off Weights Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Chart Panel */}
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  Evaluative Score Ranking
                </span>
              </div>
              <BarChart3 size={16} className="text-zinc-400" />
            </div>
            <h3 className="font-sans text-lg font-bold text-white mb-1 tracking-tight">
              Weighted Decision Matrix (Qualified Bids Only)
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Evaluates Price, Schedule, and Warranty trade-offs for all candidates passing mandatory gates.
            </p>

            <div className="w-full h-56 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                  <YAxis type="category" dataKey="displayName" width={135} tick={{ fontSize: 11, fill: "#ffffff", fontWeight: 600 }} />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      item.payload.isDisqualified
                        ? "0 / 100 (Disqualified at Gate)"
                        : `${value} / 100`,
                      "Score",
                    ]}
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#ffffff",
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={24}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={
                          entry.isDisqualified
                            ? "#ef4444"
                            : entry.score === highestQualifiedScore
                            ? "#0891b2"
                            : "#52525b"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block"></span>
              <span>Leading Qualified Option</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              <span>Gated Out (Failover/Compliance NO)</span>
            </div>
          </div>
        </div>

        {/* Evaluative Weights Sliders */}
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-cyan-400" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  Trade-Off Weights
                </span>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-white font-bold">
                Sum: {totalWeight}%
              </span>
            </div>
            <h3 className="font-sans text-lg font-bold text-white mb-1 tracking-tight">
              Commercial & Operational Weights
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Adjust how non-gate trade-offs are scored across qualifying vendors.
            </p>

            <div className="space-y-4">
              {/* Price Slider */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="font-semibold text-zinc-200">Price (Upfront CAPEX)</span>
                  <span className="font-bold text-cyan-400">{weights.price}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.price}
                  onChange={(e) => handleWeightChange("price", Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Lead Time Slider */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="font-semibold text-zinc-200">Lead Time (Delivery Speed)</span>
                  <span className="font-bold text-cyan-400">{weights.leadTime}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.leadTime}
                  onChange={(e) => handleWeightChange("leadTime", Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Warranty Slider */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="font-semibold text-zinc-200">Warranty Coverage (TCO Protection)</span>
                  <span className="font-bold text-cyan-400">{weights.warranty}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.warranty}
                  onChange={(e) => handleWeightChange("warranty", Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-zinc-400 flex items-start gap-1.5 leading-snug">
            <Info size={14} className="shrink-0 mt-0.5 text-cyan-400" />
            <span>
              Weights automatically normalize across Price, Lead Time, and Warranty. Compliance is guarded strictly by the Binary Gatekeeper above.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
