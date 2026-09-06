import React, { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { StructuredVendorData, VendorBinaryGateMap, VendorScores } from "../types";
import { VENDOR_NAMES } from "../data";
import { calculateVendorTco } from "../utils";
import { LanternLogo } from "./LanternLogo";
import { Sparkles, ShieldCheck } from "lucide-react";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface Props {
  data: StructuredVendorData;
  scores: VendorScores;
  binaryGates: VendorBinaryGateMap;
  lang?: AppLanguage;
}

const VENDOR_COLORS: Record<string, { stroke: string; fill: string }> = {
  meridian: { stroke: "#06b6d4", fill: "#06b6d4" }, // Cyan
  ironclad: { stroke: "#f59e0b", fill: "#f59e0b" }, // Amber
  vantage: { stroke: "#10b981", fill: "#10b981" }, // Emerald
};

export function RadarComparisonChart({ data, scores, binaryGates, lang = "en" }: Props) {
  const isAr = lang === "ar";
  const t = TRANSLATIONS[lang];
  const vendorKeys = Object.keys(VENDOR_NAMES);
  const tcoMetrics = useMemo(() => calculateVendorTco(data, binaryGates, VENDOR_NAMES), [data, binaryGates]);

  const radarData = useMemo(() => {
    // 6 Dimensions to evaluate
    const dimensions = [
      { key: "priceScore", label: isAr ? "تنافسية السعر" : "Price Competitiveness" },
      { key: "leadScore", label: isAr ? "سرعة التوريد" : "Lead Time Speed" },
      { key: "warrantyScore", label: isAr ? "تغطية الضمان" : "Warranty Coverage" },
      { key: "failoverGate", label: isAr ? "بوابة تجاوز الأعطال" : "Failover Verification" },
      { key: "slaScore", label: isAr ? "مستوى الدعم الفني" : "Support SLA Depth" },
      { key: "tcoScore", label: isAr ? "كفاءة التكلفة الإجمالية (5 سنوات)" : "5-Year TCO Efficiency" },
    ];

    // Compute SLA scores
    const getSlaScore = (sla: string) => {
      const lower = (sla || "").toLowerCase();
      if (lower.includes("24/7") && lower.includes("4-hour")) return 100;
      if (lower.includes("8-hour")) return 75;
      if (lower.includes("email")) return 40;
      return 60;
    };

    // Find min & max TCO for normalization
    const tcos = vendorKeys.map((k) => tcoMetrics[k]?.total5Year || 100000);
    const minTco = Math.min(...tcos);
    const maxTco = Math.max(...tcos);

    return dimensions.map((dim) => {
      const item: Record<string, any> = { dimension: dim.label };

      vendorKeys.forEach((vKey) => {
        const v = data[vKey];
        const vScore = scores[vKey];
        const vTco = tcoMetrics[vKey]?.total5Year || 0;

        if (dim.key === "priceScore") {
          item[vKey] = vScore?.priceScore || 0;
        } else if (dim.key === "leadScore") {
          item[vKey] = vScore?.leadScore || 0;
        } else if (dim.key === "warrantyScore") {
          item[vKey] = vScore?.warrantyScore || 0;
        } else if (dim.key === "failoverGate") {
          item[vKey] = binaryGates[vKey]?.failoverVerified ? 100 : 20;
        } else if (dim.key === "slaScore") {
          item[vKey] = getSlaScore(v?.supportSLA || "");
        } else if (dim.key === "tcoScore") {
          item[vKey] =
            maxTco === minTco ? 100 : Math.round((100 * (maxTco - vTco)) / (maxTco - minTco));
        }
      });

      return item;
    });
  }, [data, scores, binaryGates, vendorKeys, tcoMetrics]);

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              6-Axis Comparative Radar
            </span>
            <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
          </div>
          <h3 className="font-sans text-xl font-bold text-white tracking-tight">
            Multi-Dimensional Vendor Radar Spectrum
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Holistic polygon mapping across commercial, operational, failover reliability, and lifecycle TCO metrics.
          </p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="w-full h-80 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="75%">
            <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: "#e4e4e7", fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 10 }}
              stroke="rgba(255, 255, 255, 0.1)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#ffffff",
                direction: isAr ? "rtl" : "ltr",
                textAlign: isAr ? "right" : "left",
              }}
              formatter={(val: any, name: any) => [
                `${val}/100`,
                VENDOR_NAMES[String(name)] || String(name),
              ]}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs font-semibold text-zinc-200">
                  {VENDOR_NAMES[value] || value}
                </span>
              )}
            />
            {vendorKeys.map((key) => {
              const cfg = VENDOR_COLORS[key] || { stroke: "#38bdf8", fill: "#38bdf8" };
              return (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={cfg.stroke}
                  fill={cfg.fill}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              );
            })}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-zinc-400">
        {vendorKeys.map((key) => {
          const cfg = VENDOR_COLORS[key];
          const isGated = binaryGates[key]?.failoverVerified === false || binaryGates[key]?.complianceCertified === false;

          return (
            <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/60 border border-white/5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.stroke }}></span>
              <span className="font-semibold text-white">{VENDOR_NAMES[key]}</span>
              {isGated ? (
                <span className="text-[10px] text-red-400 font-bold ml-auto">Gated (Failover NO)</span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-bold ml-auto">Qualified</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
