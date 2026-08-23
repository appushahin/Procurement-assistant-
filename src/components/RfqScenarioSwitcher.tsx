import React from "react";
import { Layers, CheckCircle2, ChevronRight, Sparkles, Server, ShieldCheck, Factory } from "lucide-react";
import { RFQ_SCENARIOS, VENDOR_NAMES } from "../data";
import { DecisionWeights, VendorBinaryGateMap, VendorRawQuotes, StructuredVendorData } from "../types";

interface Props {
  activeScenarioId: string;
  onSelectScenario: (scenario: (typeof RFQ_SCENARIOS)[0]) => void;
}

const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  "security-command-center": <Server size={18} className="text-cyan-400" />,
  "enterprise-cloud-dr": <ShieldCheck size={18} className="text-emerald-400" />,
  "mining-machinery-fleet": <Factory size={18} className="text-amber-400" />,
};

export function RfqScenarioSwitcher({ activeScenarioId, onSelectScenario }: Props) {
  return (
    <div className="bg-zinc-950/80 p-4 rounded-2xl border border-white/10 mb-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-cyan-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-300 font-bold">
            Pre-Seeded Procurement RFQ Scenarios
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Switch test packages to stress-test binary gates & scoring algorithms
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {RFQ_SCENARIOS.map((scen) => {
          const isSelected = activeScenarioId === scen.id;
          const icon = SCENARIO_ICONS[scen.id] || <Server size={18} className="text-cyan-400" />;

          return (
            <button
              key={scen.id}
              onClick={() => onSelectScenario(scen)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-950/50"
                  : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:border-white/15"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-800 border border-white/10">
                      {icon}
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase font-semibold">
                      {scen.category}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  )}
                </div>
                <h4 className="font-sans font-bold text-sm text-white mb-1">{scen.name}</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {scen.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>3 Competing Vendors</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-0.5">
                  Load Specs <ChevronRight size={11} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
