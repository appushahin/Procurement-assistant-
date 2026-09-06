import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  X,
  Sparkles,
  ChevronRight,
  Radio,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  Bot,
} from "lucide-react";
import { MarketMaterialAlert } from "../services/marketAlertEngine";
import { LantraAvatar } from "./LantraAvatar";
import { AppLanguage } from "../translations";
import { BackgroundTheme } from "../types";

interface Props {
  key?: React.Key;
  alert: MarketMaterialAlert | null;
  onDismiss: (id: string) => void;
  onOpenLantraWithPrompt: (prompt: string) => void;
  onAdjustWeightsForHedge?: () => void;
  onCycleNextAlert?: () => void;
  lang?: AppLanguage;
  bgTheme?: BackgroundTheme;
}

export function ProactiveMarketAlertBanner({
  alert,
  onDismiss,
  onOpenLantraWithPrompt,
  onAdjustWeightsForHedge,
  onCycleNextAlert,
  lang = "en",
  bgTheme = "white-glow",
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [weightsAdjusted, setWeightsAdjusted] = useState(false);

  if (!alert) return null;

  const isAr = lang === "ar";
  const headline = isAr ? alert.headlineAr : alert.headline;
  const summary = isAr ? alert.summaryAr : alert.summary;
  const materialName = isAr ? alert.materialNameAr : alert.materialName;
  const category = isAr ? alert.categoryAr : alert.category;
  const prompt = isAr ? alert.lantraDeepDivePromptAr : alert.lantraDeepDivePrompt;

  const handleAdjustWeights = () => {
    if (onAdjustWeightsForHedge) {
      onAdjustWeightsForHedge();
      setWeightsAdjusted(true);
      setTimeout(() => setWeightsAdjusted(false), 4000);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={alert.id}
        id="lantra-proactive-market-alert-banner"
        initial={{ opacity: 0, y: -34, scale: 0.97, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -24, scale: 0.97, filter: "blur(6px)", transition: { duration: 0.25 } }}
        transition={{
          type: "spring",
          damping: 24,
          stiffness: 280,
          mass: 0.75,
        }}
        className="mb-6 relative overflow-hidden rounded-2xl border border-rose-500/60 bg-gradient-to-r from-rose-950/95 via-zinc-950/95 to-amber-950/85 shadow-[0_12px_40px_rgba(225,29,72,0.28)] backdrop-blur-xl text-zinc-100 ring-1 ring-rose-500/20"
      >
        {/* Animated Top Accent Glow Beam */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.8)]" />

        {/* Ambient background glows */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-rose-500/20 blur-3xl rounded-full pointer-events-none animate-pulse" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />

        <div className="p-4 sm:p-5 relative z-10">
          {/* Top Bar: Alert Source & Fluctuation Metrics (Staggered Animation) */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
            className="flex flex-wrap items-center justify-between gap-3 mb-3"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/70 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <Flame size={13} className="text-rose-400 animate-bounce" />
                <span>{isAr ? "تنبيه لانـتـرا الاستباقي لتقلبات السوق" : "LANTRA PROACTIVE MARKET ALERT"}</span>
              </div>

              <span className="inline-flex items-center gap-1 bg-zinc-900/90 border border-white/15 px-2.5 py-1 rounded-full text-xs font-mono text-zinc-300">
                <Cpu size={12} className="text-cyan-400" />
                <span>{category}</span>
              </span>

              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 350, damping: 20 }}
                className="inline-flex items-center gap-1 bg-amber-950/90 border border-amber-500/60 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                <TrendingUp size={13} className="text-amber-400 animate-pulse" />
                <span>+{alert.percentChange}% {isAr ? "قفزة فورية" : "Spot Surge"}</span>
              </motion.div>
            </div>

            <div className="flex items-center gap-2">
              {onCycleNextAlert && (
                <button
                  onClick={onCycleNextAlert}
                  className="text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-white/15 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title={isAr ? "اختبار مادة خام أخرى" : "Simulate another raw material fluctuation"}
                >
                  <RotateCcw size={12} className="text-amber-400" />
                  <span className="hidden sm:inline">{isAr ? "محاكاة تقلب آخر" : "Simulate Next Fluctuation"}</span>
                </button>
              )}

              <button
                onClick={() => onDismiss(alert.id)}
                className="text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 p-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer active:scale-90"
                title={isAr ? "إغلاق التنبيه" : "Dismiss alert"}
                aria-label="Dismiss alert"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>

          {/* Main Alert Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="lg:col-span-8 space-y-2.5"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/25 border border-rose-500/50 text-rose-400 shrink-0 mt-0.5 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                  <AlertTriangle size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                    <span>{headline}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-1 font-sans">
                    {summary}
                  </p>
                </div>
              </div>

              {/* Live Spot vs Baseline Price Ticker */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
                <div className="bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xs">
                  <span className="text-zinc-400">{isAr ? "المادة المتأثرة:" : "Tracked Material:"}</span>
                  <span className="text-white font-bold">{materialName}</span>
                </div>
                <div className="bg-zinc-900/80 border border-rose-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xs">
                  <span className="text-zinc-400">{isAr ? "السعر الفوري الراهن:" : "Current Spot:"}</span>
                  <span className="text-rose-400 font-bold">{alert.currentSpotPrice}</span>
                </div>
                <div className="bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xs">
                  <span className="text-zinc-400">{isAr ? "السعر الأساسي المرجعي:" : "Baseline:"}</span>
                  <span className="text-zinc-400 line-through">{alert.baselinePrice}</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Strategic Action Panel */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, duration: 0.35 }}
              className="lg:col-span-4 flex flex-col gap-2 bg-zinc-900/80 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-lg"
            >
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap size={13} />
                <span>{isAr ? "إجراءات الحماية التعاقدية والتسعيرية" : "Proactive Mitigation Actions"}</span>
              </span>

              <button
                onClick={() => onOpenLantraWithPrompt(prompt)}
                className="w-full text-xs font-bold py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center justify-between gap-2 shadow-lg shadow-cyan-600/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-95"
              >
                <div className="flex items-center gap-2 text-left rtl:text-right truncate">
                  <LantraAvatar size="xs" showStatusIndicator={false} />
                  <span className="truncate">{isAr ? "استشارة لانـتـرا لصياغة حماية الأسعار" : "Consult LANTRA Strategic Advisory"}</span>
                </div>
                <ArrowRight size={14} className="shrink-0 rtl:rotate-180" />
              </button>

              {onAdjustWeightsForHedge && (
                <button
                  onClick={handleAdjustWeights}
                  className={`w-full text-xs font-bold py-2 px-3 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-95 ${
                    weightsAdjusted
                      ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-300"
                      : "bg-zinc-800/90 hover:bg-zinc-700 border-white/15 text-zinc-200 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <SlidersHorizontal size={13} className={weightsAdjusted ? "text-emerald-400" : "text-amber-400"} />
                    <span className="truncate">{isAr ? "رفع وزن السعر لحماية الميزانية (TCO +15%)" : "Hedge Scoring (TCO Weight +15%)"}</span>
                  </div>
                  {weightsAdjusted ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" /> : <ChevronRight size={13} className="shrink-0 rtl:rotate-180" />}
                </button>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1 pt-1 transition-colors cursor-pointer"
              >
                <span>{isExpanded ? (isAr ? "إخفاء تحليل أثر الموردين" : "Hide Vendor Impact Matrix") : (isAr ? "عرض أثر التقلب على كل مورد" : "View Vendor Impact Breakdown")}</span>
                <ChevronRight size={12} className={`transition-transform duration-200 rtl:rotate-180 ${isExpanded ? "rotate-90 rtl:rotate-90" : ""}`} />
              </button>
            </motion.div>
          </div>

          {/* Expandable Vendor Impact Grid */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
              >
                <div className="text-xs font-mono font-bold text-zinc-300 mb-2.5 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  <span>{isAr ? "مصفوفة تأثير قفزة الأسعار على الموردين المتنافسين:" : "Category Vendor Vulnerability & Exposure Analysis:"}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Meridian Solutions */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-emerald-300">Meridian Solutions</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        {isAr ? "محمي بالكامل 🟢" : "Shielded 🟢"}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {isAr
                        ? alert?.impactOnVendors?.meridian?.textAr || "عرض ميريديان محمي بتثبيت أسعار رسمي ومخزون محلي."
                        : alert?.impactOnVendors?.meridian?.text || "Meridian's bid includes certified price locks and local staging."}
                    </p>
                  </div>

                  {/* Ironclad Systems */}
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-amber-300">Ironclad Systems</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        {isAr ? "معرض للتضخم 🟡" : "Vulnerable 🟡"}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {isAr
                        ? alert?.impactOnVendors?.ironclad?.textAr || "عرض آيرون كلاد المفتوح يعرض التكلفة لتقلبات أسعار المكونات."
                        : alert?.impactOnVendors?.ironclad?.text || "Ironclad's open-quote BOM exposes RFQ to pass-through component escalation."}
                    </p>
                  </div>

                  {/* Vantage Systems */}
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-rose-300">Vantage Systems</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        {isAr ? "مخاطر حرجة 🔴" : "High Risk 🔴"}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {isAr
                        ? alert?.impactOnVendors?.vantage?.textAr || "مهلة التوريد الطويلة والاعتماد الخارجي يعرض العقد لمخاطر التضخم."
                        : alert?.impactOnVendors?.vantage?.text || "Extended lead time creates high exposure to market price surges."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
