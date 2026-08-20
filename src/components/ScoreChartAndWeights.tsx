import React from "react";
import { Sliders, BarChart3, Info } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { DecisionWeights, VendorScores } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";

interface Props {
  weights: DecisionWeights;
  setWeights: React.Dispatch<React.SetStateAction<DecisionWeights>>;
  scores: VendorScores;
}

export function ScoreChartAndWeights({ weights, setWeights, scores }: Props) {
  const totalWeight = weights.price + weights.leadTime + weights.warranty + weights.compliance || 1;

  const chartData = Object.keys(VENDOR_NAMES).map((key) => ({
    key,
    name: VENDOR_NAMES[key],
    score: scores[key]?.weighted || 0,
    priceScore: scores[key]?.priceScore || 0,
    leadScore: scores[key]?.leadScore || 0,
    warrantyScore: scores[key]?.warrantyScore || 0,
    complianceScore: scores[key]?.complianceScore || 0,
  }));

  // Identify highest score
  const highestScore = Math.max(...chartData.map((d) => d.score));

  const handleWeightChange = (key: keyof DecisionWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 mb-8">
      {/* Chart Panel */}
      <div className="lg:col-span-7 glass-card p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                Step 4: Comparative Visual Analysis
              </span>
              <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
            </div>
            <BarChart3 size={16} className="text-zinc-400" />
          </div>
          <h3 className="font-sans text-lg font-bold text-white mb-1 tracking-tight">
            Overall Weighted Score Breakdown
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Scores dynamically reflect changes to your decision weight sliders.
          </p>

          <div className="w-full h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "#ffffff", fontWeight: 600 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} / 100`, "Weighted Score"]}
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "rgba(255, 255, 255, 0.15)", borderRadius: "12px", fontSize: "12px", color: "#ffffff" }}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={24}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.score === highestScore ? "#0891b2" : "#3f3f46"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block shadow-sm shadow-cyan-600/50"></span>
            <span>Leading Option</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-zinc-700 inline-block"></span>
            <span>Secondary Option</span>
          </div>
        </div>
      </div>

      {/* Weights Control Panel */}
      <div className="lg:col-span-5 glass-card p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-cyan-400" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                Step 4: Decision Weighting
              </span>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-white font-bold">
              Sum: {totalWeight}%
            </span>
          </div>
          <h3 className="font-sans text-lg font-bold text-white mb-1 tracking-tight">
            Adjust Evaluation Priorities
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Drag sliders to reflect organizational priorities. Scores update in real-time.
          </p>

          <div className="space-y-4">
            {/* Price Slider */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="font-semibold text-zinc-200">Price (Upfront Cost)</span>
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
                <span className="font-semibold text-zinc-200">Warranty Coverage</span>
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

            {/* Compliance / Redundancy Slider */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="font-semibold text-zinc-200">Compliance & Failover Certification</span>
                <span className="font-bold text-cyan-400">{weights.compliance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.compliance}
                onChange={(e) => handleWeightChange("compliance", Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-zinc-400 flex items-start gap-1.5 leading-snug">
          <Info size={14} className="shrink-0 mt-0.5 text-cyan-400" />
          <span>
            Weights are automatically normalized across criteria to maintain a standardized 100-point scale.
          </span>
        </div>
      </div>
    </div>
  );
}

